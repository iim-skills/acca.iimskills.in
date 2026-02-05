import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: { path: string[] } }
) {
  try {
    const resolvedParams = await params; 
    const filePath = path.join(process.cwd(), "uploads", ...resolvedParams.path);

    console.log("Attempting to read file at:", filePath);

    const data = await fs.readFile(filePath);

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
    };

    return new NextResponse(data, {
      headers: { 
        "Content-Type": mimeTypes[ext] || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable" 
      },
    });
  } catch (error: any) {
    // This will tell you if it's "Entry not found" or "Permission denied"
    console.error("API Uploads Error:", error.message); 
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
