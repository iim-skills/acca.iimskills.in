// app/api/admin/update-course/route.ts
import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // expecting { id, name, slug, description, courseData }
    const id = Number(body.id || 0);
    if (!id) {
      return NextResponse.json({ error: "course id is required" }, { status: 400 });
    }

    const name = (body.name ?? "").toString().trim();
    const slug = (body.slug ?? "").toString().trim();
    const description = (body.description ?? "").toString();
    const courseData = body.courseData ?? { modules: [] };

    // validate minimal fields
    if (!name || !slug) {
      return NextResponse.json({ error: "name and slug are required" }, { status: 400 });
    }

    // stringify courseData safely
    let jsonStr: string;
    try {
      jsonStr = JSON.stringify(courseData);
    } catch (e) {
      console.error("Invalid courseData JSON", e);
      return NextResponse.json({ error: "Invalid courseData" }, { status: 400 });
    }

    // Optional: check slug unique for other courses
    const [slugRows]: any = await db.execute("SELECT id FROM courses WHERE slug = ? AND id <> ? LIMIT 1", [slug, id]);
    if (slugRows.length > 0) {
      return NextResponse.json({ error: "slug already used by another course" }, { status: 409 });
    }

    // Update row
    await db.execute(
      `UPDATE courses SET name = ?, slug = ?, description = ?, courseData = ?, updatedAt = NOW() WHERE id = ?`,
      [name, slug, description, jsonStr, id]
    );

    // Return the saved record (re-query)
    const [rows]: any = await db.execute("SELECT * FROM courses WHERE id = ? LIMIT 1", [id]);
    const row = Array.isArray(rows) && rows.length ? rows[0] : null;
    if (!row) {
      return NextResponse.json({ error: "Course not found after update" }, { status: 500 });
    }

    let parsedCourseData;
    try {
      parsedCourseData = typeof row.courseData === "string" ? JSON.parse(row.courseData) : row.courseData;
    } catch {
      parsedCourseData = { modules: [] };
    }

    const response = {
      id: row.id,
      courseId: row.courseId ?? null,
      name: row.name,
      slug: row.slug,
      description: row.description,
      modules: parsedCourseData.modules || [],
      courseData: parsedCourseData,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("POST /api/admin/update-course error:", err);
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
  }
}