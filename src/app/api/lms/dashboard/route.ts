import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

/* ================= MYSQL POOL (GLOBAL SAFE) ================= */

const globalForMysql = global as unknown as { pool?: mysql.Pool };

const pool =
  globalForMysql.pool ??
  mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    enableKeepAlive: true,
  });

if (process.env.NODE_ENV !== "production") {
  globalForMysql.pool = pool;
}

/* ================= API ================= */

export async function GET(req: Request) {
  try {
    const email = req.headers.get("x-user-email");

    if (!email) {
      return NextResponse.json(
        { error: "Missing email" },
        { status: 400 }
      );
    }

    /* ======================================================
       1️⃣ STUDENT
    ====================================================== */

    const [studentRows]: any = await pool.query(
      `SELECT id,name,email,phone,course_slug,batch_id,modules
       FROM lms_students
       WHERE email=?
       LIMIT 1`,
      [email]
    );

    const student = studentRows?.[0];

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    const batchId = String(student.batch_id ?? "");

    console.log("🎓 Student Batch:", batchId);

    /* ======================================================
       2️⃣ COURSE
    ====================================================== */

    const [courseRows]: any = await pool.query(
      `SELECT * FROM courses WHERE slug=? LIMIT 1`,
      [student.course_slug]
    );

    const course = courseRows?.[0] ?? null;

    /* ======================================================
       3️⃣ VIDEOS (RAW FETCH)
    ====================================================== */

    const [videosRows]: any = await pool.query(
      `SELECT
          id,
          name AS title,
          secure_url AS url,
          module_id,
          submodule_id,
          batch_ids,
          uploaded_at
       FROM videos
       WHERE course_slug=?
       ORDER BY uploaded_at ASC`,
      [student.course_slug]
    );

    console.log("🧪 Raw Videos:", videosRows.length);

    /* ======================================================
       4️⃣ BATCH FILTER (UNIVERSAL SAFE)
    ====================================================== */

    const videos = (videosRows || []).filter((v: any) => {
      const raw = v.batch_ids;

      // allow videos without restriction
      if (
        raw === null ||
        raw === undefined ||
        raw === "" ||
        raw === "all" ||
        raw === "ALL" ||
        raw === 0
      ) {
        return true;
      }

      try {
        const val = String(raw).trim();

        // JSON array format "[1,2]"
        if (val.startsWith("[")) {
          const arr = JSON.parse(val).map((x: any) => String(x));
          return arr.includes(batchId);
        }

        // comma separated "1, 2"
        const arr = val.split(",").map((x: string) => x.trim());

        return arr.includes(batchId);
      } catch (err) {
        console.warn("⚠️ batch_ids parse error:", raw);
        return false;
      }
    });

    console.log("⚡ Videos After SQL Filter:", videos.length);

    /* ======================================================
       5️⃣ LAST PROGRESS
    ====================================================== */

    let lastProgress = null;

    if (course?.course_id) {
      const [progressRows]: any = await pool.query(
        `SELECT video_id,global_index,position_sec
         FROM course_progress
         WHERE user_key=? AND course_id=?
         LIMIT 1`,
        [email.toLowerCase(), course.course_id]
      );

      lastProgress = progressRows?.[0] ?? null;
    }

    console.log("📤 Last Progress:", lastProgress);

    /* ======================================================
       6️⃣ RESPONSE
    ====================================================== */

    return NextResponse.json({
      student,
      course,
      videos,
      lastProgress,
    });
  } catch (err) {
    console.error("❌ LMS Dashboard API Error:", err);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}