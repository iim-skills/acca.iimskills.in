import { NextResponse } from "next/server";
import db from "../../../../../lib/db";

export async function POST(req: Request) {
  try {
    const { id, name, slug } = await req.json();

    if (!id || !name || !slug) {
      return NextResponse.json(
        { error: "id, name and slug are required" },
        { status: 400 }
      );
    }

    /* check duplicate slug (excluding current course) */
    const [exists]: any = await db.execute(
      "SELECT id FROM courses WHERE slug = ? AND id != ? LIMIT 1",
      [slug, id]
    );

    if (exists.length > 0) {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 409 }
      );
    }

    const [result]: any = await db.execute(
      `UPDATE courses 
       SET name = ?, slug = ?, updatedAt = NOW() 
       WHERE id = ?`,
      [name, slug, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("UPDATE COURSE ERROR:", error);

    return NextResponse.json(
      { error: "Failed to update course" },
      { status: 500 }
    );
  }
}