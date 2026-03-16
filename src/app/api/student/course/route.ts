import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function GET(req: Request) {
  try {

    const email = req.headers.get("x-user-email");

    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1️⃣ Get assigned courses JSON
    const [studentRows]: any = await db.query(
      `SELECT courses FROM lms_students WHERE email = ? LIMIT 1`,
      [email]
    );

    if (!studentRows.length || !studentRows[0].courses) {
      return NextResponse.json([]);
    }

    const assignedCourses = JSON.parse(studentRows[0].courses);

    // 2️⃣ Extract slugs
    const slugs = assignedCourses.map((c: any) => c.course_slug);

    if (!slugs.length) {
      return NextResponse.json([]);
    }

    // 3️⃣ Fetch courses from courses table
    const [courses]: any = await db.query(
      `
      SELECT 
        slug AS course_slug,
        name AS course_title
      FROM courses
      WHERE slug IN (?)
      `,
      [slugs]
    );

    return NextResponse.json(courses);

  } catch (error) {

    console.error("Courses API Error:", error);

    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}