import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

/* ========== DB POOL ========== */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
});

/* ========== MAILER ========== */
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT || 587),
  secure: Number(process.env.MAIL_PORT) === 465,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/* Helper to normalize time strings */
const normalizeTime = (t: string) => {
  if (!t) return t;
  t = String(t);
  if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`;
  if (/^\d{1}:\d{2}$/.test(t)) {
    const [h, m] = t.split(":");
    return `${h.padStart(2, "0")}:${m}:00`;
  }
  const match = t.match(/(\d{2}:\d{2}:\d{2})/);
  if (match) return match[1];
  return t;
};

/**
 * POST /api/bookings
 */
export async function POST(req: Request) {
  const conn = await pool.getConnection();
  try {
    const body = (await req.json?.()) ?? {};
    const { slotRowId, slotTime, name, email, phone, studentId } = body;

    if (!slotRowId || !slotTime || !name || !email) {
      return NextResponse.json({ error: "slotRowId, slotTime, name and email required" }, { status: 400 });
    }

    const normalizedTime = normalizeTime(slotTime);

    await conn.beginTransaction();

    /* ⭐ ADD meeting_url HERE */
    const [rows]: any = await conn.query(
      `SELECT id, mentor_name, mentor_email, meeting_url, slot_times, capacity, booked_count, slot_start
       FROM mentor_slots
       WHERE id = ?
       FOR UPDATE`,
      [slotRowId]
    );

    if (!rows || rows.length === 0) {
      await conn.rollback();
      return NextResponse.json({ error: "slot row not found" }, { status: 404 });
    }

    const row = rows[0];

    let slotTimes: any[] = [];
    if (row.slot_times) {
      try {
        slotTimes = typeof row.slot_times === "string" ? JSON.parse(row.slot_times) : row.slot_times;
      } catch {
        slotTimes = [];
      }
    }

    if (!Array.isArray(slotTimes) || slotTimes.length === 0) {
      const raw = row.slot_start ? String(row.slot_start) : "";
      const tm = (raw.match(/(\d{2}:\d{2}:\d{2})/) || [])[0] || "00:00:00";
      slotTimes = [{ time: tm, capacity: Number(row.capacity || 0), booked: Number(row.booked_count || 0) }];
    }

    const idx = slotTimes.findIndex(
      (s: any) => normalizeTime(String(s.time || "")) === normalizedTime
    );

    if (idx === -1) {
      await conn.rollback();
      return NextResponse.json({ error: "slot time not found for this row" }, { status: 404 });
    }

    const target = slotTimes[idx];
    const capacity = Number(target.capacity || 0);
    const booked = Number(target.booked || 0);

    if (capacity - booked <= 0) {
      await conn.rollback();
      return NextResponse.json({ error: "slot is full" }, { status: 409 });
    }

    slotTimes[idx].booked = booked + 1;

    await conn.query(
      `UPDATE mentor_slots SET slot_times = ?, booked_count = booked_count + 1, updated_at = NOW() WHERE id = ?`,
      [JSON.stringify(slotTimes), slotRowId]
    );

    const [insRes]: any = await conn.query(
      `INSERT INTO mentor_bookings
       (slot_row_id, slot_time, student_id, student_name, student_email, student_phone, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [slotRowId, normalizedTime, studentId || null, name, email, phone || null]
    );

    const bookingId = insRes.insertId;

    await conn.commit();
    conn.release();

    /* ================= EMAILS ================= */
    (async () => {
      try {
        const adminEmail = process.env.ADMIN_EMAIL;
        const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;

        const mentorEmail = row.mentor_email || null;
        const mentorName = row.mentor_name || "Mentor";
        const meetingUrl = row.meeting_url || null;

        const bookingDate = String(row.slot_start).slice(0, 10);
        
        // Shared Styles
        const containerStyle = `font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;`;
        const headerStyle = `background-color: #4f46e5; color: #ffffff; padding: 24px; text-align: center;`;
        const bodyStyle = `padding: 24px; background-color: #ffffff;`;
        const itemStyle = `margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px border #f9f9f9;`;
        const labelStyle = `font-weight: bold; color: #666; font-size: 13px; text-transform: uppercase;`;
        const valueStyle = `font-size: 16px; color: #111;`;
        const buttonStyle = `display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px;`;
        const footerStyle = `background-color: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #999;`;

        const meetingButton = meetingUrl
          ? `<div style="text-align: center;"><a href="${meetingUrl}" target="_blank" style="${buttonStyle}">Join Online Meeting</a></div>`
          : `<p style="color: #666; font-style: italic; text-align: center; margin-top: 20px;">Meeting link will be shared by the mentor if applicable.</p>`;

        const detailsHtml = `
          <div style="${itemStyle}">
            <div style="${labelStyle}">Student Name</div>
            <div style="${valueStyle}">${name}</div>
          </div>
          <div style="${itemStyle}">
            <div style="${labelStyle}">Email & Phone</div>
            <div style="${valueStyle}">${email} ${phone ? `| ${phone}` : ""}</div>
          </div>
          <div style="${itemStyle}">
            <div style="${labelStyle}">Date & Time</div>
            <div style="${valueStyle}">${bookingDate} at ${normalizedTime}</div>
          </div>
          <div style="${itemStyle}">
            <div style="${labelStyle}">Booking Reference</div>
            <div style="${valueStyle}">#${bookingId}</div>
          </div>
        `;

        // 1. ADMIN EMAIL
        if (adminEmail) {
          await transporter.sendMail({
            from: fromEmail,
            to: adminEmail,
            subject: `[Admin] New Booking: ${name} with ${mentorName}`,
            html: `
              <div style="${containerStyle}">
                <div style="${headerStyle} background-color: #1f2937;">
                  <h2 style="margin: 0;">New System Booking</h2>
                </div>
                <div style="${bodyStyle}">
                  ${detailsHtml}
                  <div style="${itemStyle}">
                    <div style="${labelStyle}">Mentor</div>
                    <div style="${valueStyle}">${mentorName} (${mentorEmail || 'N/A'})</div>
                  </div>
                </div>
                <div style="${footerStyle}">Internal Notification System</div>
              </div>
            `
          });
        }

        // 2. MENTOR EMAIL
        if (mentorEmail) {
          await transporter.sendMail({
            from: fromEmail,
            to: mentorEmail,
            subject: `[New Booking] ${name} — ${bookingDate} ${normalizedTime}`,
            html: `
              <div style="${containerStyle}">
                <div style="${headerStyle}">
                  <h2 style="margin: 0;">New Mentorship Session</h2>
                </div>
                <div style="${bodyStyle}">
                  <p>Hi <strong>${mentorName}</strong>,</p>
                  <p>A student has just booked a session with you. Here are the details:</p>
                  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    ${detailsHtml}
                  </div>
                  ${meetingButton}
                </div>
                <div style="${footerStyle}">Please be ready 5 minutes before the scheduled time.</div>
              </div>
            `
          });
        }

        // 3. STUDENT EMAIL
        await transporter.sendMail({
          from: fromEmail,
          to: email,
          subject: `Confirmed: Your Session with ${mentorName}`,
          html: `
            <div style="${containerStyle}">
              <div style="${headerStyle}">
                <h2 style="margin: 0;">Booking Confirmed</h2>
              </div>
              <div style="${bodyStyle}">
                <p>Hi <strong>${name}</strong>,</p>
                <p>Your mentorship session with <strong>${mentorName}</strong> has been successfully booked!</p>
                <div style="border: 2px solid #eef2ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  ${detailsHtml}
                </div>
                <p><strong>Next Steps:</strong> Join the meeting at the scheduled time using the button below.</p>
                ${meetingButton}
              </div>
              <div style="${footerStyle}">
                If you need to reschedule, please contact the mentor directly at ${mentorEmail || 'our support'}.
              </div>
            </div>
          `
        });

      } catch (mailErr) {
        console.error("booking email error:", mailErr);
      }
    })();

    return NextResponse.json({
      ok: true,
      bookingId,
      slotRowId,
      slotTime: normalizedTime,
      booked: booked + 1,
      capacity,
      availableAfter: Math.max(0, capacity - (booked + 1)),
    });

  } catch (err) {
    try { await conn.rollback(); } catch {}
    try { conn.release(); } catch {}
    console.error("bookings POST error:", err);
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}