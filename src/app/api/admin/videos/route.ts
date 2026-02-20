import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

/* ============================
   ✅ GET ALL VIDEOS (FIX)
============================ */
export async function GET() {
  try {
    const [rows]: any = await pool.query(
      `SELECT * FROM videos ORDER BY uploaded_at DESC`
    );

    // normalize batch_ids JSON string -> array
    const videos = rows.map((v: any) => ({
      ...v,
      batch_ids:
        typeof v.batch_ids === "string"
          ? JSON.parse(v.batch_ids)
          : v.batch_ids,
    }));

    // IMPORTANT: return ARRAY (not { videos: [] })
    return NextResponse.json(videos);
  } catch (err) {
    console.error("GET VIDEOS ERROR:", err);
    return NextResponse.json([], { status: 500 });
  }
}

/* ============================
   ✅ SAVE VIDEO (YOUR CODE)
============================ */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    await pool.query(
      `INSERT INTO videos
      (name, public_id, secure_url, thumb_url, duration,
       course_slug, module_id, module_title,
       submodule_id, submodule_title,
       batch_ids, uploaded_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        body.name,
        body.s3Key,
        body.s3Url,
        body.thumbUrl,
        body.duration,
        body.courseSlug,
        body.moduleId,
        body.moduleTitle,
        body.submoduleId,
        body.submoduleTitle,
        JSON.stringify(body.batchIds || []),
        body.uploadedBy || "admin",
      ]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("SAVE VIDEO ERROR:", err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}