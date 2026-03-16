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
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const conn = await pool.getConnection();

    const [rows]: any = await conn.execute(
      `SELECT courses FROM lms_students WHERE email = ? LIMIT 1`,
      [email]
    );

    conn.release();

    if (!rows.length) {
      return NextResponse.json([]);
    }

    const courses = rows[0].courses
      ? JSON.parse(rows[0].courses)
      : [];

    return NextResponse.json(courses);

  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}