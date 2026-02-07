import { NextResponse } from "next/server";
import db from "../../../../lib/db";

// ✅ REQUIRED for browser POST
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    const [rows]: any = await db.query(
      `
      SELECT 
        id,
        name,
        email,
        phone,
        login_id,
        password,
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
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const student = rows[0];

    // TEMP: plain text password check
    if (student.password !== password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      courseSlug: student.course_slug,
      courseTitle: student.course_title,
      modules: JSON.parse(student.modules || "[]"),
      role: "student",
    });
  } catch (error) {
    console.error("Student login error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
