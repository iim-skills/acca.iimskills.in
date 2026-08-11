import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("image");
  if (!(file instanceof File) || !ALLOWED_TYPES.has(file.type) || file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Upload a JPG, PNG, WEBP, or GIF image up to 5 MB." }, { status: 400 });
  }

  const extension = ({ "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif" } as Record<string, string>)[file.type];
  const filename = `${randomUUID()}${extension}`;
  const directory = path.join(process.cwd(), "uploads", "quiz-images");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ url: `/api/uploads/quiz-images/${filename}` });
}
