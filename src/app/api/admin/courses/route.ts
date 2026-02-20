import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

/* =====================================================
   GET ALL COURSES
===================================================== */
export async function GET() {
  try {
    const [rows]: any = await db.query("SELECT * FROM courses ORDER BY id DESC");

    const parsed = rows.map((c: any) => ({
      ...c,
      courseData:
        typeof c.courseData === "string"
          ? JSON.parse(c.courseData || '{"modules":[]}')
          : c.courseData || { modules: [] },
    }));

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("GET /courses error:", err);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}

/* =====================================================
   CREATE NEW COURSE
===================================================== */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = body.name?.trim();
    const slug = body.slug?.trim();
    const courseData = body.courseData || { modules: [] };

    if (!name || !slug) {
      return NextResponse.json(
        { error: "name and slug are required" },
        { status: 400 }
      );
    }

    // Check unique slug
    const [exists]: any = await db.execute(
      "SELECT id FROM courses WHERE slug = ? LIMIT 1",
      [slug]
    );
    if (exists.length > 0) {
      return NextResponse.json(
        { error: "slug already exists" },
        { status: 409 }
      );
    }

    const jsonStr = JSON.stringify(courseData);

    // Insert
    const [result]: any = await db.execute(
      "INSERT INTO courses (name, slug, courseData) VALUES (?, ?, ?)",
      [name, slug, jsonStr]
    );

    const newCourse = {
      id: result.insertId,
      name,
      slug,
      courseData,
    };

    return NextResponse.json(newCourse, { status: 201 });
  } catch (err) {
    console.error("POST /courses error:", err);
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}