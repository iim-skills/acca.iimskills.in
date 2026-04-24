import { NextResponse } from "next/server";
import db from "../../../../lib/db";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const email = String(body.email || "").trim().toLowerCase();
    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    console.log("Free Login Request:", {
      email,
      name,
      phone,
    });

    /* ===============================
       CHECK STUDENT
    =============================== */

    const [rows]: any = await db.query(
      `SELECT * FROM lms_students WHERE email=? LIMIT 1`,
      [email]
    );

    let student: any;
    let finalName = "";
    let finalPhone = "";

    /* ===============================
       CREATE NEW FREE STUDENT
    =============================== */

    if (!rows.length) {
      finalName = name || email.split("@")[0];
      finalPhone = phone || "";

      const [insertRes]: any = await db.query(
        `
        INSERT INTO lms_students
        (
          name,
          phone,
          email,
          login_id,
          password,
          courses,
          student_type
        )
        VALUES (?,?,?,?,?,?,?)
        `,
        [
          finalName,
          finalPhone,
          email,
          email,
          email,
          JSON.stringify([]),
          "free",
        ]
      );

      const [newUser]: any = await db.query(
        `SELECT * FROM lms_students WHERE id=?`,
        [insertRes.insertId]
      );

      student = newUser[0];

      console.log("New Free Student Created:", student.email);
    } else {
      /* ===============================
         EXISTING USER LOGIN
      =============================== */

      student = rows[0];

      finalName = name || student.name || email.split("@")[0];
      finalPhone = phone || student.phone || "";

      await db.query(
        `UPDATE lms_students SET password=?, name=?, phone=? WHERE id=?`,
        [email, finalName, finalPhone || null, student.id]
      );

      student = {
        ...student,
        name: finalName,
        phone: finalPhone,
      };

      console.log("Existing Free Login:", student.email);
    }

    /* ===============================
       SMTP SETUP
    =============================== */

    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT),
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    /* ===============================
       USER EMAIL TEMPLATE
    =============================== */

    const userMail = {
      from: `"ACCA, IIM SKILLS" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "🚀 Welcome to Your Learning Journey!",
      html: `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Welcome Email</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f6f8fc;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f8fc;padding:30px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
            
            <tr>
              <td style="background:#4F46E5;padding:24px 30px;text-align:center;">
                <h1 style="margin:0;color:#ffffff;font-size:26px;line-height:1.2;">Welcome to LMS</h1>
                <p style="margin:8px 0 0;color:#e0e7ff;font-size:14px;">Your free access is now ready</p>
              </td>
            </tr>

            <tr>
              <td style="padding:30px 30px 10px 30px;color:#111827;">
                <h2 style="margin:0 0 14px 0;font-size:22px;color:#4F46E5;">Hi ${finalName},</h2>
                <p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:#374151;">
                  Your account has been successfully created. You can now access your free course materials and begin learning right away.
                </p>
                <p style="margin:0 0 18px 0;font-size:15px;line-height:1.7;color:#374151;">
                  Below are your login details:
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:0 30px 24px 30px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="border:1px dashed #4F46E5;border-radius:10px;background:#f9fafb;">
                  <tr>
                    <td style="padding:16px 18px;">
                      <p style="margin:0 0 8px 0;font-size:14px;color:#374151;"><strong>Email/Username:</strong> ${student.email}</p>
                      <p style="margin:0;font-size:14px;color:#374151;"><strong>Password:</strong> ${email}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:0 30px 30px 30px;text-align:center;">
                <a href="https://acca.iimskills.in/"
                   style="display:inline-block;background:#4F46E5;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;padding:12px 26px;border-radius:8px;">
                  Go to Dashboard
                </a>
              </td>
            </tr>

            <tr>
              <td style="padding:18px 24px;background:#f3f4f6;text-align:center;font-size:12px;color:#6b7280;">
                © ${new Date().getFullYear()} LMS Academy. All rights reserved.
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
      `,
    };

    /* ===============================
       ADMIN EMAIL TEMPLATE
    =============================== */

    const adminMail = {
      from: `"ACCA, IIM SKILLS" <${process.env.MAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: "🔔 New Free Student Registered",
      html: `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>New Free Student Alert</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:30px 0;">
      <tr>
        <td align="center">
          <table width="650" cellpadding="0" cellspacing="0" style="width:650px;max-width:650px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
            
            <tr>
              <td style="background:#ef4444;padding:22px 30px;text-align:center;">
                <h1 style="margin:0;color:#ffffff;font-size:24px;line-height:1.2;">New User Alert</h1>
                <p style="margin:8px 0 0;color:#fee2e2;font-size:14px;">A new free student has registered</p>
              </td>
            </tr>

            <tr>
              <td style="padding:30px;color:#111827;">
                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="padding:12px 10px;border-bottom:1px solid #e5e7eb;width:180px;"><strong>Name:</strong></td>
                    <td style="padding:12px 10px;border-bottom:1px solid #e5e7eb;">${finalName}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 10px;border-bottom:1px solid #e5e7eb;"><strong>Email:</strong></td>
                    <td style="padding:12px 10px;border-bottom:1px solid #e5e7eb;">${student.email}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 10px;border-bottom:1px solid #e5e7eb;"><strong>Phone:</strong></td>
                    <td style="padding:12px 10px;border-bottom:1px solid #e5e7eb;">${finalPhone || "-"}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 10px;border-bottom:1px solid #e5e7eb;"><strong>Timestamp:</strong></td>
                    <td style="padding:12px 10px;border-bottom:1px solid #e5e7eb;">${new Date().toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 10px;"><strong>Status:</strong></td>
                    <td style="padding:12px 10px;">
                      <span style="display:inline-block;background:#dcfce7;color:#166534;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:bold;">
                        Free User
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:18px 24px;background:#f3f4f6;text-align:center;font-size:12px;color:#6b7280;">
                Generated automatically by LMS system
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
      `,
    };

    /* ===============================
       SEND MAIL
    =============================== */

    try {
      const userRes = await transporter.sendMail(userMail);
      console.log("✅ USER MAIL SENT:", userRes.messageId);

      const adminRes = await transporter.sendMail(adminMail);
      console.log("✅ ADMIN MAIL SENT:", adminRes.messageId);
    } catch (mailError) {
      console.error("❌ MAIL ERROR:", mailError);
    }

    /* ===============================
       RESPONSE
    =============================== */

    return NextResponse.json({
      id: student.id,
      name: finalName,
      phone: finalPhone,
      email: student.email,
      courses: [],
      role: "student",
      studentType: "free",
    });
  } catch (err) {
    console.error("Free login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}