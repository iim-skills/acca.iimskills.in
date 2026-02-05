// src/app/api/lms/login/route.ts
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const emailRaw = (body?.email ?? "").toString().trim().toLowerCase();
    const password = (body?.password ?? "").toString();

    if (!emailRaw || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    // Prefer a "user-only" row (course_slug IS NULL) if exists, otherwise take latest row for that email.
    const [rows]: any = await pool.query(
      `SELECT id, name, email, phone, password, course_slug, progress
       FROM free_course_enrollments
       WHERE LOWER(email)=?
       ORDER BY (course_slug IS NOT NULL) ASC, id DESC
       LIMIT 1`,
      [emailRaw]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = rows[0];

    // Plain-text check (matches how your table currently stores passwords)
    if (user.password !== password) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // Return safe user info (no password)
    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        course_slug: user.course_slug ?? null,
        progress: user.progress ?? null,
      },
    });
  } catch (err) {
    console.error("LOGIN API ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
