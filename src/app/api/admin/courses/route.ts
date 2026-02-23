import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

/* =====================================================
   DB CONNECTION
===================================================== */

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

/* =====================================================
   GET ALL COURSES
   ⭐ Returns modules directly for frontend
===================================================== */
export async function GET() {
  try {
    const [rows]: any = await db.query(
      "SELECT * FROM courses ORDER BY id DESC"
    );

    const parsed = rows.map((c: any) => {
      let courseData;

      // 🔥 Safely parse JSON from LONGTEXT
      try {
        courseData =
          typeof c.courseData === "string"
            ? JSON.parse(c.courseData || '{"modules":[]}')
            : c.courseData || { modules: [] };
      } catch {
        courseData = { modules: [] };
      }

      return {
        id: c.id,
        courseId: c.courseId,
        slug: c.slug,
        name: c.name,
        description: c.description,

        // ⭐⭐⭐ VERY IMPORTANT FOR VIDEO ADMIN ⭐⭐⭐
        modules: courseData.modules || [],

        // optional — keep full data if needed elsewhere
        courseData,

        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      };
    });

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("GET /courses error:", err);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
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
    const description = body.description || "";
    const courseId = body.courseId || null;

    // default structure
    const courseData = body.courseData || { modules: [] };

    if (!name || !slug) {
      return NextResponse.json(
        { error: "name and slug are required" },
        { status: 400 }
      );
    }

    /* ===== Check unique slug ===== */
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

    /* ===== Insert ===== */
    const [result]: any = await db.execute(
      `INSERT INTO courses 
      (courseId, name, slug, description, courseData) 
      VALUES (?, ?, ?, ?, ?)`,
      [courseId, name, slug, description, jsonStr]
    );

    const newCourse = {
      id: result.insertId,
      courseId,
      name,
      slug,
      description,
      modules: courseData.modules || [],
      courseData,
    };

    return NextResponse.json(newCourse, { status: 201 });
  } catch (err) {
    console.error("POST /courses error:", err);
    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 }
    );
  }
}