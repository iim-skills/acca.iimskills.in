import { NextRequest, NextResponse } from "next/server";
import db from "../../../../lib/db";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const STORAGE_DIR =
  process.env.NODE_ENV === "production"
    ? "/home/acca.iimskills.in/acca/public/pdfs"
    : path.join(process.cwd(), "public/pdfs");

const PUBLIC_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://acca.iimskills.in"
    : "http://localhost:3000";

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
  try {
    return new URL(url).pathname.split("/pdfs/")[1] || "";
  } catch {
    return url.split("/pdfs/")[1] || "";
  }
}

async function ensureStorageDir() {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
}

export async function GET() {
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

    return NextResponse.json({ courses, pdfs: pdfRows });
  } catch (error) {
    console.error("GET ERROR:", error);
    return NextResponse.json({ message: "GET failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureStorageDir();

    const formData = await req.formData();

    const courseId = String(formData.get("courseId") || "");
    const moduleId = String(formData.get("moduleId") || "");
    const submoduleId = String(formData.get("submoduleId") || "");
    const name = String(formData.get("name") || "");

    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ message: "File required" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { message: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: "File too large (max 100MB)" },
        { status: 400 }
      );
    }

    const [rows]: any = await db.query(
      "SELECT * FROM courses WHERE courseId = ?",
      [courseId]
    );

    if (!rows.length) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    const course = rows[0];

    let courseData =
      typeof course.courseData === "string"
        ? JSON.parse(course.courseData)
        : course.courseData;

    const module = courseData.modules?.find(
      (m: any) => String(m.moduleId) === String(moduleId)
    );

    const submodule = module?.submodules?.find(
      (s: any) => String(s.submoduleId) === String(submoduleId)
    );

    if (!module || !submodule) {
      return NextResponse.json(
        { message: "Module/Submodule not found" },
        { status: 404 }
      );
    }

    const safeName = safeFileName(file.name);
    const uniqueName = `${Date.now()}-${randomUUID()}-${safeName}.pdf`;
    const filePath = path.join(STORAGE_DIR, uniqueName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await fs.writeFile(filePath, buffer);

    const fileUrl = `${PUBLIC_BASE_URL}/pdfs/${uniqueName}`;

    if (!submodule.items) submodule.items = [];

    submodule.items.unshift({
      type: "pdf",
      pdfId: "PDF_" + randomUUID(),
      name,
      fileUrl,
    });

    await db.query("UPDATE courses SET courseData = ? WHERE courseId = ?", [
      JSON.stringify(courseData),
      courseId,
    ]);

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
        submodule.title || submodule.name,
        name,
        fileUrl,
      ]
    );

    return NextResponse.json({
      success: true,
      fileUrl,
      name,
    });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    return NextResponse.json({ message: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "ID required" }, { status: 400 });
    }

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
      const filePath = path.join(STORAGE_DIR, fileName);
      try {
        await fs.unlink(filePath);
      } catch {
        console.warn("File not found on disk:", filePath);
      }
    }

    await db.query("DELETE FROM course_pdfs WHERE id = ?", [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE ERROR:", error);
    return NextResponse.json({ message: "Delete failed" }, { status: 500 });
  }
}