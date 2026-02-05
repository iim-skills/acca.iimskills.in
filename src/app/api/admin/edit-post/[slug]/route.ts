import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const postsDir = path.join(process.cwd(), "data", "posts");

// ✅ GET a post by slug
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const filePath = path.join(postsDir, `${slug}.json`);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const postData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return NextResponse.json(postData);
}

// ✅ PUT update post by slug
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const filePath = path.join(postsDir, `${slug}.json`);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const updatedData = await req.json();
  fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2));

  return NextResponse.json({ success: true, post: updatedData });
}
