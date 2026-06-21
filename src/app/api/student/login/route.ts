import { NextResponse } from "next/server";
import db from "../../../../lib/db";

const normalizeStudentType = (value: unknown, hasCourses: boolean) => {
  const raw = String(value ?? "").trim().toLowerCase();

  if (raw === "free") return "free";
  if (raw === "paid") return "paid";

  return hasCourses ? "paid" : "free";
};

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const normalizedEmail = String(email ?? "").trim().toLowerCase();

    console.log("Login request:", { email: normalizedEmail });

    const [rows]: any = await db.execute(
      `SELECT id, name, email, phone, password, courses, student_type
       FROM lms_students
       WHERE email = ?
       LIMIT 1`,
      [normalizedEmail]
    );

    if (!rows.length) {
      return NextResponse.json({
        success: false,
        message: "User not found",
      });
    }

    const user = rows[0];

    if (user.password !== password) {
      return NextResponse.json({
        success: false,
        message: "Invalid password",
      });
    }

    let courses: any[] = [];

    if (user.courses) {
      try {
        courses =
          typeof user.courses === "string"
            ? JSON.parse(user.courses)
            : user.courses;
      } catch (err) {
        console.log("Courses JSON parse error:", err);
        courses = [];
      }
    }

    const studentType = normalizeStudentType(
      user.student_type,
      Array.isArray(courses) && courses.length > 0
    );

    return NextResponse.json({
      success: true,
      student: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        studentType,
        student_type: studentType,
        courses,
      },
    });
  } catch (error) {
    console.log("LOGIN ERROR:", error);

    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}
