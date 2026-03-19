import { NextResponse } from "next/server";
import db from "../../../../../lib/db";

export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    const [result]: any = await db.execute(
      "DELETE FROM courses WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE COURSE ERROR:", error);

    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 }
    );
  }
}