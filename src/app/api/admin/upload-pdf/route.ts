import { NextRequest, NextResponse } from "next/server";
import db from "../../../../lib/db";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import os from "os";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/* =========================
   STORAGE CONFIG
========================= */

const STORAGE_DIR = "/home/acca.iimskills.in/acca/storage/pdfs";
const PUBLIC_BASE_URL = "http://acca.iimskills.in";

/* =========================
   HELPERS
========================= */

async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function safeFileName(originalName: string) {
  const base = path
    .parse(originalName || "file")
    .name
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 60);

  return base || "file";
}

function getFileNameFromUrl(url: string) {
  return url.split("/storage/pdfs/")[1] || "";
}

/* =========================
   DEBUG SYSTEM INFO
========================= */

async function debugSystem() {
  try {
    console.log("========== DEBUG START ==========");
    console.log("👤 USER:", os.userInfo().username);
    console.log("📁 CWD:", process.cwd());
    console.log("📂 STORAGE_DIR:", STORAGE_DIR);

    try {
      const exists = await fs.stat(STORAGE_DIR);
      console.log("✅ STORAGE EXISTS:", exists.isDirectory());
    } catch {
      console.log("❌ STORAGE DOES NOT EXIST");
    }

    try {
      const files = await fs.readdir(STORAGE_DIR);
      console.log("📄 CURRENT FILES:", files);
    } catch (err) {
      console.log("❌ READ DIR ERROR:", err);
    }

    console.log("========== DEBUG END ==========");
  } catch (err) {
    console.error("❌ DEBUG ERROR:", err);
  }
}

/* =========================
   GET → COURSES + PDF LIST
========================= */

export async function GET() {
  await debugSystem();

  try {
    const [courseRows]: any = await db.query("SELECT * FROM courses");

    const courses = courseRows.map((course: any) => {
      let parsedData = { modules: [] };

      try {
        parsedData =
          typeof course.courseData === "string"
            ? JSON.parse(course.courseData)
            : course.courseData;
      } catch {}

      return {
        courseId: course.courseId,
        name: course.name,
        courseData: parsedData,
      };
    });

    const [pdfRows]: any = await db.query(
      "SELECT * FROM course_pdfs ORDER BY id DESC"
    );

    return NextResponse.json({
      courses,
      pdfs: pdfRows,
    });
  } catch (error) {
    console.error("❌ GET ERROR:", error);
    return NextResponse.json({ message: "GET failed" }, { status: 500 });
  }
}

/* =========================
   POST → UPLOAD PDF
========================= */

export async function POST(req: NextRequest) {
  await debugSystem();

  try {
    const formData = await req.formData();

    const courseId = String(formData.get("courseId") || "");
    const moduleId = String(formData.get("moduleId") || "");
    const submoduleId = String(formData.get("submoduleId") || "");
    const name = String(formData.get("name") || "");

    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ message: "File required" }, { status: 400 });
    }

    console.log("📥 FILE RECEIVED:", file.name);
    console.log("📊 FILE SIZE:", file.size);

    /* =========================
       SAVE FILE
    ========================= */

    await fs.mkdir(STORAGE_DIR, { recursive: true });

    const safeName = safeFileName(file.name);
    const uniqueName = `${Date.now()}-${randomUUID()}-${safeName}.pdf`;

    const filePath = `${STORAGE_DIR}/${uniqueName}`;

    console.log("📁 FINAL SAVE PATH:", filePath);

    const buffer = await fileToBuffer(file);
    console.log("📦 BUFFER SIZE:", buffer.length);

    try {
      await fs.writeFile(filePath, buffer);
      console.log("✅ FILE WRITE SUCCESS");

      // VERIFY FILE EXISTS
      try {
        const stat = await fs.stat(filePath);
        console.log("📊 FILE VERIFIED SIZE:", stat.size);
      } catch {
        console.log("❌ FILE NOT FOUND AFTER WRITE");
      }

    } catch (err) {
      console.error("❌ FILE SAVE ERROR:", err);
      return NextResponse.json(
        { message: "File write failed" },
        { status: 500 }
      );
    }

    const fileUrl = `${PUBLIC_BASE_URL}/storage/pdfs/${uniqueName}`;
    console.log("🌐 FILE URL:", fileUrl);

    /* =========================
       FETCH COURSE
    ========================= */

    const [rows]: any = await db.query(
      "SELECT * FROM courses WHERE courseId = ?",
      [courseId]
    );

    if (!rows.length) {
      console.log("❌ COURSE NOT FOUND");
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    const course = rows[0];

    let courseData =
      typeof course.courseData === "string"
        ? JSON.parse(course.courseData)
        : course.courseData;

    const module = courseData.modules.find(
      (m: any) => String(m.moduleId) === String(moduleId)
    );

    const submodule = module?.submodules.find(
      (s: any) => String(s.submoduleId) === String(submoduleId)
    );

    if (!module || !submodule) {
      console.log("❌ MODULE / SUBMODULE NOT FOUND");
      return NextResponse.json(
        { message: "Module/Submodule not found" },
        { status: 404 }
      );
    }

    if (!submodule.items) submodule.items = [];

    const newItem = {
      type: "pdf",
      pdfId: "PDF_" + randomUUID(),
      name,
      fileUrl,
    };

    submodule.items.unshift(newItem);

    await db.query(
      "UPDATE courses SET courseData = ? WHERE courseId = ?",
      [JSON.stringify(courseData), courseId]
    );

    console.log("✅ COURSE JSON UPDATED");

    await db.query(
      `INSERT INTO course_pdfs
      (course_id, course_name, module_id, module_name, submodule_id, submodule_name, pdf_name, pdf_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        courseId,
        course.name,
        moduleId,
        module.name,
        submoduleId,
        submodule.name,
        name,
        fileUrl,
      ]
    );

    console.log("✅ DB INSERT SUCCESS");

    return NextResponse.json({
      success: true,
      fileUrl,
    });

  } catch (error) {
    console.error("❌ UPLOAD ERROR:", error);
    return NextResponse.json({ message: "Upload failed" }, { status: 500 });
  }
}

/* =========================
   DELETE → REMOVE PDF
========================= */

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    const [rows]: any = await db.query(
      "SELECT * FROM course_pdfs WHERE id = ?",
      [id]
    );

    if (!rows.length) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const pdfUrl = rows[0].pdf_url;
    const fileName = getFileNameFromUrl(pdfUrl);

    if (fileName) {
      const filePath = `${STORAGE_DIR}/${fileName}`;
      console.log("🗑 DELETE PATH:", filePath);

      try {
        await fs.unlink(filePath);
        console.log("✅ FILE DELETED");
      } catch (err) {
        console.warn("⚠ FILE NOT FOUND OR DELETE FAILED");
      }
    }

    await db.query("DELETE FROM course_pdfs WHERE id = ?", [id]);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("❌ DELETE ERROR:", error);
    return NextResponse.json({ message: "Delete failed" }, { status: 500 });
  }
}