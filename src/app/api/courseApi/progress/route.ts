// app/api/courseApi/progress/route.ts
import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // optional: connectionLimit, waitForConnections, etc.
});

type ReqBody = {
  userKey: string; // email or numeric id
  courseId: string;
  videoId?: string | null;
  globalIndex?: number | null;
  positionSeconds?: number | null;
  duration?: number | null;
  completed?: boolean | null;
};

export async function POST(req: Request) {
  try {
    const body: ReqBody = await req.json();

    const { userKey, courseId } = body;
    if (!userKey || !courseId) {
      return NextResponse.json({ error: "Missing required fields (userKey, courseId)" }, { status: 400 });
    }

    // normalize numeric fields
    const globalIndex = typeof body.globalIndex === "number" ? body.globalIndex : null;
    let positionSeconds = typeof body.positionSeconds === "number" ? Math.floor(body.positionSeconds) : 0;
    const duration = typeof body.duration === "number" ? Math.floor(body.duration) : 0;
    const completed = Boolean(body.completed);
    const videoIdRaw = body.videoId ?? null;

    // 1) Find student (try email then numeric id)
    let studentRow: any = null;
    const [byEmail]: any = await pool.query(
      "SELECT id, progress FROM lms_students WHERE email = ? LIMIT 1",
      [userKey]
    );
    if (Array.isArray(byEmail) && byEmail.length > 0) studentRow = byEmail[0];
    else if (!isNaN(Number(userKey))) {
      const [byId]: any = await pool.query("SELECT id, progress FROM lms_students WHERE id = ? LIMIT 1", [Number(userKey)]);
      if (Array.isArray(byId) && byId.length > 0) studentRow = byId[0];
    }

    if (!studentRow) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // 2) Parse existing progress JSON safely
    let progressObj: Record<string, any> = {};
    try {
      if (studentRow.progress) {
        progressObj = JSON.parse(studentRow.progress);
        if (!progressObj || typeof progressObj !== "object") progressObj = {};
      }
    } catch {
      // corrupted JSON -> reset
      progressObj = {};
    }

    // ensure course object exists
    if (!progressObj[courseId]) {
      progressObj[courseId] = { updated_at: new Date().toISOString(), videos: {} };
    }
    const courseProgress = progressObj[courseId] ?? { updated_at: new Date().toISOString(), videos: {} };

    // compute a stable key for this video entry: prefer videoId, else globalIndex
    const videoKey = videoIdRaw ?? (globalIndex !== null ? `global_${globalIndex}` : `unknown`);

    const existingEntry = courseProgress.videos?.[videoKey] ?? null;

    // 3) Normalize completion edge-cases:
    // If attempted completed save with 0 positionSeconds:
    //   - if duration given use duration
    //   - else if duration unknown but video is very short, use 1 (safe)
    if (completed && positionSeconds <= 0) {
      if (duration > 0) {
        positionSeconds = duration;
      } else {
        // small default to avoid backend rejecting 0 sec completion (use 1 second)
        positionSeconds = 1;
      }
    }

    // 4) Save rules:
    // - For completed: set completed=1 and position_sec = max(existing, positionSeconds)
    // - For not completed: update position_sec = max(existing, positionSeconds), keep completed state
    const prevPos = existingEntry?.position_sec ?? 0;
    const prevCompleted = existingEntry?.completed ? 1 : 0;

    if (completed) {
      // mark completed; store best (max) positionSeconds
      courseProgress.videos[videoKey] = {
        position_sec: Math.max(prevPos, Math.floor(Math.max(0, positionSeconds))),
        completed: 1,
        duration: duration || existingEntry?.duration || 0,
        updated_at: new Date().toISOString(),
      };
    } else {
      // update last seen pos, preserve completed flag if already completed
      const newPos = Math.max(prevPos, Math.floor(Math.max(0, positionSeconds)));
      courseProgress.videos[videoKey] = {
        position_sec: newPos,
        completed: prevCompleted,
        duration: duration || existingEntry?.duration || 0,
        updated_at: new Date().toISOString(),
      };
    }

    courseProgress.updated_at = new Date().toISOString();
    progressObj[courseId] = courseProgress;

    // 5) Save back to DB (progress column)
    const progressJson = JSON.stringify(progressObj);
    await pool.query("UPDATE lms_students SET progress = ?, updated_at = NOW() WHERE id = ?", [progressJson, studentRow.id]);

    // 6) Return updated course progress for frontend resume
    return NextResponse.json({ success: true, courseProgress }, { status: 200 });
  } catch (err) {
    console.error("Progress -> save error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}