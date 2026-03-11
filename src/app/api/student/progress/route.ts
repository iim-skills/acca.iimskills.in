import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      email,
      courseId,
      itemId,
      positionSeconds = 0,
      duration = 0,
      completed = false,
    } = body;

    if (!email || !courseId || !itemId) {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }

    /* =========================
       NORMALIZE ITEM KEY
    ========================= */

    let key = itemId;

    // convert quiz_2 → 2
    if (typeof key === "string" && key.startsWith("quiz_")) {
      key = key.replace("quiz_", "");
    }

    /* =========================
       FETCH STUDENT
    ========================= */

    const [rows]: any = await db.query(
      `SELECT progress FROM lms_students WHERE email=? LIMIT 1`,
      [email]
    );

    if (!rows?.length) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    /* =========================
       PARSE EXISTING PROGRESS
    ========================= */

    let progress: any = {};

    try {
      progress = rows[0].progress
        ? JSON.parse(rows[0].progress)
        : {};
    } catch {
      progress = {};
    }

    if (!progress[courseId]) {
      progress[courseId] = {};
    }

    /* =========================
       SAVE ITEM PROGRESS
    ========================= */

    progress[courseId][key] = {
      positionSeconds,
      duration,
      completed,
      updated_at: new Date().toISOString(),
    };

    /* =========================
       UPDATE DATABASE
    ========================= */

    await db.query(
      `UPDATE lms_students SET progress=? WHERE email=?`,
      [JSON.stringify(progress), email]
    );

    return NextResponse.json({
      success: true,
      progress,
    });

  } catch (err) {
    console.error("Progress API error:", err);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}