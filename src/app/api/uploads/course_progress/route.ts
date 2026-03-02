import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

/* ================= SAVE PROGRESS ================= */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("📥 Saving Progress:", body);

    const {
      userKey,
      courseId,
      videoId,
      globalIndex,
      positionSeconds,
      completed,
    } = body;

    // 🚨 prevent overwriting real progress with 0
    if (completed && Number(positionSeconds || 0) === 0) {
      console.log("⛔ Skip invalid completed save (0 sec)");
      return NextResponse.json({ skipped: true });
    }

    await pool.query(
      `
      INSERT INTO course_progress
      (user_key, course_id, video_id, global_index, position_sec, completed)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        global_index = VALUES(global_index),
        video_id = VALUES(video_id),
        position_sec = VALUES(position_sec),
        completed = VALUES(completed),
        updated_at = CURRENT_TIMESTAMP
      `,
      [
        userKey,
        courseId,
        videoId ?? null,
        globalIndex ?? null,
        Number(positionSeconds || 0),
        completed ? 1 : 0,
      ]
    );

    console.log("✅ Progress Updated");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Progress API error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/* ================= LOAD LAST VIDEO ================= */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const userKey = searchParams.get("userKey");
    const courseId = searchParams.get("courseId");

    const [rows]: any = await pool.query(
      `
      SELECT video_id, global_index, position_sec
      FROM course_progress
      WHERE user_key=? AND course_id=?
      ORDER BY updated_at DESC
      LIMIT 1
      `,
      [userKey, courseId]
    );

    console.log("📤 Last Progress:", rows);

    // ⭐ RETURN ARRAY (frontend expects array)
    return NextResponse.json(rows ?? []);
  } catch (err) {
    console.error("❌ Load Progress Error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}