import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

/* ================= DB POOL ================= */

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
});

/* ================= HELPERS ================= */

function safeJSON(value: any, fallback: any) {
  try {
    if (!value) return fallback;
    if (typeof value === "string") return JSON.parse(value);
    return value;
  } catch {
    return fallback;
  }
}

/* ============================
   GET ALL VIDEOS
============================ */

export async function GET() {
  try {
    const [rows]: any = await pool.query(
      `SELECT * FROM videos ORDER BY uploaded_at DESC`
    );

    const videos = rows.map((v: any) => ({
      id: v.id,

      /* ⭐ IMPORTANT for dropdown */
      title: v.name,

      /* full info if needed */
      name: v.name,
      url: v.secure_url || v.s3_url,
      thumb_url: v.thumb_url,
      duration: v.duration,

      course_slug: v.course_slug,
      module_id: v.module_id,
      submodule_id: v.submodule_id,

      batch_ids: safeJSON(v.batch_ids, []),

      uploaded_by: v.uploaded_by,
      uploaded_at: v.uploaded_at,
    }));

    return NextResponse.json(videos);
  } catch (err) {
    console.error("GET VIDEOS ERROR:", err);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}

/* ============================
   SAVE VIDEO
============================ */

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.name || !body.secure_url) {
      return NextResponse.json(
        { error: "Video name and URL required" },
        { status: 400 }
      );
    }

    const [result]: any = await pool.query(
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

        /* Cloudinary / CDN */
        body.public_id || null,
        body.secure_url,
        body.thumb_url || null,
        body.duration || 0,

        body.course_slug || null,
        body.module_id || null,
        body.module_title || null,
        body.submodule_id || null,
        body.submodule_title || null,

        JSON.stringify(body.batch_ids || []),
        body.uploaded_by || "admin",

        /* S3 mapping */
        body.public_id || null,
        body.secure_url || null,
      ]
    );

    return NextResponse.json({
      success: true,
      id: result.insertId,
    });
  } catch (err) {
    console.error("SAVE VIDEO ERROR:", err);
    return NextResponse.json(
      { error: "Failed to save video" },
      { status: 500 }
    );
  }
}

/* ============================
   DELETE VIDEO
============================ */

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Video ID required" },
        { status: 400 }
      );
    }

    const [result]: any = await pool.query(
      `DELETE FROM videos WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Video deleted successfully",
    });
  } catch (err) {
    console.error("DELETE VIDEO ERROR:", err);
    return NextResponse.json(
      { error: "Failed to delete video" },
      { status: 500 }
    );
  }
}