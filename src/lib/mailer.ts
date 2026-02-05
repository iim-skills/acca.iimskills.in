// lib/mailer.ts
import nodemailer from "nodemailer";

function pickEnv(...keys: string[]) {
  for (const k of keys) {
    if (process.env[k]) return process.env[k];
  }
  return undefined;
}

export async function sendOtpEmail(to: string, otp: string) {
  const host = pickEnv("MAIL_HOST", "EMAIL_HOST", "SMTP_HOST");
  const portRaw = pickEnv("MAIL_PORT", "EMAIL_PORT", "SMTP_PORT");
  const port = portRaw ? Number(portRaw) : 587;
  const user = pickEnv("MAIL_USER", "EMAIL_USER", "SMTP_USER");
  const pass = pickEnv("MAIL_PASS", "EMAIL_PASS", "SMTP_PASS");
  const from = pickEnv("MAIL_FROM", "EMAIL_FROM", "SMTP_FROM") || user || `no-reply@localhost`;

  // DEV fallback if mail not configured
  if (!user || !pass || !host) {
    console.warn("⚠️ Mail not configured — DEV MODE. OTP printed to console.");
    console.log("========= DEV OTP =========");
    console.log("TO:", to);
    console.log("OTP:", otp);
    console.log("===========================");
    return true;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false }, // helps in some VPS environments
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
  });

  // Optionally verify transporter early
  try {
    await transporter.verify();
  } catch (e) {
    console.warn("⚠️ transporter.verify failed — will still attempt send:", e);
  }

  const subject = "Your Admin Login OTP";
  const html = `
    <div style="font-family: Arial, sans-serif">
      <h2>Admin Login OTP</h2>
      <p>Your one-time password is:</p>
      <h1 style="letter-spacing:6px">${otp}</h1>
      <p>This OTP is valid for 5 minutes.</p>
    </div>
  `;

  await transporter.sendMail({
    from,
    to,
    subject,
    html,
  });

  return true;
}
