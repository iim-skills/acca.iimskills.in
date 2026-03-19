// export const runtime = "nodejs";

// import { NextResponse } from "next/server";
// import { v2 as cloudinary } from "cloudinary";

// /* =====================================================
//    CLOUDINARY CONFIG
// ===================================================== */

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
//   api_key: process.env.CLOUDINARY_API_KEY!,
//   api_secret: process.env.CLOUDINARY_API_SECRET!,
// });

// /* =====================================================
//    UPLOAD VIDEO TO CLOUDINARY (LMS OPTIMIZED)
// ===================================================== */

// export async function POST(req: Request) {
//   try {
//     const formData = await req.formData();
//     const file = formData.get("file") as File | null;

//     console.log("📥 File received:", file?.name);

//     /* ================= VALIDATION ================= */

//     if (!file) {
//       console.log("❌ No file provided");
//       return NextResponse.json(
//         { error: "No file provided" },
//         { status: 400 }
//       );
//     }

//     if (!file.type.startsWith("video/")) {
//       console.log("❌ Invalid file type:", file.type);
//       return NextResponse.json(
//         { error: "Only video files allowed" },
//         { status: 400 }
//       );
//     }

//     const MAX_SIZE = 500 * 1024 * 1024;
//     if (file.size > MAX_SIZE) {
//       console.log("❌ File too large:", file.size);
//       return NextResponse.json(
//         { error: "File too large (max 500MB)" },
//         { status: 400 }
//       );
//     }

//     /* ================= FILE → BUFFER ================= */

//     const buffer = Buffer.from(await file.arrayBuffer());

//     console.log("⚙ Uploading to Cloudinary...");

//     /* ================= CLOUDINARY UPLOAD ================= */

//     const result: any = await new Promise((resolve, reject) => {
//       const stream = cloudinary.uploader.upload_stream(
//         {
//           resource_type: "video",
//           folder: "lms_videos",
//           chunk_size: 6000000,

//           eager: [
//             {
//               format: "jpg",
//               transformation: [
//                 { width: 320, height: 180, crop: "fill" },
//               ],
//             },
//           ],
//         },
//         (error, response) => {
//           if (error) {
//             console.error("❌ Cloudinary error:", error);
//             reject(error);
//           } else {
//             resolve(response);
//           }
//         }
//       );

//       stream.end(buffer);
//     });

//     console.log("✅ Upload success:", result.secure_url);

//     /* ================= RESPONSE ================= */

//     return NextResponse.json({
//       // ✅ IMPORTANT FOR DB
//       name: file.name,

//       // ✅ MAIN URL
//       url: result.secure_url,

//       // ✅ OPTIONAL FIELDS (use if available)
//       public_id: result.public_id,
//       thumbnail: result.eager?.[0]?.secure_url || null,
//       duration: Math.round(result.duration || 0),
//       format: result.format,
//       bytes: result.bytes,
//     });
//   } catch (err: any) {
//     console.error("🔥 UPLOAD ERROR:", err.message);

//     return NextResponse.json(
//       {
//         error: "Upload failed",
//         details: err.message,
//       },
//       { status: 500 }
//     );
//   }
// }

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
   UPLOAD VIDEO
===================================================== */

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    console.log("📥 File received:", file?.name);

    /* ================= VALIDATION ================= */

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("video/")) {
      return NextResponse.json(
        { error: "Only video files allowed" },
        { status: 400 }
      );
    }

    const MAX_SIZE = 500 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large (max 500MB)" },
        { status: 400 }
      );
    }

    /* ================= FILE → BUFFER ================= */

    const buffer = Buffer.from(await file.arrayBuffer());

    console.log("⚙ Uploading to Cloudinary...");

    /* ================= CLOUDINARY UPLOAD ================= */

    const result: any = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "video",
          folder: "lms_videos",
          chunk_size: 6000000,

          // ✅ thumbnail generate (first frame)
          eager: [
            {
              format: "jpg",
              transformation: [
                { width: 480, height: 270, crop: "fill" },
                { quality: "auto" },
              ],
            },
          ],
        },
        (error, response) => {
          if (error) {
            console.error("❌ Cloudinary error:", error);
            reject(error);
          } else {
            resolve(response);
          }
        }
      );

      stream.end(buffer);
    });

    console.log("✅ Upload success:", result.secure_url);

    /* ================= FORMAT RESPONSE ================= */

    const secureUrl = result.secure_url;
    const publicId = result.public_id;

    // ✅ thumbnail (important for gallery)
    const thumbUrl =
      result.eager?.[0]?.secure_url ||
      `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload/so_1/${publicId}.jpg`;

    /* ================= RESPONSE ================= */

    return NextResponse.json({
      success: true,

      // 🎯 frontend use
      secure_url: secureUrl,
      thumb_url: thumbUrl,

      // 📦 metadata
      public_id: publicId,
      duration: Math.round(result.duration || 0),

      // optional
      original_name: file.name,
      format: result.format,
      size: result.bytes,
    });
  } catch (err: any) {
    console.error("🔥 UPLOAD ERROR:", err);

    return NextResponse.json(
      {
        error: "Upload failed",
        details: err.message,
      },
      { status: 500 }
    );
  }
}