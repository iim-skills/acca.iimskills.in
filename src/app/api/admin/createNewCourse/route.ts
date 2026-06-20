import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { name, slug } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug required" },
        { status: 400 }
      );
    }

    const courseId = `COURSE_${Date.now()}`;

    const emptyCourseData = {
      modules: []
    };

    const [result]: any = await db.query(
      `
      INSERT INTO courses
      (
        courseId,
        slug,
        name,
        description,
        courseData
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        courseId,
        slug,
        name,
        "",
        JSON.stringify(emptyCourseData)
      ]
    );

    return NextResponse.json({
      success: true,
      id: result.insertId,
      courseId
    });

  } catch (error) {
    console.error("Create course error:", error);

    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 }
    );
  }
}