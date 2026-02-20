import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Generate unique courseId
function generateCourseId() {
  return "COURSE_" + Date.now();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { id, name, slug, description, courseData } = body;
    const jsonData = JSON.stringify(courseData || { modules: [] });

    console.log("UPSERT BODY:", body);

    // Check if row exists
    const [rows]: any = await db.query(
      "SELECT id FROM courses WHERE id = ? LIMIT 1",
      [id]
    );

    const exists = rows.length > 0;

    if (!exists) {
      console.log("⛔ ID NOT FOUND → INSERTING NEW ROW");

      const newCourseId = generateCourseId();

      const [insert]: any = await db.query(
        `INSERT INTO courses (courseId, name, slug, description, courseData)
         VALUES (?, ?, ?, ?, ?)`,
        [
          newCourseId,
          name,
          slug,
          description || "",
          jsonData
        ]
      );

      return NextResponse.json({
        success: true,
        created: true,
        id: insert.insertId,
        courseId: newCourseId,
        message: "New course created",
      });
    }

    // Row exists → UPDATE
    console.log("✅ ID FOUND → UPDATING ROW");

    await db.query(
      `UPDATE courses 
       SET name = ?, slug = ?, description = ?, courseData = ?
       WHERE id = ?`,
      [
        name,
        slug,
        description || "",
        jsonData,
        id
      ]
    );

    return NextResponse.json({
      success: true,
      updated: true,
      id,
      message: "Course updated successfully",
    });

  } catch (err) {
    console.error("🔥 UPSERT ERROR:", err);
    return NextResponse.json({ error: true, details: String(err) });
  }
}