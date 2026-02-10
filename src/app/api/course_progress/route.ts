// src/app/api/course_progress/route.ts
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

/**
 * GET /api/course_progress?courseId=...&userKey=...    (guest)
 * GET /api/course_progress?courseId=...&studentId=... (logged)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = String(searchParams.get("courseId") || "");
    const userKey = String(searchParams.get("userKey") || "");
    const studentId = Number(searchParams.get("studentId") || 0);

    if (!courseId) return NextResponse.json([], { status: 200 });

    if (userKey) {
      // guest flow
      const [rows]: any = await pool.query(
        `SELECT global_index, position_sec, completed
         FROM course_progress
         WHERE course_id = ? AND user_key = ?
         ORDER BY global_index ASC`,
        [courseId, userKey]
      );
      return NextResponse.json(
        rows.map((r: any) => ({
          globalIndex: r.global_index,
          positionSeconds: r.position_sec,
          completed: r.completed === 1,
        }))
      );
    } else if (studentId) {
      // logged-in flow
      const [rows]: any = await pool.query(
        `SELECT module_id, video_index, position_seconds, completed
         FROM lms_video_progress
         WHERE course_id = ? AND student_id = ?
         ORDER BY module_id ASC, video_index ASC`,
        [courseId, studentId]
      );
      // normalize to global index style is not possible here (we return module/video keys)
      return NextResponse.json(
        rows.map((r: any) => ({
          moduleId: r.module_id,
          videoIndex: r.video_index,
          positionSeconds: r.position_seconds,
          completed: r.completed === 1,
        }))
      );
    } else {
      // nothing to query
      return NextResponse.json([], { status: 200 });
    }
  } catch (err) {
    console.error("GET /api/course_progress ERROR:", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

/**
 * POST /api/course_progress
 * Body either:
 *  - { userKey, courseId, globalIndex, positionSeconds, completed }  // guest
 *  - { studentId, courseId, moduleId, videoIndex, positionSeconds, completed } // logged
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Guest flow
    if (body.userKey) {
      const userKey = String(body.userKey || "");
      const courseId = String(body.courseId || "");
      const globalIndex = Number(body.globalIndex);
      const positionSeconds = Number(body.positionSeconds ?? 0);
      const completed = body.completed ? 1 : 0;

      if (!userKey || !courseId || Number.isNaN(globalIndex)) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
      }

      await pool.query(
        `INSERT INTO course_progress (user_key, course_id, global_index, position_sec, completed)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           position_sec = VALUES(position_sec),
           completed = VALUES(completed),
           updated_at = CURRENT_TIMESTAMP`,
        [userKey, courseId, globalIndex, positionSeconds, completed]
      );

      return NextResponse.json({ success: true });
    }

    // Logged-in flow
    if (body.studentId) {
      const studentId = Number(body.studentId);
      const courseId = String(body.courseId || "");
      const moduleId = String(body.moduleId || "");
      const videoIndex = Number(body.videoIndex);
      const positionSeconds = Number(body.positionSeconds ?? 0);
      const completed = body.completed ? 1 : 0;

      if (!studentId || !courseId || !moduleId || Number.isNaN(videoIndex)) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
      }

      await pool.query(
        `INSERT INTO lms_video_progress
         (student_id, course_id, module_id, video_index, position_seconds, completed)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           position_seconds = VALUES(position_seconds),
           completed = VALUES(completed),
           updated_at = CURRENT_TIMESTAMP`,
        [studentId, courseId, moduleId, videoIndex, positionSeconds, completed]
      );

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Missing userKey or studentId" }, { status: 400 });
  } catch (err) {
    console.error("POST /api/course_progress ERROR:", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
