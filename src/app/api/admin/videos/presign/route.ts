// src/app/api/admin/videos/presign/route.ts
import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION;
const bucket = process.env.AWS_S3_BUCKET;

const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const filename = body.filename;
    const contentType = body.contentType || "video/mp4";

    if (!filename) {
      return NextResponse.json({ error: "filename required" }, { status: 400 });
    }
    if (!bucket || !region) {
      return NextResponse.json({ error: "S3 not configured" }, { status: 500 });
    }

    // choose a key structure
    const key = `videos/${Date.now()}_${filename}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      // If you want the uploaded file public, you may set ACL: "public-read" here and include it in presign
      // ACL: "public-read",
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 10 }); // 10 minutes

    const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    return NextResponse.json({ url: signedUrl, key, publicUrl });
  } catch (err: any) {
    console.error("PRESIGN ERROR:", err);
    return NextResponse.json({ error: "Presign failed" }, { status: 500 });
  }
}