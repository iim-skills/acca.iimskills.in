import { NextRequest, NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");

  const connection = await db.getConnection();

  const [rows]: any = await connection.execute(
    `SELECT name,email,phone
     FROM lms_students WHERE email=? LIMIT 1`,
    [email]
  );

  connection.release();

  if (!rows.length) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({
    found: true,
    student: rows[0],
  });
}