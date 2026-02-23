export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

/* =====================================================
   CLOUDINARY CONFIG
===================================================== */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

/* =====================================================
   UPLOAD VIDEO TO CLOUDINARY (LMS OPTIMIZED)
===================================================== */

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    /* ================= VALIDATION ================= */

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // ✅ allow only video
    if (!file.type.startsWith("video/")) {
      return NextResponse.json(
        { error: "Only video files allowed" },
        { status: 400 }
      );
    }

    // ⭐ Optional size limit (500MB example)
    const MAX_SIZE = 500 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large (max 500MB)" },
        { status: 400 }
      );
    }

    /* ================= FILE → BUFFER ================= */

    const buffer = Buffer.from(await file.arrayBuffer());

    /* ================= CLOUDINARY UPLOAD ================= */

    const result: any = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "video",
          folder: "lms_videos",

          // ⭐ Important for LMS videos
          chunk_size: 6000000,

          // auto thumbnail
          eager: [
            {
              format: "jpg",
              transformation: [
                { width: 320, height: 180, crop: "fill" },
              ],
            },
          ],
        },
        (error, response) => {
          if (error) reject(error);
          else resolve(response);
        }
      );

      stream.end(buffer);
    });

    /* ================= RESPONSE ================= */

    return NextResponse.json({
      secure_url: result.secure_url,
      public_id: result.public_id,
      thumb_url: result.eager?.[0]?.secure_url || null,
      duration: Math.round(result.duration || 0),
    });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);

    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}