// app/api/course_progress/route.ts

import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

/* ======================================================
   GET  —  load all progress for a student + course

   Returns an array of entries.  Two kinds of entry:

   Video progress (key = videoId or "idx_N"):
     { videoId, positionSeconds, duration, completed }
   
   Quiz completion (key = "quiz_QUIZID"):
     { videoId: "quiz_QUIZID", positionSeconds: 0, duration: 0, completed: true }

   The frontend parses keys starting with "quiz_" as quiz
   completions and maps the rest to video progress.
====================================================== */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const userKey  = searchParams.get("userKey");

    if (!courseId || !userKey) return NextResponse.json([]);

    const [rows]: any = await pool.query(
      `SELECT progress FROM lms_students WHERE email = ? LIMIT 1`,
      [userKey]
    );

    if (!rows.length || !rows[0].progress) return NextResponse.json([]);

    let fullProgress: Record<string, any> = {};
    try {
      fullProgress = JSON.parse(rows[0].progress);
    } catch {
      return NextResponse.json([]);
    }

    const courseProgress = fullProgress[courseId];
    if (!courseProgress || typeof courseProgress !== "object") {
      return NextResponse.json([]);
    }

    // Return every stored entry — videos and quizzes alike
    const result = Object.entries(courseProgress).map(([videoId, data]: [string, any]) => ({
      videoId,
      positionSeconds: Number(data?.positionSeconds ?? 0),
      duration:        Number(data?.duration         ?? 0),
      completed:       Boolean(data?.completed),
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET course_progress error:", err);
    return NextResponse.json([], { status: 500 });
  }
}

/* ======================================================
   POST  —  save / update a single progress entry

   Handles three key formats:
     videoId       — a real video id string
     "idx_N"       — fallback for videos without an explicit id
     "quiz_QUIZID" — quiz completion (positionSeconds=0, completed=true)

   All stored in the same JSON blob on lms_students.progress.

   Merge strategy:
     • completed = true is never overwritten by false
     • positionSeconds keeps the maximum value seen
     These rules prevent race conditions from periodic saves.
====================================================== */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      userKey,
      courseId,
      videoId,
      globalIndex,
      positionSeconds,
      duration,
      completed,
    } = body;

    if (!userKey || !courseId) {
      return NextResponse.json({ error: "Missing userKey or courseId" }, { status: 400 });
    }

    /*
     * Derive the storage key:
     *   real videoId → use as-is (covers "quiz_QUIZID" too)
     *   no videoId + globalIndex → "idx_N"
     */
    const storageKey: string | undefined =
      videoId                         ? String(videoId) :
      typeof globalIndex === "number" ? `idx_${globalIndex}` :
      undefined;

    if (!storageKey) {
      return NextResponse.json(
        { error: "Provide videoId or globalIndex" },
        { status: 400 }
      );
    }

    const [rows]: any = await pool.query(
      `SELECT progress FROM lms_students WHERE email = ? LIMIT 1`,
      [userKey]
    );

    if (!rows.length) {
      /*
       * No row found — guest UUID with no DB account.
       * Return success silently; guest progress is handled by localStorage.
       */
      return NextResponse.json({ success: true, skipped: true });
    }

    let fullProgress: Record<string, any> = {};
    if (rows[0].progress) {
      try { fullProgress = JSON.parse(rows[0].progress); } catch { fullProgress = {}; }
    }

    if (!fullProgress[courseId]) fullProgress[courseId] = {};

    const existing = fullProgress[courseId][storageKey];

    /* Merge: never un-complete, always keep furthest position */
    const newCompleted = Boolean(completed) || Boolean(existing?.completed);
    const newPosition  = Math.max(
      Math.floor(Math.max(0, positionSeconds || 0)),
      Number(existing?.positionSeconds ?? 0)
    );

    fullProgress[courseId][storageKey] = {
      positionSeconds: newPosition,
      duration:        Math.max(0, Math.floor(duration || 0)),
      completed:       newCompleted,
      updated_at:      new Date().toISOString(),
    };

    await pool.query(
      `UPDATE lms_students SET progress = ? WHERE email = ?`,
      [JSON.stringify(fullProgress), userKey]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST course_progress error:", err);
    return NextResponse.json({ error: "Failed to save progress" }, { status: 500 });
  }
}