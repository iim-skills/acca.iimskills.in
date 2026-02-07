import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function GET(req: Request) {
  try {
    const email = req.headers.get("x-user-email");

    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [rows]: any = await db.query(
      `
      SELECT 
        id,
        name,
        email,
        phone,
        course_slug,
        course_title,
        modules
      FROM lms_students
      WHERE email = ? OR login_id = ?
      LIMIT 1
      `,
      [email, email]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const student = rows[0];

    // safe parse modules (in case it's null or plain string)
    let modules = [];
    try {
      modules = typeof student.modules === "string" ? JSON.parse(student.modules || "[]") : (student.modules || []);
    } catch {
      modules = [];
    }

    return NextResponse.json({
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      courseSlug: student.course_slug,
      courseTitle: student.course_title,
      modules,
      role: "student",
    });
  } catch (error) {
    console.error("Fetch student error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
