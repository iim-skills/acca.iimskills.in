// src/lib/email.ts
import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";


/**
 * Mail helper utilities for IIM SKILLS
 *
 * Exports:
 *  - sendMail(to, subject, html)
 *  - sendAdminNotification({ name, email, course, linkedinUrl, submissionId })
 *  - sendUserCertificateStatus({ email, name, status, submissionId, message? })
 *
 * Env expected:
 *  MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS, MAIL_FROM (optional), ADMIN_EMAIL, SITE_URL
 */

// Build transporter options using nodemailer's SMTP options type
function buildTransportOptions(): SMTPTransport.Options {
  const host = process.env.MAIL_HOST;
  const port = Number(process.env.MAIL_PORT || 587);
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;

  // Basic validation (fail early)
  if (!host || !user || !pass) {
    throw new Error("Missing MAIL_HOST / MAIL_USER / MAIL_PASS in environment");
  }

  const opts: SMTPTransport.Options = {
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
    // allow self-signed certs if needed — keeps connection resilient in some infra
    tls: { rejectUnauthorized: false },
  };

  // Nodemailer supports `family` but TS definitions may not list it — cast to any
  (opts as any).family = 4; // force IPv4 (helps avoid ::1 / IPv6 SMTP connection issues)

  return opts;
}

/**
 * sendMail - send an HTML email
 */
export async function sendMail(to: string, subject: string, html: string) {
  // In dev you may optionally skip sending — but by default we attempt sending.
  const transportOpts = buildTransportOptions();
  const transporter = nodemailer.createTransport(transportOpts);

  const from = process.env.MAIL_FROM || process.env.MAIL_USER || "no-reply@iimskills.com";

  // Verify connection (optional — helpful for clearer errors)
  try {
    await transporter.verify();
  } catch (vErr) {
    // still try to send (but log)
    console.warn("Mail transporter verification failed:", vErr);
  }

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html,
  });

  // You can log messageId or preview URL (if any)
  if (info?.messageId) {
    console.log("✉️ Mail sent:", info.messageId, "to", to);
  } else {
    console.log("✉️ Mail send attempted to", to);
  }
}

/**
 * sendAdminNotification - notify admin about a new LinkedIn submission
 */
export async function sendAdminNotification({
  name,
  email,
  course,
  linkedinUrl,
  submissionId,
}: {
  name: string;
  email: string;
  course: string;
  linkedinUrl: string;
  submissionId: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.error("❌ ADMIN_EMAIL is not configured");
    return;
  }

  const site = process.env.SITE_URL || "https://iimskills.com";
  const reviewUrl = `${site.replace(/\/$/, "")}/admin/linkedin-review?sid=${encodeURIComponent(submissionId)}`;

  const html = `
    <div style="font-family:Inter,Segoe UI,Arial,sans-serif;font-size:14px;color:#111;">
      <h3>New LinkedIn Verification Request</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Course:</strong> ${course}</p>
      <p><strong>LinkedIn Post:</strong> <a href="${linkedinUrl}" target="_blank" rel="noopener noreferrer">${linkedinUrl}</a></p>
      <p><strong>Submission ID:</strong> ${submissionId}</p>
      <hr/>
      <p>Open admin review: <a href="${reviewUrl}" target="_blank" rel="noopener noreferrer">${reviewUrl}</a></p>
    </div>
  `;

  await sendMail(adminEmail, "New LinkedIn Post Verification Request", html);
}

/**
 * sendUserCertificateStatus - notify user about verification result
 */
export async function sendUserCertificateStatus({
  email,
  name,
  status,
  submissionId,
  message,
}: {
  email: string;
  name: string;
  status: "Approved" | "Rejected";
  submissionId: string;
  message?: string;
}) {
  const site = process.env.SITE_URL || "https://iimskills.com";
  let subject = "";
  let html = "";

  if (status === "Approved") {
    subject = "🎉 Your LinkedIn Post is Verified";
    html =
      message ||
      `
      <div style="font-family:Inter,Segoe UI,Arial,sans-serif;font-size:14px;color:#111;">
        <p>Hi <strong>${name}</strong>,</p>
        <p>🎉 Congratulations — your LinkedIn post has been verified by our team.</p>
        <p>You now qualify for our free career booster classes:</p>
        <ul>
          <li>Resume Building</li>
          <li>Mock Interview Preparation</li>
          <li>LinkedIn Profile Building</li>
        </ul>
        <p>To access your benefits, visit: <a href="${site}" target="_blank" rel="noopener noreferrer">${site}</a></p>
        <p>Best wishes,<br/>Team IIM SKILLS</p>
      </div>
    `;
  } else {
    subject = "⚠️ LinkedIn Post Verification - Action Required";
    html =
      message ||
      `
      <div style="font-family:Inter,Segoe UI,Arial,sans-serif;font-size:14px;color:#111;">
        <p>Hi <strong>${name}</strong>,</p>
        <p>We could not verify your LinkedIn post. Please ensure:</p>
        <ul>
          <li>Your post is public</li>
          <li>The post mentions that you are learning with IIM SKILLS</li>
          <li>The post content is relevant and not private/group-only</li>
        </ul>
        <p>Once ready, you can resubmit the post URL from your course panel.</p>
        <p>Best wishes,<br/>Team IIM SKILLS</p>
      </div>
    `;
  }

  await sendMail(email, subject, html);
}
