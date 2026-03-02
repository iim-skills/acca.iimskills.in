// app/api/course_progress/route.ts

import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

/* ======================================================
   GET PROGRESS (FROM students.progress JSON COLUMN)
====================================================== */

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const userKey = searchParams.get("userKey");

    if (!courseId || !userKey) {
      return NextResponse.json([]);
    }

    const [rows]: any = await pool.query(
      `SELECT progress FROM lms_students WHERE email = ? LIMIT 1`,
      [userKey]
    );

    if (!rows.length || !rows[0].progress) {
      return NextResponse.json([]);
    }

    let fullProgress: Record<string, any> = {};

    try {
      fullProgress = JSON.parse(rows[0].progress);
    } catch {
      return NextResponse.json([]);
    }

    const courseProgress = fullProgress[courseId];

    if (!courseProgress) {
      return NextResponse.json([]);
    }

    const result = Object.entries(courseProgress).map(
      ([videoId, data]: any) => ({
        videoId,
        positionSeconds: Number(data.positionSeconds ?? 0),
        duration: Number(data.duration ?? 0),
        completed: Boolean(data.completed),
      })
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET course_progress error:", err);
    return NextResponse.json([], { status: 500 });
  }
}

/* ======================================================
   SAVE / UPDATE PROGRESS (INSIDE students.progress JSON)
====================================================== */

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      userKey,
      courseId,
      videoId,
      positionSeconds,
      duration,
      completed,
    } = body;

    if (!userKey || !courseId || !videoId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [rows]: any = await pool.query(
      `SELECT progress FROM lms_students WHERE email = ? LIMIT 1`,
      [userKey]
    );

    let fullProgress: Record<string, any> = {};

    if (rows.length && rows[0].progress) {
      try {
        fullProgress = JSON.parse(rows[0].progress);
      } catch {
        fullProgress = {};
      }
    }

    if (!fullProgress[courseId]) {
      fullProgress[courseId] = {};
    }

    // ✅ Trust frontend for completion
    fullProgress[courseId][videoId] = {
      positionSeconds: Math.max(0, Math.floor(positionSeconds || 0)),
      duration: Math.max(0, Math.floor(duration || 0)),
      completed: Boolean(completed),
      updated_at: new Date().toISOString(),
    };

    await pool.query(
      `UPDATE lms_students SET progress = ? WHERE email = ?`,
      [JSON.stringify(fullProgress), userKey]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST course_progress error:", err);
    return NextResponse.json(
      { error: "Failed to save progress" },
      { status: 500 }
    );
  }
}