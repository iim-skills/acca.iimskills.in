import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function GET(req: Request) {
  try {
    const email = req.headers.get("x-user-email");

    console.log("📩 Request Email:", email);

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
        student_type,
        modules,
        progress,
        batch_id,
        batch_name
      FROM lms_students
      WHERE email = ? OR login_id = ?
      LIMIT 1
      `,
      [email, email]
    );

    console.log("📦 Raw DB Result:", rows);

    if (!rows?.length) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    const student = rows[0];

    console.log("👤 Student Row:", student);
    console.log("🎓 Student Type:", student.student_type);

    let modules: string[] = [];
    let progress: Record<string, any> = {};

    try {
      modules =
        typeof student.modules === "string"
          ? JSON.parse(student.modules || "[]")
          : student.modules || [];
    } catch {}

    try {
      progress =
        typeof student.progress === "string"
          ? JSON.parse(student.progress || "{}")
          : student.progress || {};
    } catch {}

    let batchIds: string[] = [];

    if (student.batch_id) {
      batchIds = [String(student.batch_id)];
    }

    const responseData = {
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      courseSlug: student.course_slug,
      courseTitle: student.course_title,
      studentType: student.student_type,
      modules,
      progress,
      batches: batchIds,
      role: "student",
    };

    console.log("🚀 API Response:", responseData);

    return NextResponse.json(responseData);

  } catch (err) {
    console.error("❌ Student ME error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}