import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      name,
      email,
      phone,
      date,
      time,
    } = body;

    if (!name || !email || !date || !time) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    /* ================= SMTP SETUP ================= */

    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT),
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    /* ================= USER MAIL ================= */

    const userMail = {
      from: `"Mentor Team" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "✅ Your Mentor Session is Confirmed",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6">
          <h2>Hi ${name},</h2>

          <p>Your mentor session has been <strong>successfully booked</strong>.</p>

          <table style="border-collapse: collapse; margin-top: 12px">
            <tr>
              <td style="padding: 6px 12px; font-weight: bold">📅 Date</td>
              <td style="padding: 6px 12px">${date}</td>
            </tr>
            <tr>
              <td style="padding: 6px 12px; font-weight: bold">⏰ Time</td>
              <td style="padding: 6px 12px">${time}</td>
            </tr>
          </table>

          <p style="margin-top: 16px">
            You will receive the meeting link before the session.
          </p>

          <p>Best regards,<br/><strong>Mentor Team</strong></p>
        </div>
      `,
    };

    /* ================= ADMIN MAIL ================= */

    const adminMail = {
      from: `"Mentor Booking" <${process.env.MAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: "📌 New Mentor Session Booked",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6">
          <h2>New Mentor Booking</h2>

          <table style="border-collapse: collapse; margin-top: 12px">
            <tr>
              <td style="padding: 6px 12px; font-weight: bold">Name</td>
              <td style="padding: 6px 12px">${name}</td>
            </tr>
            <tr>
              <td style="padding: 6px 12px; font-weight: bold">Email</td>
              <td style="padding: 6px 12px">${email}</td>
            </tr>
            <tr>
              <td style="padding: 6px 12px; font-weight: bold">Phone</td>
              <td style="padding: 6px 12px">${phone || "—"}</td>
            </tr>
            <tr>
              <td style="padding: 6px 12px; font-weight: bold">Date</td>
              <td style="padding: 6px 12px">${date}</td>
            </tr>
            <tr>
              <td style="padding: 6px 12px; font-weight: bold">Time</td>
              <td style="padding: 6px 12px">${time}</td>
            </tr>
          </table>
        </div>
      `,
    };

    /* ================= SEND MAILS ================= */

    await transporter.sendMail(userMail);
    await transporter.sendMail(adminMail);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mail API Error:", error);
    return NextResponse.json(
      { message: "Failed to send email" },
      { status: 500 }
    );
  }
}
