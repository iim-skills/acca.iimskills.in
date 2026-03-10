import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

// ------------------------------------
// DB connection
// ------------------------------------
async function db() {
  return mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
}

// ------------------------------------
// GET USER + ENROLLMENT
// ------------------------------------
export async function GET(req: Request) {
  let conn: mysql.Connection | null = null;

  try {
    const url = new URL(req.url);
    const emailParam = url.searchParams.get("email");
    const courseSlug = url.searchParams.get("courseSlug") || "";

    if (!emailParam) {
      return NextResponse.json(
        { error: "Missing email" },
        { status: 400 }
      );
    }

    const email = emailParam.toLowerCase().trim();

    conn = await db();

    const [rows]: any = await conn.execute(
      `
      SELECT
        id,
        name,
        email,
        phone,
        course_slug,
        progress,
        enrolled_at,
        completed_at,
        certificate_url,
        certificate_status
      FROM free_course_enrollments
      WHERE email = ?
      ${courseSlug ? "AND course_slug = ?" : ""}
      ORDER BY enrolled_at DESC
      LIMIT 1
      `,
      courseSlug ? [email, courseSlug] : [email]
    );

    if (!rows.length) {
      return NextResponse.json(
        { error: "User / enrollment not found" },
        { status: 404 }
      );
    }

    const row = rows[0];

    // ✅ FIX: safely parse JSON + serialize dates
    const progress =
      typeof row.progress === "string"
        ? JSON.parse(row.progress)
        : row.progress || {};

    const enrolledAt = row.enrolled_at
      ? new Date(row.enrolled_at).toISOString()
      : null;

    const completedAt = row.completed_at
      ? new Date(row.completed_at).toISOString()
      : null;

    return NextResponse.json({
      ok: true,
      user: {
        name: row.name,
        email: row.email,
        phone: row.phone,
      },
      course: {
        slug: row.course_slug,
        progress,
        enrolledAt,      // ✅ now correctly returned
        completedAt,
        certificateUrl: row.certificate_url,
        certificateStatus: row.certificate_status,
      },
    });

  } catch (err) {
    console.error("❌ USER FETCH ERROR:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  } finally {
    if (conn) await conn.end();
  }
}
