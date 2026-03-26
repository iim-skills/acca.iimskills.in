export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // ✅ Prevent Vercel timeout

import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import type {
  UploadApiResponse,
  UploadApiErrorResponse,
  UploadApiOptions, // ✅ FIXED TYPE
} from "cloudinary";

/* =====================================================
   CLOUDINARY CONFIG
===================================================== */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const MAX_SIZE = 500 * 1024 * 1024; // 500MB

/* =====================================================
   HELPERS
===================================================== */

/** Convert File → Buffer */
async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/** Upload to Cloudinary (FIXED TYPE ISSUE HERE) */
function uploadToCloudinary(
  buffer: Buffer,
  options: UploadApiOptions // ✅ FIX APPLIED
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options,
      (
        error: UploadApiErrorResponse | undefined,
        response: UploadApiResponse | undefined
      ) => {
        if (error || !response) {
          reject(error ?? new Error("No response from Cloudinary"));
        } else {
          resolve(response);
        }
      }
    );

    stream.end(buffer);
  });
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
        { error: "Only video files are allowed" },
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
      `📥 Upload started: ${file.name} (${(
        file.size /
        1024 /
        1024
      ).toFixed(1)} MB)`
    );

    /* ================= UPLOAD ================= */
    const buffer = await fileToBuffer(file);

    const result = await uploadToCloudinary(buffer, {
      resource_type: "video", // ✅ NOW WORKS
      folder: "lms_videos",
      timeout: 600000, // 10 minutes
    });

    console.log("✅ Upload success:", result.secure_url);

    /* ================= RESPONSE ================= */
    return NextResponse.json({
      success: true,
      secure_url: result.secure_url,
      thumb_url: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload/so_1/${result.public_id}.jpg`,
      public_id: result.public_id,
      duration: Math.round(result.duration ?? 0),
      format: result.format,
      size: result.bytes,
      original_name: file.name,
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