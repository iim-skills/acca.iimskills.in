import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    /* ===============================
       1️⃣ CHECK PAID STUDENTS
    =============================== */

    const [paidRows]: any = await db.query(
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

    if (paidRows.length > 0) {
      const student = paidRows[0];

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
        type: "paid",
        role: "student",
      });
    }

    /* ===============================
       2️⃣ CHECK FREE STUDENTS
    =============================== */

    const [freeRows]: any = await db.query(
      `
      SELECT 
        id,
        name,
        email
      FROM free_students
      WHERE LOWER(email) = LOWER(?)
      LIMIT 1
      `,
      [email.toLowerCase()]
    );

    if (freeRows.length > 0) {
      const student = freeRows[0];

      return NextResponse.json({
        id: student.id,
        name: student.name,
        email: student.email,
        courseSlug: "free-course",
        courseTitle: "Free Course",
        modules: [],
        type: "free",
        role: "student",
      });
    }

    /* ===============================
       3️⃣ USER NOT FOUND
    =============================== */

    return NextResponse.json(
      { error: "Student not found" },
      { status: 404 }
    );

  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}