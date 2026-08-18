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

    const normalizedEntries =
      courseProgress && typeof courseProgress === "object"
        ? courseProgress.videos &&
          typeof courseProgress.videos === "object"
          ? courseProgress.videos
          : courseProgress
        : {};

    const result = Object.entries(normalizedEntries)
      .filter(([videoId]) => videoId !== "updated_at")
      .map(([videoId, data]: any) => ({
        videoId,
        positionSeconds: Number(
          data.positionSeconds ?? data.position_sec ?? 0
        ),
        duration: Number(data.duration ?? 0),
        completed: Boolean(data.completed),
      }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET course_progress error:", err);
    return NextResponse.json([], { status: 500 });
  }
}

/* ======================================================
   SAVE / UPDATE PROGRESS (INSIDE students.progress JSON)

   Wrapped in a transaction with SELECT ... FOR UPDATE so concurrent
   saves for the same student (e.g. the periodic 10s autosave racing a
   completion save) can't read-modify-write over each other and silently
   drop an update. Without the row lock, two near-simultaneous POSTs can
   both read the same "before" JSON, then each write back their own
   version — whichever commits last wins and the other's update vanishes.
====================================================== */

export async function POST(req: Request) {
  let connection: mysql.PoolConnection | null = null;

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

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Row-level lock: any other POST for this same email blocks here until
    // this transaction commits, instead of both reading stale data.
    const [rows]: any = await connection.query(
      `SELECT progress FROM lms_students WHERE email = ? LIMIT 1 FOR UPDATE`,
      [userKey]
    );

    if (!rows.length) {
      await connection.rollback();
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    let fullProgress: Record<string, any> = {};

    if (rows[0].progress) {
      try {
        fullProgress = JSON.parse(rows[0].progress);
      } catch {
        fullProgress = {};
      }
    }

    if (!fullProgress[courseId]) {
      fullProgress[courseId] = {};
    }

    const existingEntry = fullProgress[courseId][videoId] ?? {};
    const requestedPosition = Math.max(0, Math.floor(positionSeconds || 0));
    const requestedDuration = Math.max(0, Math.floor(duration || 0));
    const previousPosition = Math.max(
      0,
      Math.floor(existingEntry.positionSeconds ?? existingEntry.position_sec ?? 0)
    );
    const previousDuration = Math.max(
      0,
      Math.floor(existingEntry.duration ?? 0)
    );
    const wasCompleted = Boolean(existingEntry.completed);
    const nextCompleted = wasCompleted || Boolean(completed);
    const nextDuration = Math.max(previousDuration, requestedDuration);
    const nextPosition = nextCompleted
      ? Math.max(previousPosition, requestedPosition, nextDuration, 1)
      : Math.max(previousPosition, requestedPosition);

    fullProgress[courseId][videoId] = {
      ...existingEntry,
      positionSeconds: nextPosition,
      duration: nextDuration,
      completed: nextCompleted,
      updated_at: new Date().toISOString(),
    };

    await connection.query(
      `UPDATE lms_students SET progress = ? WHERE email = ?`,
      [JSON.stringify(fullProgress), userKey]
    );

    await connection.commit();

    return NextResponse.json({ success: true });
  } catch (err) {
    if (connection) {
      try { await connection.rollback(); } catch { /* no-op */ }
    }
    console.error("POST course_progress error:", err);
    return NextResponse.json(
      { error: "Failed to save progress" },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}