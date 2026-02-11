import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
});

/* ===================================================
   GET PROGRESS
=================================================== */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = String(searchParams.get("courseId") || "");
    const userKey = String(searchParams.get("userKey") || "");
    const studentId = Number(searchParams.get("studentId") || 0);

    if (!courseId) return NextResponse.json([], { status: 200 });

    if (userKey) {
      const [rows]: any = await pool.query(
        `SELECT video_id, position_sec, completed, updated_at
         FROM course_progress
         WHERE course_id = ? AND user_key = ?
         LIMIT 1`,
        [courseId, userKey]
      );

      if (!rows.length) return NextResponse.json([]);

      const row = rows[0];
      const list =
        row.video_id?.split(",").map((v: string) => v.trim()) ?? [];

      return NextResponse.json({
        videos: list,
        positionSeconds: row.position_sec,
        completed: row.completed === 1,
        updatedAt: row.updated_at,
      });
    }

    if (studentId) {
      const [rows]: any = await pool.query(
        `SELECT video_id, position_seconds, completed, updated_at
         FROM lms_video_progress
         WHERE course_id = ? AND student_id = ?
         LIMIT 1`,
        [courseId, studentId]
      );

      if (!rows.length) return NextResponse.json([]);

      const row = rows[0];
      const list =
        row.video_id?.split(",").map((v: string) => v.trim()) ?? [];

      return NextResponse.json({
        videos: list,
        positionSeconds: row.position_seconds,
        completed: row.completed === 1,
        updatedAt: row.updated_at,
      });
    }

    return NextResponse.json([]);
  } catch (err) {
    console.error("GET /api/course_progress ERROR:", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

/* ===================================================
   POST PROGRESS (SINGLE ROW MODE)
=================================================== */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    /* ============================
       GUEST USER FLOW
    ============================ */
    if (body.userKey) {
      const userKey = String(body.userKey || "");
      const courseId = String(body.courseId || "");
      const videoId = String(body.videoId || "");
      const positionSeconds = Number(body.positionSeconds ?? 0);
      const completed = body.completed ? 1 : 0;

      if (!userKey || !courseId || !videoId) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
      }

      /* ---- STEP 1: get existing row ---- */
      const [rows]: any = await pool.query(
        `SELECT video_id FROM course_progress
         WHERE user_key = ? AND course_id = ?
         LIMIT 1`,
        [userKey, courseId]
      );

      let videoList: string[] = [];

      if (rows.length && rows[0].video_id) {
        videoList = rows[0].video_id.split(",").map((v: string) => v.trim());
      }

      /* ---- STEP 2: add video if not exists ---- */
      if (!videoList.includes(videoId)) {
        videoList.push(videoId);
      }

      const newVideoString = videoList.join(",");

      /* ---- STEP 3: UPSERT SAME ROW ---- */
      await pool.query(
        `INSERT INTO course_progress
         (user_key, course_id, video_id, position_sec, completed, updated_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON DUPLICATE KEY UPDATE
           video_id = VALUES(video_id),
           position_sec = VALUES(position_sec),
           completed = VALUES(completed),
           updated_at = CURRENT_TIMESTAMP`,
        [userKey, courseId, newVideoString, positionSeconds, completed]
      );

      return NextResponse.json({ success: true });
    }

    /* ============================
       LOGGED IN STUDENT FLOW
    ============================ */
    if (body.studentId) {
      const studentId = Number(body.studentId);
      const courseId = String(body.courseId || "");
      const videoId = String(body.videoId || "");
      const positionSeconds = Number(body.positionSeconds ?? 0);
      const completed = body.completed ? 1 : 0;

      if (!studentId || !courseId || !videoId) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
      }

      const [rows]: any = await pool.query(
        `SELECT video_id FROM lms_video_progress
         WHERE student_id = ? AND course_id = ?
         LIMIT 1`,
        [studentId, courseId]
      );

      let videoList: string[] = [];

      if (rows.length && rows[0].video_id) {
        videoList = rows[0].video_id.split(",").map((v: string) => v.trim());
      }

      if (!videoList.includes(videoId)) {
        videoList.push(videoId);
      }

      const newVideoString = videoList.join(",");

      await pool.query(
        `INSERT INTO lms_video_progress
         (student_id, course_id, video_id, position_seconds, completed, updated_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON DUPLICATE KEY UPDATE
           video_id = VALUES(video_id),
           position_seconds = VALUES(position_seconds),
           completed = VALUES(completed),
           updated_at = CURRENT_TIMESTAMP`,
        [studentId, courseId, newVideoString, positionSeconds, completed]
      );

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Missing userKey or studentId" }, { status: 400 });
  } catch (err) {
    console.error("POST /api/course_progress ERROR:", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
