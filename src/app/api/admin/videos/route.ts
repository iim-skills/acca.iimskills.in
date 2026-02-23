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
      (name,
       public_id,
       secure_url,
       thumb_url,
       duration,
       course_slug,
       module_id,
       module_title,
       submodule_id,
       submodule_title,
       batch_ids,
       uploaded_by,
       s3_key,
       s3_url)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        body.name,

        // ⭐ Cloudinary values
        body.public_id,
        body.secure_url,
        body.thumb_url,
        body.duration,

        body.course_slug,
        body.module_id,
        body.module_title,
        body.submodule_id,
        body.submodule_title,

        JSON.stringify(body.batch_ids || []),
        body.uploaded_by || "admin",

        // ⭐ IMPORTANT: map to s3 fields
        body.public_id,   // s3_key
        body.secure_url,  // s3_url
      ]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("SAVE VIDEO ERROR:", err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}