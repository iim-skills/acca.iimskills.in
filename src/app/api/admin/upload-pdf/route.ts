import { NextRequest, NextResponse } from "next/server";
import db from "../../../../lib/db";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const STORAGE_DIR = "/var/www/storage/pdfs";

const PUBLIC_BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.PUBLIC_BASE_URL ||
  "https://acca.iimskills.in";

/* =========================
   FILE UTILS
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

function getFileNameFromUrl(pdfUrl: string) {
  try {
    const parts = pdfUrl.split("/storage/pdfs/");
    return parts[1] || "";
  } catch {
    return "";
  }
}

/* =========================
   GET → FETCH COURSES + PDFs
========================= */

export async function GET() {
  console.log("🔥 GET /api/admin/upload-pdf HIT");

  try {
    const [courseRows]: any = await db.query("SELECT * FROM courses");

    const courses = courseRows.map((course: any) => {
      let parsedData = { modules: [] };

      try {
        parsedData =
          typeof course.courseData === "string"
            ? JSON.parse(course.courseData)
            : course.courseData;
      } catch (err) {
        console.error("❌ JSON parse error:", err);
      }

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

    return NextResponse.json(
      { message: "Failed to fetch data" },
      { status: 500 }
    );
  }
}

/* =========================
   POST → UPLOAD PDF
========================= */

export async function POST(req: NextRequest) {
  console.log("🔥 POST /api/admin/upload-pdf HIT");

  try {
    const contentType = req.headers.get("content-type") || "";

    let courseId = "";
    let moduleId = "";
    let submoduleId = "";
    let name = "";
    let fileUrl = "";

    let uploadedFileName = "";
    let uploadedMimeType = "";
    let uploadedSize = 0;

    const isFormData = contentType.includes("multipart/form-data");

    /* =========================
       HANDLE FORM DATA
    ========================= */
    if (isFormData) {
      const formData = await req.formData();

      courseId = String(formData.get("courseId") || "");
      moduleId = String(formData.get("moduleId") || "");
      submoduleId = String(formData.get("submoduleId") || "");
      name = String(formData.get("name") || "");

      const file = formData.get("file") as File | null;
      const existingFileUrl = String(formData.get("fileUrl") || "");

      if (file && file.size > 0) {
        if (
          file.type !== "application/pdf" &&
          !file.name.toLowerCase().endsWith(".pdf")
        ) {
          return NextResponse.json(
            { message: "Only PDF files allowed" },
            { status: 400 }
          );
        }

        await fs.mkdir(STORAGE_DIR, { recursive: true });

        const safeName = safeFileName(file.name);
        const ext = path.extname(file.name).toLowerCase() || ".pdf";
        const uniqueName = `${Date.now()}-${randomUUID()}-${safeName}${ext}`;
        const filePath = path.join(STORAGE_DIR, uniqueName);
        const buffer = await fileToBuffer(file);

        await fs.writeFile(filePath, buffer);

        fileUrl = `${PUBLIC_BASE_URL}/storage/pdfs/${uniqueName}`;
        uploadedFileName = uniqueName;
        uploadedMimeType = file.type || "application/pdf";
        uploadedSize = file.size;
      } else if (existingFileUrl) {
        fileUrl = existingFileUrl;
      }
    } else {
      const body = await req.json();

      courseId = body.courseId;
      moduleId = body.moduleId;
      submoduleId = body.submoduleId;
      name = body.name;
      fileUrl = body.fileUrl;
    }

    console.log("📦 Incoming Data:", {
      courseId,
      moduleId,
      submoduleId,
      name,
      fileUrl,
    });

    if (!courseId || !moduleId || !submoduleId || !name || !fileUrl) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    /* =========================
       FETCH COURSE
    ========================= */
    const [rows]: any = await db.query(
      "SELECT * FROM courses WHERE courseId = ?",
      [courseId]
    );

    if (!rows.length) {
      return NextResponse.json(
        { message: "Course not found" },
        { status: 404 }
      );
    }

    const course = rows[0];

    let courseData =
      typeof course.courseData === "string"
        ? JSON.parse(course.courseData)
        : course.courseData;

    if (!courseData.modules) {
      courseData.modules = [];
    }

    /* =========================
       FIND MODULE
    ========================= */
    const module = courseData.modules.find(
      (m: any) => String(m.moduleId) === String(moduleId)
    );

    if (!module) {
      return NextResponse.json(
        { message: "Module not found" },
        { status: 404 }
      );
    }

    /* =========================
       FIND SUBMODULE
    ========================= */
    const submodule = module.submodules.find(
      (s: any) => String(s.submoduleId) === String(submoduleId)
    );

    if (!submodule) {
      return NextResponse.json(
        { message: "Submodule not found" },
        { status: 404 }
      );
    }

    if (!submodule.items) {
      submodule.items = [];
    }

    /* =========================
       CREATE PDF ITEM
    ========================= */
    const newItem = {
      type: "pdf",
      pdfId: "PDF_" + randomUUID(),
      name,
      fileUrl,
      fileName: uploadedFileName || undefined,
      mimeType: uploadedMimeType || undefined,
      size: uploadedSize || undefined,
    };

    submodule.items.unshift(newItem);

    /* =========================
       UPDATE JSON COURSE DATA
    ========================= */
    await db.query(
      "UPDATE courses SET courseData = ?, updatedAt = NOW() WHERE courseId = ?",
      [JSON.stringify(courseData), courseId]
    );

    /* =========================
       SAVE ALSO IN course_pdfs TABLE
    ========================= */
    const courseName = course.name || "";
    const moduleName = module.name || "";
    const submoduleName = submodule.name || "";

    await db.query(
      `INSERT INTO course_pdfs
        (course_id, course_name, module_id, module_name, submodule_id, submodule_name, pdf_name, pdf_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        courseId,
        courseName,
        moduleId,
        moduleName,
        submoduleId,
        submoduleName,
        name,
        fileUrl,
      ]
    );

    console.log("✅ Database updated + PDF table saved");

    return NextResponse.json({
      success: true,
      fileUrl,
      newItem,
    });
  } catch (error) {
    console.error("❌ SAVE ERROR:", error);

    return NextResponse.json(
      { message: "Save failed", error },
      { status: 500 }
    );
  }
}

/* =========================
   PUT → UPDATE PDF ROW
========================= */

export async function PUT(req: NextRequest) {
  console.log("🔥 PUT /api/admin/upload-pdf HIT");

  try {
    const body = await req.json();

    const {
      id,
      pdf_name,
      pdf_url,
      course_name,
      module_name,
      submodule_name,
    } = body;

    if (!id) {
      return NextResponse.json(
        { message: "ID is required" },
        { status: 400 }
      );
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (pdf_name !== undefined) {
      updates.push("pdf_name = ?");
      values.push(pdf_name);
    }

    if (pdf_url !== undefined) {
      updates.push("pdf_url = ?");
      values.push(pdf_url);
    }

    if (course_name !== undefined) {
      updates.push("course_name = ?");
      values.push(course_name);
    }

    if (module_name !== undefined) {
      updates.push("module_name = ?");
      values.push(module_name);
    }

    if (submodule_name !== undefined) {
      updates.push("submodule_name = ?");
      values.push(submodule_name);
    }

    if (!updates.length) {
      return NextResponse.json(
        { message: "No fields to update" },
        { status: 400 }
      );
    }

    values.push(id);

    await db.query(
      `UPDATE course_pdfs SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    return NextResponse.json({
      success: true,
      message: "PDF updated successfully",
    });
  } catch (error) {
    console.error("❌ UPDATE ERROR:", error);

    return NextResponse.json(
      { message: "Update failed" },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE → REMOVE PDF
========================= */

export async function DELETE(req: NextRequest) {
  console.log("🔥 DELETE /api/admin/upload-pdf HIT");

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "ID required" },
        { status: 400 }
      );
    }

    const [rows]: any = await db.query(
      "SELECT * FROM course_pdfs WHERE id = ?",
      [id]
    );

    if (!rows.length) {
      return NextResponse.json(
        { message: "PDF not found" },
        { status: 404 }
      );
    }

    const row = rows[0];
    const pdfUrl = row.pdf_url || "";

    /* =========================
       DELETE FILE FROM DISK
    ========================= */
    if (pdfUrl.includes("/storage/pdfs/")) {
      const fileName = getFileNameFromUrl(pdfUrl);

      if (fileName) {
        const filePath = path.join(STORAGE_DIR, fileName);
        try {
          await fs.unlink(filePath);
          console.log("🗑 File deleted:", filePath);
        } catch (err) {
          console.warn("⚠ File not found on disk or already deleted");
        }
      }
    }

    /* =========================
       DELETE FROM TABLE
    ========================= */
    await db.query("DELETE FROM course_pdfs WHERE id = ?", [id]);

    return NextResponse.json({
      success: true,
      message: "PDF deleted successfully",
    });
  } catch (error) {
    console.error("❌ DELETE ERROR:", error);

    return NextResponse.json(
      { message: "Delete failed" },
      { status: 500 }
    );
  }
}