export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import nodemailer from "nodemailer";
import { revalidatePath } from "next/cache";

/* ---------------- DB CONNECTION ---------------- */
async function db() {
  return mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
}

/* ---------------- COURSE → PERKS URL MAP ---------------- */
const PERKS_PATHS: Record<string, string> = {
  "free-data-analytics-course": "/perks/data-analytics",
  "free-digital-marketing-course": "/perks/digital-marketing",
  "free-financial-modeling-course": "/perks/financial-modeling",
};

function getPerksUrl(courseSlug: string) {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://iimskills.com";
  const path =
    PERKS_PATHS[courseSlug] || `/free-courses/${courseSlug}/perks`;
  return `${site.replace(/\/$/, "")}${path}`;
}

/* ---------------- MAILER (ENV BASED) ---------------- */
function createTransporterIfConfigured() {
  const host = process.env.MAIL_HOST;
  const port = process.env.MAIL_PORT;
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;

  if (!host || !port || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: Number(port),
    secure: process.env.MAIL_SECURE === "true",
    auth: { user, pass },
  });
}

/* ---------------- EMAIL HELPERS ---------------- */
function escapeHtml(str: string) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ---------------- SEND USER EMAIL ---------------- */
async function sendDecisionMail(
  email: string,
  name: string,
  decision: string,
  courseSlug: string,
  reviewNote?: string | null
) {
  const transporter = createTransporterIfConfigured();
  if (!transporter) {
    console.warn("⚠ MAIL not configured, skipping email.");
    return;
  }

  const approved = decision.toLowerCase() === "approved";
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://iimskills.com";

  const perksUrl = getPerksUrl(courseSlug);
  const repostUrl = `${site}/free-courses/${courseSlug}/curriculum`;

  const subject = approved
    ? "You’re Eligible for Free Resume Analysis & Placement Guidance"
    : "LinkedIn Verification Update Required";

  // Use the new template for approved state, fallback to simple text for rejected
  const html = approved
    ? `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <title>Free Resume Analysis & Placement Guidance</title>
  <style type="text/css">
    /* Client-specific resets */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; }
    
    /* Global Styles */
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #475569;
      line-height: 1.6;
    }
    .container {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    /* Responsive */
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .content-padding { padding: 24px 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <!-- Main Card Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="600" class="container" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          <!-- Gradient Header Bar -->
          <tr>
            <td height="8" style="background: linear-gradient(90deg, #2563eb, #4f46e5);"></td>
          </tr>
          <!-- Logo / Header Section -->
          <tr>
            <td align="center" style="padding: 40px 40px 0 40px;">
              <h1 style="margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
                IIM SKILLS
              </h1>
            </td>
          </tr>
          <!-- Content Section -->
          <tr>
            <td class="content-padding" style="padding: 40px 48px;">
              <!-- Salutation -->
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #334155; font-weight: 600;">
                Dear ${escapeHtml(name)},
              </p>
              <!-- Main Intro -->
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #475569; line-height: 1.6;">
                We’re excited to inform you that you are now eligible for a <strong style="color: #2563eb;">Free Resume Analysis and Placement Guidance</strong> to help you prepare for a successful Data Analyst job.
              </p>
              <!-- Boxed Benefits Section -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 16px 0; font-size: 14px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
                      Our experts will:
                    </p>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 12px;">
                      <tr>
                        <td valign="top" width="24" style="padding-top: 2px;">
                           <span style="color: #2563eb; font-weight: bold; font-size: 18px;">&bull;</span>
                        </td>
                        <td style="font-size: 15px; color: #475569;">
                          Review your resume and suggest industry-relevant improvements
                        </td>
                      </tr>
                    </table>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 12px;">
                      <tr>
                        <td valign="top" width="24" style="padding-top: 2px;">
                           <span style="color: #2563eb; font-weight: bold; font-size: 18px;">&bull;</span>
                        </td>
                        <td style="font-size: 15px; color: #475569;">
                          Share personalized feedback to strengthen your data analytics profile
                        </td>
                      </tr>
                    </table>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td valign="top" width="24" style="padding-top: 2px;">
                           <span style="color: #2563eb; font-weight: bold; font-size: 18px;">&bull;</span>
                        </td>
                        <td style="font-size: 15px; color: #475569;">
                          Guide you on placement strategies, interview preparation, and career roadmap
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- Value Prop -->
              <p style="margin: 24px 0 32px 0; font-size: 16px; color: #475569; line-height: 1.6;">
                This support is designed to help you stand out to recruiters and move confidently toward your data analytics career goals.
              </p>
           
              <!-- Bottom Note -->
              <p style="margin: 32px 0 0 0; font-size: 14px; color: #64748b; text-align: center;">
                📌 Take advantage of this opportunity now. If you have any questions, feel free to reach out to us.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 14px; font-weight: 700; color: #334155;">
                Best regards,<br>Team IIM SKILLS
              </p>
            </td>
          </tr>
        </table>
        <!-- Unsubscribe / Legal -->
        <table border="0" cellpadding="0" cellspacing="0" width="600" class="container">
          <tr>
            <td align="center" style="padding: 24px; font-size: 12px; color: #94a3b8;">
              <p style="margin: 0;">&copy; ${new Date().getFullYear()} IIM SKILLS. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `
    : `
      <html>
      <p>Hi ${escapeHtml(name)},</p>

      <p>Your LinkedIn post couldn’t be verified, so exclusive perks remain locked.</p>
      <p>
        👉 <a href="${repostUrl}" target="_blank">
          Click here to repost correctly and resubmit
        </a>
      </p>

      <p>Regards,<br/>IIM SKILLS</p>
      </html>
    `;

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to: email,
    subject,
    html,
  });
}

/* ---------------- ADMIN ACTION API ---------------- */
export async function POST(req: Request) {
  let conn: any;

  try {
    const body = await req.json();
    console.log("📥 ADMIN ACTION BODY:", body);

    const email = (body.email || "").toLowerCase().trim();
    const name = body.name || "Learner";
    const courseSlug = (body.courseSlug || "").trim();
    const decision = (body.decision || "").trim();
    const reviewNote = body.reviewNote || null;

    if (!email || !courseSlug || !decision) {
      return NextResponse.json(
        { error: "Missing email, courseSlug or decision" },
        { status: 400 }
      );
    }

    conn = await db();

    /* ---- UPDATE DB ---- */
    const [result]: any = await conn.execute(
      `
      UPDATE free_course_enrollments
      SET
        linkedIN_Status = ?,
        certificate_decision_at = NOW(),
        certificate_review_note = ?
      WHERE email = ? AND course_slug = ?
      `,
      [decision, reviewNote, email, courseSlug]
    );

    if (!result.affectedRows) {
      return NextResponse.json(
        { error: "Enrollment not found" },
        { status: 404 }
      );
    }

    /* ---- SEND EMAIL (NON-BLOCKING) ---- */
    try {
      await sendDecisionMail(email, name, decision, courseSlug, reviewNote);
    } catch (e) {
      console.error("❌ EMAIL FAILED:", e);
    }

    /* ---- REVALIDATE ADMIN PAGE ---- */
    try {
      revalidatePath("/admin/free-course-enrollments");
    } catch {}

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ ADMIN ACTION ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}