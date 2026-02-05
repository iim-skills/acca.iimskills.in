// src/lib/progressMailSend.ts
import nodemailer from "nodemailer";

type SendMailProps = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

const host = process.env.MAIL_HOST!;
const port = Number(process.env.MAIL_PORT || 587);
const user = process.env.MAIL_USER!;
const pass = process.env.MAIL_PASS!;
const fromName = process.env.MAIL_FROM_NAME || "IIMSKILLS Team";
const fromEmail = process.env.MAIL_FROM_EMAIL || user;
const publicUrl = process.env.NEXT_PUBLIC_URL || "https://iimskills.com"; // NEVER localhost in production

export async function sendMail({ to, subject, html, text }: SendMailProps) {
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    // enables STARTTLS if server offers it
    tls: { rejectUnauthorized: false },
  });

  // Optional: if you control DKIM private key, you can sign here:
  // transporter.use('stream', nodemailerDkim.signer({
  //   domainName: 'iimskills.com',
  //   keySelector: 'default',
  //   privateKey: process.env.DKIM_PRIVATE_KEY!,
  // }));

  const textAlt =
    text ||
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\n{3,}/g, "\n\n");

  const msg = await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    html,
    text: textAlt,
    headers: {
      "List-Unsubscribe": `<${publicUrl}/unsubscribe>, <mailto:noreply@iimskills.com?subject=unsubscribe>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      "X-Entity-Type": "transactional",
      "X-Company": "IIMSKILLS",
    },
  });

  return msg;
}
