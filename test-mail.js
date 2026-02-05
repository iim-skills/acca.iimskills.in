import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "iimskills.com",
  port: 587,
  secure: false,
  auth: {
    user: "info@iimskills.com",
    pass: "Vaibhav@123",
  },
  tls: {
    rejectUnauthorized: false,
  },
});

async function testEmail() {
  try {
    const info = await transporter.sendMail({
      from: '"IIM SKILLS" <info@iimskills.com>',
      to: "info@iimskills.com",
      subject: "Test Email from VPS",
      text: "This is a test email sent from VPS Node.js",
    });
    console.log("✅ Email sent successfully:", info.messageId);
  } catch (err) {
    console.error("❌ Email failed:", err.message);
  }
}

testEmail();
