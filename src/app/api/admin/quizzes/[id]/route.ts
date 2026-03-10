import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });

  const conn = await pool.getConnection();

  try {
    await conn.query("DELETE FROM quizzes WHERE id = ?", [params.id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  } finally {
    conn.release();
  }
}