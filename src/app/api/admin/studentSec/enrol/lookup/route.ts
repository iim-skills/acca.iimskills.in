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

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = (url.searchParams.get("email") ?? "").toString().trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  let conn: any;
  try {
    conn = await pool.getConnection();
    const [rows]: any = await conn.execute(
      `SELECT id, name, email, phone, course_slug, course_title, modules, batch_id, batch_name
       FROM lms_students WHERE email = ? LIMIT 1`,
      [email]
    );
    if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const student = rows[0];
    try { student.modules = JSON.parse(student.modules ?? "[]"); } catch { student.modules = []; }

    return NextResponse.json({ ok: true, student });
  } catch (err) {
    console.error("ENROL LOOKUP ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally {
    try { if (conn) await conn.release(); } catch {}
  }
}