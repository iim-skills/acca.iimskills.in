import { NextResponse } from "next/server";
import db from "../../../../lib/db";

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
      WHERE LOWER(email) = LOWER(?) OR login_id = ?
      LIMIT 1
      `,
      [email.toLowerCase(), email]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const student = rows[0];

    if (student.password.trim() !== password.trim()) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    let modules = [];
    try {
      modules =
        typeof student.modules === "string"
          ? JSON.parse(student.modules)
          : student.modules || [];
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
    console.error("Student login error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}