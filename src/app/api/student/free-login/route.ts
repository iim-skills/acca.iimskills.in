import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    console.log("📩 Free Login Email:", cleanEmail);

    /* ===============================
       CHECK EXISTING STUDENT
    =============================== */

    const [rows]: any = await db.query(
      `SELECT * FROM lms_students WHERE email = ? LIMIT 1`,
      [cleanEmail]
    );

    let student;

    /* ===============================
       CREATE NEW FREE USER
    =============================== */

    if (!rows || rows.length === 0) {

      const defaultName = cleanEmail.split("@")[0];

      // ⭐ Only first module unlocked
      const unlockedModules = JSON.stringify(["MOD_1"]);

      const [insertRes]: any = await db.query(
        `
        INSERT INTO lms_students
        (
          name,
          email,
          login_id,
          password,
          modules,
          progress,
          course_slug,
          course_title,
          student_type
        )
        VALUES (?, ?, ?, ?, ?, '{}', 'COURSE_ACCA_SKILLS_001', 'Free Preview', 'free')
        `,
        [
          defaultName,
          cleanEmail,
          cleanEmail,
          cleanEmail,      // password = email
          unlockedModules  // first module unlocked
        ]
      );

      const [newUser]: any = await db.query(
        `SELECT * FROM lms_students WHERE id = ?`,
        [insertRes.insertId]
      );

      student = newUser[0];

      console.log("🆕 New Free Student Created:", student.email);
    }

    /* ===============================
       EXISTING USER LOGIN
    =============================== */

    else {

      student = rows[0];

      // Update password to login email
      await db.query(
        `UPDATE lms_students SET password = ? WHERE id = ?`,
        [cleanEmail, student.id]
      );

      console.log("✅ Existing Student Login:", student.email);
    }

    /* ===============================
       PARSE MODULES
    =============================== */

    let modules: string[] = [];

    try {
      modules =
        typeof student.modules === "string"
          ? JSON.parse(student.modules || "[]")
          : student.modules || [];
    } catch {
      modules = [];
    }

    /* ===============================
       RESPONSE
    =============================== */

    return NextResponse.json({
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      courseSlug: student.course_slug,
      courseTitle: student.course_title,
      studentType: student.student_type,
      modules,
      role: "student",
    });

  } catch (err) {
    console.error("❌ Free login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}