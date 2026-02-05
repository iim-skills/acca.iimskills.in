import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { sendMail } from "../../../../lib/email";

/* ---------------- MYSQL POOL ---------------- */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/* =================================================
   POST → CHANGE PASSWORD
   Body: { email, newPassword }
================================================= */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const email = (body.email || "").toLowerCase().trim();
    const newPassword = (body.newPassword || "").toString();

    // Basic validation
    if (!email || !newPassword) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const conn = await pool.getConnection();

    try {
      /* -----------------------------------------
          UPDATE PASSWORD IN DATABASE
       ----------------------------------------- */
      const [result]: any = await conn.execute(
        `
        UPDATE free_course_enrollments
        SET password = ?
        WHERE LOWER(email) = ?
        `,
        [newPassword, email]
      );

      if (!result.affectedRows) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      /* -----------------------------------------
          SEND PASSWORD EMAIL
       ----------------------------------------- */
      try {
        await sendMail(
          email,
          "Your IIM SKILLS Password Has Been Updated",
          `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Updated</title>
    <style>
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        table { border-collapse: collapse !important; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f7; color: #333333; }
        @media screen and (max-width: 600px) {
            .email-container { width: 100% !important; }
            .content-padding { padding: 20px !important; }
            .header-text { font-size: 24px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f7;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td style="padding: 20px 0 20px 0;" align="center">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" class="email-container" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <tr>
                        <td bgcolor="#003366" style="padding: 30px 40px; text-align: center;">
                            <h1 style="margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 28px; line-height: 30px; color: #ffffff; font-weight: bold; letter-spacing: 1px;">
                                IIM SKILLS
                            </h1>
                        </td>
                    </tr>
                    <tr>
                        <td class="content-padding" style="padding: 40px 40px 20px 40px;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="color: #333333; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px;">
                                        <h2 class="header-text" style="margin: 0 0 20px 0; font-size: 24px; color: #333333; font-weight: 600;">
                                            Password Updated Successfully
                                        </h2>
                                        <p style="margin: 0 0 20px 0;">Hello,</p>
                                        <p style="margin: 0 0 20px 0;">
                                            This email is to confirm that the password for your <strong>IIM SKILLS</strong> account has been successfully changed.
                                        </p>
                                        <p style="margin: 0 0 10px 0;">Here is your new temporary password:</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding: 10px 0 30px 0;">
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td align="center" style="border-radius: 4px; border: 2px dashed #FF9900; background-color: #fff8f0;">
                                                    <p style="font-family: 'Courier New', Courier, monospace; font-size: 24px; font-weight: bold; color: #003366; margin: 0; padding: 15px 30px; letter-spacing: 2px;">
                                                        ${newPassword}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="background-color: #f9f9f9; border-left: 4px solid #003366; padding: 15px; margin-bottom: 20px; display: block;">
                                        <p style="margin: 0; font-size: 14px; color: #555555; line-height: 20px;">
                                            <strong>Security Tip:</strong> Please keep this password secure. We recommend logging in and changing this temporary password to something only you know as soon as possible.
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="color: #333333; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px; padding-top: 20px;">
                                        <p style="margin: 0;">If you did not request this change, please contact our support team immediately.</p>
                                        <br>
                                        <p style="margin: 0;">Regards,<br><strong>IIM SKILLS Team</strong></p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td bgcolor="#f4f4f7" style="padding: 20px 40px; text-align: center;">
                            <p style="margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; line-height: 18px; color: #888888;">
                                © 2025 IIM SKILLS. All rights reserved.<br>
                                Need help? <a href="#" style="color: #003366; text-decoration: underline;">Contact Support</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
          `
        );
      } catch (mailErr) {
        console.warn("⚠ Password email failed:", mailErr);
        // Do NOT fail API if mail fails
      }

      return NextResponse.json({ ok: true });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("❌ change-password error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}