import { NextResponse } from "next/server";
import db from "../../../../lib/db";
import nodemailer from "nodemailer";

export async function POST(req: Request) {

  try {

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    console.log("Free Login:", cleanEmail);

    /* ===============================
       CHECK STUDENT
    =============================== */

    const [rows]: any = await db.query(
      `SELECT * FROM lms_students WHERE email=? LIMIT 1`,
      [cleanEmail]
    );

    let student;

    /* ===============================
       CREATE NEW FREE STUDENT
    =============================== */

    if (!rows.length) {

      const name = cleanEmail.split("@")[0];

      const [insertRes]: any = await db.query(
        `
        INSERT INTO lms_students
        (
          name,
          email,
          login_id,
          password,
          courses,
          student_type
        )
        VALUES (?,?,?,?,?,?)
        `,
        [
          name,
          cleanEmail,
          cleanEmail,
          cleanEmail,
          JSON.stringify([]),
          "free"
        ]
      );

      const [newUser]: any = await db.query(
        `SELECT * FROM lms_students WHERE id=?`,
        [insertRes.insertId]
      );

      student = newUser[0];

      console.log("New Free Student:", student.email);
    }

    /* ===============================
       EXISTING USER LOGIN
    =============================== */

    else {

      student = rows[0];

      await db.query(
        `UPDATE lms_students SET password=? WHERE id=?`,
        [cleanEmail, student.id]
      );

      console.log("Existing Free Login:", student.email);
    }

    /* ===============================
       SMTP SETUP (ADDED ONLY)
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

   
const userMail = {
  from: `"ACCA, IIM SKILLS" <${process.env.MAIL_USER}>`,
  to: cleanEmail,
  subject: "🚀 Welcome to Your Learning Journey!",
  html: `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
      <div style="background-color: #4F46E5; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Welcome to LMS</h1>
      </div>
      
      <div style="padding: 30px; color: #333333;">
        <h2 style="color: #4F46E5;">Hi ${student.name},</h2>
        <p style="font-size: 16px; line-height: 1.5;">Your account has been successfully set up! You can now access our free course materials and start learning immediately.</p>
        
        <div style="background-color: #f9fafb; border: 1px dashed #4F46E5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold; color: #374151;">Your Login Credentials:</p>
          <p style="margin: 5px 0 0; font-size: 14px;"><strong>Email/Username:</strong> ${student.email}</p>
          <p style="margin: 5px 0 0; font-size: 14px;"><strong>Password:</strong> ${cleanEmail}</p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" style="background-color: #4F46E5; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Go to Dashboard</a>
        </div>
      </div>

      <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
        <p>© ${new Date().getFullYear()} LMS Academy. All rights reserved.</p>
      </div>
    </div>
  `,
};
 
const adminMail = {
  from: `"ACCA, IIM SKILLS" <${process.env.MAIL_USER}>`,
  to: process.env.ADMIN_EMAIL,
  subject: "🔔 New Free Student Registered",
  html: `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h3 style="color: #ef4444;">New User Alert</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Name:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${student.name}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${student.email}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Timestamp:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${new Date().toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Status:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 10px; font-size: 12px;">Free User</span></td>
        </tr>
      </table>
    </div>
  `,
};

    /* ===============================
       SEND MAIL (ADDED ONLY)
    =============================== */

    try {
      const userRes = await transporter.sendMail(userMail);
      console.log("✅ USER MAIL:", userRes.messageId);

      const adminRes = await transporter.sendMail(adminMail);
      console.log("✅ ADMIN MAIL:", adminRes.messageId);
    } catch (mailError) {
      console.error("❌ MAIL ERROR:", mailError);
    }

    /* ===============================
       RESPONSE
    =============================== */

    return NextResponse.json({
      id: student.id,
      name: student.name,
      email: student.email,
      courses: [],
      role: "student",
      studentType: "free"
    });

  } catch (err) {

    console.error("Free login error:", err);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );

  }

}