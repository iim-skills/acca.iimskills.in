import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

export const runtime = "nodejs";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

/* ================= EDIT SESSION ================= */
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const { mentorName, mentorEmail, meetingUrl, notes, isActive } = body;

    await pool.query(
      `
      UPDATE mentor_slots
      SET mentor_name = ?,
          mentor_email = ?,
          meeting_url = ?,
          notes = ?,
          is_active = ?,
          updated_at = NOW()
      WHERE id = ?
      `,
      [
        mentorName || null,
        mentorEmail || null,
        meetingUrl || null,
        notes || null,
        isActive ? 1 : 0,
        id,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("EDIT session error:", err);
    return NextResponse.json({ error: "Edit failed" }, { status: 500 });
  }
}

/* ================= DELETE SESSION ================= */
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    await pool.query(`DELETE FROM mentor_slots WHERE id = ?`, [id]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE session error:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}