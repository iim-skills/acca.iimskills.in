import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Check existing user
    const [rows]: any = await db.query(
      `SELECT * FROM lms_students WHERE email = ? LIMIT 1`,
      [cleanEmail]
    );

    let student;

    // ⭐ CREATE FREE USER IF NOT EXIST
    if (!rows || rows.length === 0) {
      const defaultName = cleanEmail.split("@")[0];

      const [insertRes]: any = await db.query(
        `
        INSERT INTO lms_students
        (name,email,login_id,password,modules,progress,course_slug,course_title,student_type)
        VALUES (?, ?, ?, '', '[]', '{}', 'COURSE_ACCA_SKILLS_001', 'Free Preview', 'free')
        `,
        [defaultName, cleanEmail, cleanEmail]
      );

      const [newUser]: any = await db.query(
        `SELECT * FROM lms_students WHERE id = ?`,
        [insertRes.insertId]
      );

      student = newUser[0];
    } else {
      student = rows[0];
    }

    return NextResponse.json({
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      courseSlug: student.course_slug,
      courseTitle: student.course_title,
      modules: JSON.parse(student.modules || "[]"),
      studentType: student.student_type,
      role: "student",
    });

  } catch (err) {
    console.error("Free login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
