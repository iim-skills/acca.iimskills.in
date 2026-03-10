import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, moduleId, videoIndex } = body;

    if (!email || !moduleId || typeof videoIndex !== "number") {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }

    // Fetch current progress
    const [rows]: any = await db.query(
      `SELECT progress FROM lms_students WHERE email = ? LIMIT 1`,
      [email]
    );

    if (!rows?.length) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    let progress: Record<string, number[]> = {};

    try {
      progress = rows[0].progress
        ? JSON.parse(rows[0].progress)
        : {};
    } catch {
      progress = {};
    }

    const completed = progress[moduleId] || [];

    // 🚫 Prevent skipping videos
    if (videoIndex > completed.length) {
      return NextResponse.json(
        { error: "Complete previous video first" },
        { status: 403 }
      );
    }

    // ✅ Mark video as completed
    if (!completed.includes(videoIndex)) {
      completed.push(videoIndex);
    }

    progress[moduleId] = completed;

    await db.query(
      `UPDATE lms_students SET progress = ? WHERE email = ?`,
      [JSON.stringify(progress), email]
    );

    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (err) {
    console.error("Progress API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
