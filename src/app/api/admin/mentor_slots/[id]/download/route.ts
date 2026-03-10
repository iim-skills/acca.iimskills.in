import mysql from "mysql2/promise";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const runtime = "nodejs";

/* ================= DB ================= */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

/* =================================================
   GET — DOWNLOAD REGISTRATION LIST (PDF TABLE)
================================================= */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    /* ================= FETCH BOOKINGS ================= */
    const [rows]: any = await pool.query(
      `
      SELECT student_name, student_email, student_phone, slot_time
      FROM mentor_bookings
      WHERE slot_row_id = ?
      ORDER BY created_at DESC
      `,
      [id]
    );

    /* ================= CREATE PDF ================= */
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([600, 800]);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const { height } = page.getSize();

    let y = height - 50;

    /* ================= HEADER ================= */
    page.drawText("Mentor Session Registration List", {
      x: 50,
      y,
      size: 16,
      font,
      color: rgb(0, 0, 0),
    });

    y -= 20;

    page.drawText(`Session ID: ${id}`, { x: 50, y, size: 10, font });
    y -= 15;

    page.drawText(`Total Registrations: ${rows.length}`, {
      x: 50,
      y,
      size: 10,
      font,
    });

    y -= 30;

    /* ================= TABLE HEADER ================= */
    const colName = 50;
    const colEmail = 180;
    const colPhone = 380;
    const colTime = 470;

    page.drawText("Name", { x: colName, y, size: 11, font });
    page.drawText("Email", { x: colEmail, y, size: 11, font });
    page.drawText("Phone", { x: colPhone, y, size: 11, font });
    page.drawText("Time", { x: colTime, y, size: 11, font });

    y -= 15;

    /* ================= TABLE ROWS ================= */
    rows.forEach((r: any) => {
      if (y < 50) {
        page = pdfDoc.addPage([600, 800]);
        y = height - 50;
      }

      page.drawText(String(r.student_name || "-"), {
        x: colName,
        y,
        size: 9,
        font,
      });

      page.drawText(String(r.student_email || "-"), {
        x: colEmail,
        y,
        size: 9,
        font,
      });

      page.drawText(String(r.student_phone || "-"), {
        x: colPhone,
        y,
        size: 9,
        font,
      });

      page.drawText(String(r.slot_time || "-"), {
        x: colTime,
        y,
        size: 9,
        font,
      });

      y -= 18;
    });

    /* ================= SAVE PDF ================= */
    const pdfBytes = await pdfDoc.save(); // ⭐ THIS WAS MISSING

    /* ================= RETURN RESPONSE ================= */
 const safeBuffer = new Uint8Array(pdfBytes).buffer;

return new Response(safeBuffer, {
  headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="registration-list-${id}.pdf"`,
  },
});
  } catch (err) {
    console.error("DOWNLOAD PDF error:", err);
    return Response.json({ error: "PDF failed" }, { status: 500 });
  }
}