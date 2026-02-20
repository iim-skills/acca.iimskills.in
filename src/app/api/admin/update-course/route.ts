import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export async function POST(req: Request) {
  const body = await req.json();

  await db.query(
    `UPDATE courses 
     SET name=?, description=?, courseData=? 
     WHERE id=?`,
    [
      body.name,
      body.description,
      JSON.stringify(body.courseData),
      body.id,
    ]
  );

  return NextResponse.json({ success: true });
}