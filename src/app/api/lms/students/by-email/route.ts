import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

/* ---------- GET STUDENT BY EMAIL ---------- */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const [rows]: any = await pool.query(
    `SELECT
      name,
      email,
      course_slug,
      course_title,
      modules,
      status
     FROM lms_students
     WHERE email = ?
     LIMIT 1`,
    [email]
  );

  if (!rows.length) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const s = rows[0];

  return NextResponse.json({
    name: s.name,
    email: s.email,
    courseSlug: s.course_slug,
    course: s.course_title,
    assignedModules: JSON.parse(s.modules || "[]"),
    status: s.status || "active",
  });
}

/* ---------- UPDATE STUDENT BY EMAIL ---------- */
export async function PUT(req: Request) {
  const body = await req.json();

  if (!body.email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  await pool.query(
    `UPDATE lms_students
     SET modules = ?, status = ?, updated_at = NOW()
     WHERE email = ?`,
    [
      JSON.stringify(body.modules || []),
      body.status || "active",
      body.email,
    ]
  );

  return NextResponse.json({ ok: true });
}
