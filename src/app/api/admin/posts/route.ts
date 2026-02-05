import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const postsDir = path.join(process.cwd(), "data/posts");

export async function GET() {
  if (!fs.existsSync(postsDir)) {
    return NextResponse.json([]);
  }

  const files = fs.readdirSync(postsDir).filter(f => f.endsWith(".json"));

  // only pick key fields for listing (avoid loading full content of 4000+ posts into dropdown)
  const posts = files.map((file) => {
    const content = JSON.parse(fs.readFileSync(path.join(postsDir, file), "utf-8"));
    return {
      title: content.title || "Untitled",
      slug: content.slug || file.replace(".json", ""),
      date: content.date || "",
      url: content.url || "",
    };
  });

  return NextResponse.json(posts);
}
