import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export async function GET() {
  const [rows]: any = await db.query("SELECT * FROM courses");

  const parsed = rows.map((c: any) => ({
    ...c,
    courseData: JSON.parse(c.courseData || '{"modules":[]}'),
  }));

  return NextResponse.json(parsed);
}