import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

export const runtime = "nodejs";

/* ================= DB POOL ================= */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

/* =================================================
   POST — CREATE OR MERGE MULTIPLE SLOT TIMES
================================================= */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      mentorName,
      mentorEmail,
      courseId,
      slotDate,
      slots,
      meetingUrl, // ⭐ NEW FIELD
      notes,
      isActive,
    } = body;

    if (!mentorName || !slotDate || !Array.isArray(slots)) {
      return NextResponse.json(
        { error: "mentorName, slotDate & slots required" },
        { status: 400 }
      );
    }

    /* ================= FORMAT SLOT JSON ================= */
    const newSlots = slots.map((s: any) => ({
      time: s.time,
      capacity: Number(s.capacity || 0),
      booked: 0,
    }));

    /* ================= CHECK EXISTING ROW ================= */
    const [rows]: any = await pool.query(
      `
      SELECT id, slot_times
      FROM mentor_slots
      WHERE mentor_name = ?
      AND DATE(slot_start) = ?
      LIMIT 1
      `,
      [mentorName, slotDate]
    );

    /* =================================================
       IF EXISTS → MERGE TIMES
    ================================================= */
    if (rows.length > 0) {
      const existing = rows[0];

      let oldSlots: any[] = [];
      if (existing.slot_times) {
        try {
          oldSlots = JSON.parse(existing.slot_times);
        } catch {
          oldSlots = [];
        }
      }

      const merged = [...oldSlots];

      newSlots.forEach((n: any) => {
        if (!merged.find((m: any) => m.time === n.time)) {
          merged.push(n);
        }
      });

      await pool.query(
        `
        UPDATE mentor_slots
        SET slot_times = ?,
            meeting_url = ?,  -- ⭐ SAVE SEPARATE COLUMN
            updated_at = NOW()
        WHERE id = ?
        `,
        [JSON.stringify(merged), meetingUrl || null, existing.id]
      );

      const [updatedRows]: any = await pool.query(
        `SELECT * FROM mentor_slots WHERE id = ? LIMIT 1`,
        [existing.id]
      );

      const row = updatedRows[0];
      try {
        row.slot_times = JSON.parse(row.slot_times);
      } catch {
        row.slot_times = [];
      }

      return NextResponse.json({
        success: true,
        mode: "merged",
        row,
      });
    }

    /* =================================================
       CREATE NEW ROW
    ================================================= */
    const sql = `
      INSERT INTO mentor_slots
      (
        course_id,
        mentor_name,
        mentor_email,
        meeting_url,  -- ⭐ NEW COLUMN
        slot_start,
        slot_times,
        capacity,
        booked_count,
        notes,
        is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
    `;

    const params = [
      courseId || null,
      mentorName,
      mentorEmail || null,
      meetingUrl || null, // ⭐ SAVED HERE
      slotDate,
      JSON.stringify(newSlots),
      notes || null,
      isActive ? 1 : 0,
    ];

    const [insertRes]: any = await pool.query(sql, params);
    const insertId = insertRes.insertId;

    const [createdRows]: any = await pool.query(
      `SELECT * FROM mentor_slots WHERE id = ? LIMIT 1`,
      [insertId]
    );

    const row = createdRows[0];
    try {
      row.slot_times = JSON.parse(row.slot_times);
    } catch {
      row.slot_times = [];
    }

    return NextResponse.json({
      success: true,
      mode: "created",
      row,
    });
  } catch (err) {
    console.error("SAVE mentor slot error:", err);

    return NextResponse.json(
      { error: "Server error while saving slot" },
      { status: 500 }
    );
  }
}

/* =================================================
   GET — FETCH SLOTS FOR LIST PAGE
================================================= */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const mentorName = url.searchParams.get("mentorName");
    const courseId = url.searchParams.get("courseId");
    const date = url.searchParams.get("date");

    let q = "SELECT * FROM mentor_slots WHERE 1=1";
    const params: any[] = [];

    if (mentorName) {
      q += " AND mentor_name = ?";
      params.push(mentorName);
    }

    if (courseId) {
      q += " AND course_id = ?";
      params.push(courseId);
    }

    if (date) {
      q += " AND DATE(slot_start) = ?";
      params.push(date);
    }

    q += " ORDER BY slot_start DESC";

    const [rows]: any = await pool.query(q, params);

    rows.forEach((r: any) => {
      try {
        r.slot_times = JSON.parse(r.slot_times);
      } catch {
        r.slot_times = [];
      }
    });

    return NextResponse.json({ rows });
  } catch (err) {
    console.error("GET mentor slots error:", err);

    return NextResponse.json(
      { error: "Server error fetching slots" },
      { status: 500 }
    );
  }
}