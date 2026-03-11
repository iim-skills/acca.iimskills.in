import { NextResponse } from "next/server";
import db from "../../../../../lib/db";
import nodemailer from "nodemailer";
import { google } from "googleapis";

/* =========================
   GOOGLE SHEETS INIT
========================= */

let sheets: any = null;

try {
  const base64Key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (base64Key) {
    const serviceAccount = JSON.parse(
      Buffer.from(base64Key, "base64").toString("utf8")
    );

    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    sheets = google.sheets({ version: "v4", auth });
    console.log("Sheets -> initialized");
  } else {
    console.error("Sheets -> GOOGLE_SERVICE_ACCOUNT_KEY missing");
  }
} catch (err) {
  console.error("Sheets -> initialization failed", err);
}

/* =========================
   QUIZ SUBMIT API
========================= */

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log(">>> Quiz submit payload:", JSON.stringify(body));

    const { email, quizId, answers } = body;

    /* =========================
       VALIDATION
    ========================= */

    if (!email || !quizId || !answers || !Array.isArray(answers)) {
      console.error("Validation failed - invalid request data", { email, quizId, answersType: Array.isArray(answers) ? "array" : typeof answers });
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    const total = answers.length;
    if (total === 0) {
      console.error("Validation failed - empty answers array");
      return NextResponse.json({ error: "No answers submitted" }, { status: 400 });
    }

    /* =========================
       FETCH STUDENT
    ========================= */

    console.log("DB -> fetching student for:", email);
    const [studentRows]: any = await db.query(`SELECT name FROM lms_students WHERE email=? LIMIT 1`, [email]);

    if (!studentRows?.length) {
      console.error("Student not found for email:", email);
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const studentName = studentRows[0].name;
    console.log("Student found:", studentName);

    /* =========================
       FETCH QUIZ (exists)
    ========================= */

    console.log("DB -> fetching quiz:", quizId);
    const [quizRows]: any = await db.query(`SELECT id FROM quizzes WHERE id=?`, [quizId]);
    if (!quizRows?.length) {
      console.error("Quiz not found id:", quizId);
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    /* =========================
       CALCULATE SCORE & RESULT
    ========================= */

    let correct = 0;
    try {
      answers.forEach((item: any) => {
        if (item && item.correct === true) correct++;
      });
    } catch (err) {
      console.error("Error while iterating answers:", err);
      return NextResponse.json({ error: "Invalid answers format" }, { status: 400 });
    }

    const attempted = total;
    const percent = (correct / total) * 100;

    const PASS_PERCENT = 75;
    const result = percent >= PASS_PERCENT ? "PASS" : "FAIL";

    console.log("Calculated result:", { correct, total, attempted, percent: Number(percent.toFixed(2)), result });

    /* =========================
       MYSQL DATE FORMAT
    ========================= */

    const now = new Date();
    const mysqlDate =
      now.getFullYear() + "-" +
      String(now.getMonth() + 1).padStart(2, "0") + "-" +
      String(now.getDate()).padStart(2, "0") + " " +
      String(now.getHours()).padStart(2, "0") + ":" +
      String(now.getMinutes()).padStart(2, "0") + ":" +
      String(now.getSeconds()).padStart(2, "0");

    /* =========================
       CHECK EXISTING SUBMISSION
    ========================= */

    console.log("DB -> checking existing submission for quiz and student");
    const [existingRows]: any = await db.query(
      `SELECT id FROM quiz_submissions WHERE quiz_id=? AND student_email=? LIMIT 1`,
      [quizId, email]
    );

    if (existingRows?.length) {
      // update existing row (overwrite fields)
      const existingId = existingRows[0].id;
      console.log("DB -> updating existing submission id:", existingId);

      await db.query(
        `UPDATE quiz_submissions
         SET score = ?, total_questions = ?, attempted_questions = ?, percent = ?, result = ?, answers = ?, submitted_at = ?
         WHERE id = ?`,
        [
          correct,
          total,
          attempted,
          percent,
          result,
          JSON.stringify(answers),
          mysqlDate,
          existingId
        ]
      );

      console.log("DB -> update success for id:", existingId);

      // proceed to emailing + sheets logging below using current values
    } else {
      // insert new row
      console.log("DB -> inserting new submission");
      await db.query(
        `INSERT INTO quiz_submissions
         (quiz_id, student_name, student_email, score, total_questions, attempted_questions, percent, result, answers, submitted_at)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [
          quizId,
          studentName,
          email,
          correct,
          total,
          attempted,
          percent,
          result,
          JSON.stringify(answers),
          mysqlDate
        ]
      );
      console.log("DB -> insert success");
    }

    /* =========================
       SEND EMAILS (non-blocking failure tolerant)
    ========================= */

    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT),
      secure: false,
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
    });

    const adminText = `
Student: ${studentName}
Email: ${email}

Quiz ID: ${quizId}

Score: ${correct}/${total}
Percent: ${percent.toFixed(2)}%
Result: ${result}
Submitted At: ${mysqlDate}
`;

    try {
      console.log("Email -> sending admin email to", process.env.ADMIN_EMAIL);
      const infoAdmin = await transporter.sendMail({
        from: `"LMS Quiz" <${process.env.MAIL_USER}>`,
        to: process.env.ADMIN_EMAIL,
        subject: "New/Updated Quiz Submission",
        text: adminText
      });
      console.log("Email -> admin send result:", { messageId: infoAdmin?.messageId, accepted: infoAdmin?.accepted });
    } catch (mailErr) {
      console.error("Email -> admin send failed:", mailErr);
    }

    try {
      console.log("Email -> sending student email to", email);
      const infoStudent = await transporter.sendMail({
        from: `"LMS Quiz" <${process.env.MAIL_USER}>`,
        to: email,
        subject: "Quiz Result",
        text: `
Hi ${studentName},

Your quiz has been recorded.

Score: ${correct}/${total}
Percentage: ${percent.toFixed(2)}%
Result: ${result}

Submitted At: ${mysqlDate}

Thank you.
`
      });
      console.log("Email -> student send result:", { messageId: infoStudent?.messageId, accepted: infoStudent?.accepted });
    } catch (mailErr2) {
      console.error("Email -> student send failed:", mailErr2);
    }

    /* =========================
       GOOGLE SHEETS APPEND (history of attempts)
    ========================= */

    if (sheets) {
      try {
        const sheetValues = [[
          mysqlDate,
          quizId,
          studentName,
          email,
          correct,
          total,
          attempted,
          Number(percent.toFixed(2)),
          result,
          JSON.stringify(answers)
        ]];

        console.log("Sheets -> appending values:", sheetValues);

        const appendRes = await sheets.spreadsheets.values.append({
          spreadsheetId: process.env.GOOGLE_SHEET_ID!,
          range: process.env.GOOGLE_SHEET_RANGE || "Sheet1!A:Z",
          valueInputOption: "RAW",
          requestBody: { values: sheetValues }
        });

        console.log("Sheets -> append response:", appendRes?.data ?? appendRes);
      } catch (sheetErr: any) {
        console.error("Sheets -> append error:", {
          message: sheetErr?.message,
          response: sheetErr?.response?.data ?? sheetErr?.errors ?? null,
          stack: sheetErr?.stack
        });
      }
    }

    /* =========================
       FINAL RESPONSE
    ========================= */

    return NextResponse.json({
      success: true,
      score: correct,
      total,
      attempted,
      percent: Number(percent.toFixed(2)),
      result
    });
  } catch (error) {
    console.error("Quiz Submit Error - top level:", {
      message: (error as any)?.message ?? String(error),
      stack: (error as any)?.stack ?? null,
      raw: error
    });

    return NextResponse.json({ error: "Server error", details: String(error) }, { status: 500 });
  }
}