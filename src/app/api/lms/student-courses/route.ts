import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function GET(req: Request) {

  try {

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email required" },
        { status: 400 }
      );
    }

    console.log("🔎 Fetch student courses for:", email);

    const [rows]: any = await db.query(
      `
      SELECT id,name,email,courses
      FROM lms_students
      WHERE LOWER(email)=LOWER(?)
      LIMIT 1
      `,
      [email]
    );

    if (!rows.length) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    const student = rows[0];

    let assignedCourses: any[] = [];

    try {

      assignedCourses =
        typeof student.courses === "string"
          ? JSON.parse(student.courses)
          : student.courses || [];

    } catch {

      assignedCourses = [];

    }

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
      },
      assignedCourses,
    });

  } catch (error) {

    console.error("🔥 Student courses API error:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }

}