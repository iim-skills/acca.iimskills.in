import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const postsDir = path.join(process.cwd(), "data/posts");
const draftsDir = path.join(process.cwd(), "data/drafts_posts");

export async function GET(req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;

  const publishedPath = path.join(postsDir, `${slug}.json`);
  const draftPath = path.join(draftsDir, `${slug}.json`);

  if (fs.existsSync(publishedPath)) {
    const content = JSON.parse(fs.readFileSync(publishedPath, "utf-8"));
    return NextResponse.json(content);
  }

  if (fs.existsSync(draftPath)) {
    const content = JSON.parse(fs.readFileSync(draftPath, "utf-8"));
    return NextResponse.json(content);
  }

  return NextResponse.json({ error: "Post not found" }, { status: 404 });
}

export async function PUT(req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const body = await req.json();

  const publishedPath = path.join(postsDir, `${slug}.json`);
  const draftPath = path.join(draftsDir, `${slug}.json`);

  try {
    if (body.status === "published") {
      // ✅ Save to posts folder
      fs.writeFileSync(publishedPath, JSON.stringify(body, null, 2));

      // ✅ If exists in drafts folder, remove it
      if (fs.existsSync(draftPath)) {
        fs.unlinkSync(draftPath);
      }

      return NextResponse.json({ success: true, message: "Post published successfully", post: body });
    } else {
      // ✅ Save as draft
      fs.writeFileSync(draftPath, JSON.stringify(body, null, 2));

      return NextResponse.json({ success: true, message: "Draft saved successfully", post: body });
    }
  } catch (error) {
    console.error("Error saving post:", error);
    return NextResponse.json({ error: "Failed to save post" }, { status: 500 });
  }
}
