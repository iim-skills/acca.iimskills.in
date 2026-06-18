import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  console.log("🔥 Upload API HIT");

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to public directory so it can be served by Next.js directly
    const uploadDir = path.join(process.cwd(), "public", "pdfs");
    console.log("STORAGE_DIR:", uploadDir);
    
    // Ensure directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    // Generate unique filename to prevent overwriting
    const uniqueName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(uploadDir, uniqueName);

    await fs.writeFile(filePath, buffer);

    // Return the public URL
    const fileUrl = `/pdfs/${uniqueName}`;

    return NextResponse.json({ success: true, url: fileUrl, secure_url: fileUrl }, { status: 200 });
  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}