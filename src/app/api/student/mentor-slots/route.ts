// src/app/api/student/mentor-slots/route.ts
import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

export const runtime = "nodejs";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  // return DATE / DATETIME as strings (avoids timezone conversion surprises)
  dateStrings: true,
});

/**
 * GET ?start=YYYY-MM-DD&end=YYYY-MM-DD
 * Returns rows with parsed slot_times (if present).
 * Response: [{ id, mentor_name, slot_date: 'YYYY-MM-DD', slot_times: [{time:'HH:MM:SS', capacity:number, booked:number, notes, meeting_url}, ...] }, ...]
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    // basic validation (YYYY-MM-DD)
    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    if (!start || !end || !dateRe.test(start) || !dateRe.test(end)) {
      return NextResponse.json(
        { error: "start and end query params required in YYYY-MM-DD format" },
        { status: 400 }
      );
    }

    const [rows]: any = await pool.query(
      `SELECT id, mentor_name, slot_start, capacity, booked_count, notes, meeting_url, slot_times
       FROM mentor_slots
       WHERE is_active = 1
       AND slot_start BETWEEN ? AND ?
       ORDER BY slot_start ASC`,
      [`${start} 00:00:00`, `${end} 23:59:59`]
    );

    const out = (rows || []).map((r: any) => {
      // ensure slot_start is a string like '2026-02-27 00:00:00' or '2026-02-27'
      const slotStartRaw: string = r.slot_start ? String(r.slot_start) : "";

      // derive date part (YYYY-MM-DD). If slot_start is only date string this still works.
      const slotDate = slotStartRaw.slice(0, 10);

      // parse slot_times flexibly (may be JSON string or already object)
      let parsedSlots: any[] | null = null;
      if (r.slot_times) {
        try {
          parsedSlots = typeof r.slot_times === "string" ? JSON.parse(r.slot_times) : r.slot_times;
          if (!Array.isArray(parsedSlots)) parsedSlots = null;
        } catch {
          parsedSlots = null;
        }
      }

      // normalize entries (ensure time is HH:MM:SS and numeric capacity/booked)
      const normalizeTime = (t: string) => {
        if (typeof t !== "string") return t;
        // if it's 'HH:MM' add ':00'
        if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`;
        // if it's 'H:MM' or similar, pad left
        if (/^\d{1}:\d{2}$/.test(t)) {
          const [h, m] = t.split(":");
          return `${h.padStart(2, "0")}:${m}:00`;
        }
        // if already HH:MM:SS or ISO time, try to extract HH:MM:SS
        const match = t.match(/(\d{2}:\d{2}:\d{2})/);
        if (match) return match[1];
        // fallback: return as-is
        return t;
      };

      if (parsedSlots && parsedSlots.length > 0) {
        parsedSlots = parsedSlots.map((s: any) => {
          return {
            time: normalizeTime(String(s.time || s.start || s.timeISO || "")),
            capacity: Number(s.capacity ?? s.cap ?? 0),
            booked: Number(s.booked ?? s.booked_count ?? 0),
            notes: s.notes ?? null,
            meeting_url: s.meeting_url ?? s.meetingUrl ?? null,
          };
        });
      } else {
        // fallback for legacy single-slot rows (slot_start contains time)
        const fallbackTime = (() => {
          if (!slotStartRaw) return "00:00:00";
          // try to extract time HH:MM:SS from 'YYYY-MM-DD HH:MM:SS' or 'HH:MM:SS'
          const tmatch = slotStartRaw.match(/(\d{2}:\d{2}:\d{2})/);
          if (tmatch) return tmatch[1];
          const shortMatch = slotStartRaw.match(/(\d{2}:\d{2})/);
          if (shortMatch) return `${shortMatch[1]}:00`;
          return "00:00:00";
        })();

        parsedSlots = [
          {
            time: fallbackTime,
            capacity: Number(r.capacity ?? 0),
            booked: Number(r.booked_count ?? 0),
            notes: r.notes ?? null,
            meeting_url: r.meeting_url ?? null,
          },
        ];
      }

      return {
        id: r.id,
        mentor_name: r.mentor_name,
        slot_date: slotDate, // YYYY-MM-DD
        slot_times: parsedSlots,
      };
    });

    return NextResponse.json(out);
  } catch (err) {
    console.error("student mentor-slots GET error:", err);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}