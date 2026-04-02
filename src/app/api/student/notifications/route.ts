import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export async function GET() {
  const [rows] = await pool.execute(
    "SELECT * FROM notifications ORDER BY created_at DESC"
  );

  return NextResponse.json(rows);
}