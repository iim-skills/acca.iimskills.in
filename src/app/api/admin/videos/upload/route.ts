export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const MAX_SIZE = 500 * 1024 * 1024; // 500MB
const STORAGE_ROOT = "/var/www/storage/videos";
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || "https://acca.iimskills.in";

/* =====================================================
   Convert File → Buffer
===================================================== */
async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/* =====================================================
   API ROUTE
===================================================== */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    /* ================= VALIDATION ================= */
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.type.startsWith("video/")) {
      return NextResponse.json(
        { error: "Only video files allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large (max 500MB)" },
        { status: 400 }
      );
    }

    console.log(
      `📥 Upload started: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`
    );

    /* ================= CREATE DIRECTORY ================= */
    await fs.mkdir(STORAGE_ROOT, { recursive: true });

    /* ================= FILE NAME ================= */
    const ext = path.extname(file.name) || ".mp4";
    const fileName = `${Date.now()}-${crypto.randomUUID()}${ext}`;

    const filePath = path.join(STORAGE_ROOT, fileName);

    /* ================= SAVE FILE ================= */
    const buffer = await fileToBuffer(file);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `${PUBLIC_BASE_URL}/storage/videos/${fileName}`;

    console.log("✅ Upload success:", publicUrl);

    /* ================= RESPONSE ================= */
    return NextResponse.json({
      success: true,
      secure_url: publicUrl,
      url: publicUrl,
      file_name: fileName,
      original_name: file.name,
      size: file.size,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("🔥 UPLOAD ERROR:", message);

    return NextResponse.json(
      { error: "Upload failed", details: message },
      { status: 500 }
    );
  }
}