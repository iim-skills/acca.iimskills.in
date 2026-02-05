require("dotenv").config({ path: ".env.local" });
const nodemailer = require("nodemailer");

async function testSMTP() {
  console.log("📡 Starting SMTP Test...\n");

  console.log("MAIL_HOST:", process.env.MAIL_HOST);
  console.log("MAIL_PORT:", process.env.MAIL_PORT);
  console.log("MAIL_USER:", process.env.MAIL_USER);
  console.log(
    "MAIL_PASS:",
    process.env.MAIL_PASS ? "***OK***" : "NOT SET"
  );

  console.log("\n--------------------------------------------------");

  const transporter = nodemailer.createTransport({
  host: "iimskills.com",
  port: 587,
  secure: false,
  auth: {
    user: "info@iimskills.com",
    pass: "VAibhav@123",
  },
  tls: { rejectUnauthorized: false }
});


  try {
    console.log("\n📨 Sending test email...");
    const info = await transporter.sendMail({
      from: `"SMTP Test" <${process.env.MAIL_USER}>`,
      to: process.env.MAIL_USER,
      subject: "SMTP TEST ✔️",
      text: "SMTP working!",
    });

    console.log("\n✅ EMAIL SENT SUCCESSFULLY!");
    console.log(info);
  } catch (err) {
    console.log("\n❌ SMTP ERROR OCCURRED!");
    console.error(err);
  }
}

testSMTP();
