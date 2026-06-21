import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import db from "../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const DEFAULT_STORAGE_DIR =
  process.platform === "win32"
    ? path.join(process.cwd(), "public", "pdfs")
    : "/home/acca.iimskills.in/acca/public/pdfs";

const STORAGE_DIR =
  process.env.COURSE_MATERIAL_STORAGE_DIR?.trim() ||
  process.env.PDF_STORAGE_DIR?.trim() ||
  DEFAULT_STORAGE_DIR;

function getPublicBaseUrl(req: NextRequest) {
  const envUrl = process.env.PUBLIC_BASE_URL?.trim();
  if (envUrl) return envUrl.replace(/\/+$/, "");

  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    "acca.iimskills.in";

  const proto =
    req.headers.get("x-forwarded-proto") ||
    (host.includes("localhost") ? "http" : "https");

  return `${proto}://${host}`.replace(/\/+$/, "");
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

async function ensureStorageDir() {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
}

export async function POST(req: NextRequest) {
  try {
    await ensureStorageDir();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const requestedName = String(formData.get("name") || "").trim();
    const courseDbId = Number(formData.get("courseDbId") || 0);
    const courseName = String(formData.get("courseName") || "").trim();
    const moduleId = String(formData.get("moduleId") || "").trim();
    const moduleName = String(formData.get("moduleName") || "").trim();

    if (!file) {
      return NextResponse.json({ message: "File required" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { message: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: "File too large (max 100MB)" },
        { status: 400 }
      );
    }

    const safeName = safeFileName(file.name);
    const uniqueName = `${Date.now()}-${randomUUID()}-${safeName}.pdf`;
    const filePath = path.join(STORAGE_DIR, uniqueName);
    const buffer = Buffer.from(await file.arrayBuffer());

    await fs.writeFile(filePath, buffer);

    const baseUrl = getPublicBaseUrl(req);
    const fileUrl = `${baseUrl}/pdfs/${uniqueName}`;
    const materialName =
      requestedName || file.name || "Full Study Material";

    let metadataSaved = false;
    if (courseDbId && moduleId) {
      try {
        const [courseRows]: any = await db.query(
          "SELECT id, courseId, name FROM courses WHERE id = ? LIMIT 1",
          [courseDbId]
        );

        const courseRow = Array.isArray(courseRows) ? courseRows[0] : null;
        const courseIdentifier = String(
          courseRow?.courseId ?? courseRow?.id ?? courseDbId
        );
        const resolvedCourseName =
          String(courseRow?.name ?? courseName).trim() || "Unknown Course";
        const resolvedModuleName = moduleName || "Module";

        await db.query(
          `INSERT INTO course_pdfs
            (course_id, course_name, module_id, module_name, submodule_id, submodule_name, pdf_name, pdf_url)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            courseIdentifier,
            resolvedCourseName,
            moduleId,
            resolvedModuleName,
            `FULL_STUDY_${moduleId}`,
            "Module Full Study Material",
            materialName,
            fileUrl,
          ]
        );

        metadataSaved = true;
      } catch (metadataError) {
        console.error(
          "UPLOAD COURSE MATERIAL METADATA ERROR:",
          metadataError
        );
      }
    }

    return NextResponse.json({
      success: true,
      fileUrl,
      name: materialName,
      metadataSaved,
    });
  } catch (error) {
    console.error("UPLOAD COURSE MATERIAL ERROR:", error);

    return NextResponse.json(
      { message: "Upload failed", error: String(error) },
      { status: 500 }
    );
  }
}
