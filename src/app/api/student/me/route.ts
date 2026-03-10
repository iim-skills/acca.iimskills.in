import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function GET(req: Request) {
  try {
    const email = req.headers.get("x-user-email");

    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* ===============================
       GET STUDENT
    =============================== */
    const [rows]: any = await db.query(
      `
      SELECT 
        id,
        name,
        email,
        phone,
        course_slug,
        course_title,
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

    if (!rows?.length) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    const student = rows[0];

    /* ===============================
       PARSE MODULES + PROGRESS (OLD)
    =============================== */
    let modules: string[] = [];
    let progress: Record<string, number[]> = {};

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

    /* ===============================
       🔥 NEW: BUILD BATCH ARRAY
       (LMS expects array of ids)
    =============================== */
    let batchIds: string[] = [];

    try {
      if (student.batch_id) {
        batchIds = [String(student.batch_id)];
      }
    } catch {}

    /* ===============================
       RESPONSE (OLD + NEW)
    =============================== */
    return NextResponse.json({
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      courseSlug: student.course_slug,
      courseTitle: student.course_title,

      modules,
      progress,

      // ⭐ NEW FIELD for LMS visibility logic
      batches: batchIds,

      role: "student",
    });
  } catch (err) {
    console.error("Student ME error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}