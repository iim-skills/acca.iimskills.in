import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const baseDir = path.join(process.cwd(), "data");

function moveFile(from: string, to: string) {
  if (fs.existsSync(from)) {
    if (!fs.existsSync(path.dirname(to))) {
      fs.mkdirSync(path.dirname(to), { recursive: true });
    }
    fs.renameSync(from, to); // move file
  }
}

export async function POST(req: Request) {
  try {
    const { slug, action } = await req.json();
    if (!slug || !action) {
      return NextResponse.json({ error: "Slug and action required" }, { status: 400 });
    }

    const postsDir = path.join(baseDir, "posts");
    const draftsDir = path.join(baseDir, "drafts_posts");
    const trashDir = path.join(baseDir, "trash_posts");

    const postFile = path.join(postsDir, `${slug}.json`);
    const draftFile = path.join(draftsDir, `${slug}.json`);
    const trashFile = path.join(trashDir, `${slug}.json`);

    switch (action) {
      case "trash":
        if (fs.existsSync(postFile)) moveFile(postFile, trashFile);
        else if (fs.existsSync(draftFile)) moveFile(draftFile, trashFile);
        return NextResponse.json({ message: "Post moved to trash" });

      case "restore":
        if (fs.existsSync(trashFile)) moveFile(trashFile, draftFile);
        return NextResponse.json({ message: "Post restored to drafts" });

      case "delete":
        if (fs.existsSync(trashFile)) fs.unlinkSync(trashFile);
        return NextResponse.json({ message: "Post permanently deleted" });

      case "view":
        return NextResponse.json({ url: `/blog/${slug}` });

      case "edit":
        return NextResponse.json({ url: `/admin/edit/${slug}` });

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    console.error("Error in post action:", err);
    return NextResponse.json({ error: "Failed to process action" }, { status: 500 });
  }
}
