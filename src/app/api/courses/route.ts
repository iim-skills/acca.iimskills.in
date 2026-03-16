import { NextResponse } from "next/server";
import db from "../../../lib/db";

export async function GET() {
  try {

    const [rows]: any = await db.query(`
      SELECT 
        slug AS course_slug,
        name AS course_title
      FROM courses
      ORDER BY id DESC
    `);

    return NextResponse.json(rows);

  } catch (error) {

    console.error("Courses API Error:", error);

    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );

  }
}