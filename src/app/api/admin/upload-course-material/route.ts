import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const STORAGE_DIR = "/home/acca.iimskills.in/acca/public/pdfs";

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

    return NextResponse.json({
      success: true,
      fileUrl,
      name: requestedName || file.name || "Full Study Material",
    });
  } catch (error) {
    console.error("UPLOAD COURSE MATERIAL ERROR:", error);

    return NextResponse.json(
      { message: "Upload failed", error: String(error) },
      { status: 500 }
    );
  }
}
