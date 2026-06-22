import { NextResponse } from "next/server";
import { google } from "googleapis";
import db from "../../../../../lib/db";
import { sendMail } from "../../../../../lib/email";

export const runtime = "nodejs";

type FlatQuestion = {
  id: string;
  type?: string;
  text?: string;
  answer?: string;
  correctAnswer?: string;
  correctOption?: string;
  correctOptionId?: string;
  options?: Array<{ id?: string; text?: string }>;
};

type SheetSyncResult =
  | { success: true; mode: "updated" | "appended"; rowNumber?: number }
  | { success: false; skipped?: boolean; reason?: string; error?: string };

let cachedSheetsClient: any | null = null;
let sheetsInitAttempted = false;

function safeJsonParse(value: any, fallback: any) {
  try {
    if (value == null || value === "") return fallback;
    if (typeof value === "string") return JSON.parse(value);
    return value;
  } catch {
    return fallback;
  }
}

function normalizeString(value: any) {
  return String(value ?? "").trim().toLowerCase();
}

function escapeHtml(value: any) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function flattenQuizQuestions(questions: any[] = []): FlatQuestion[] {
  const flat: FlatQuestion[] = [];

  questions.forEach((question: any, index: number) => {
    const isPassage =
      String(question?.type ?? "").toUpperCase() === "PASSAGE";
    const nestedQuestions = Array.isArray(question?.passageQuestions)
      ? question.passageQuestions
      : Array.isArray(question?.questions)
      ? question.questions
      : [];

    if (isPassage && nestedQuestions.length > 0) {
      nestedQuestions.forEach((subQuestion: any, subIndex: number) => {
        flat.push({
          ...subQuestion,
          id:
            String(
              subQuestion?.id ??
                `${question?.id ?? `passage-${index}`}-${subIndex}`
            ) || `passage-${index}-${subIndex}`,
        });
      });
      return;
    }

    flat.push({
      ...question,
      id: String(question?.id ?? `q-${index}`) || `q-${index}`,
    });
  });

  return flat;
}

function normalizeSubmittedAnswers(input: any) {
  if (Array.isArray(input)) {
    return input.reduce<Record<string, string>>((acc, item: any, index) => {
      const questionId = String(
        item?.questionId ?? item?.id ?? item?.qid ?? `q-${index}`
      ).trim();
      const answerValue =
        item?.answer ??
        item?.selectedOptionId ??
        item?.selected ??
        item?.value ??
        item?.userAnswer ??
        "";

      if (questionId && answerValue !== "") {
        acc[questionId] = String(answerValue);
      }

      return acc;
    }, {});
  }

  if (input && typeof input === "object") {
    return Object.entries(input).reduce<Record<string, string>>(
      (acc, [key, value]) => {
        if (value === undefined || value === null || value === "") {
          return acc;
        }

        acc[String(key)] = String(value);
        return acc;
      },
      {}
    );
  }

  return {};
}

function getCorrectAnswerValue(question: FlatQuestion) {
  return (
    question?.correctOptionId ??
    question?.correctOption ??
    question?.correctAnswer ??
    question?.answer ??
    ""
  );
}

function isAnswerCorrect(question: FlatQuestion, submittedAnswer: any) {
  const submitted = normalizeString(submittedAnswer);
  if (!submitted) return false;

  const correctValue = getCorrectAnswerValue(question);
  const correct = normalizeString(correctValue);

  if (correct && submitted === correct) {
    return true;
  }

  const options = Array.isArray(question?.options) ? question.options : [];
  const submittedOption = options.find(
    (option) =>
      normalizeString(option?.id) === submitted ||
      normalizeString(option?.text) === submitted
  );
  const correctOption = options.find(
    (option) =>
      normalizeString(option?.id) === correct ||
      normalizeString(option?.text) === correct
  );

  if (submittedOption && correctOption) {
    return (
      normalizeString(submittedOption.id) === normalizeString(correctOption.id) ||
      normalizeString(submittedOption.text) ===
        normalizeString(correctOption.text)
    );
  }

  if (submittedOption && correct) {
    return normalizeString(submittedOption.text) === correct;
  }

  if (correctOption) {
    return normalizeString(correctOption.text) === submitted;
  }

  return false;
}

function resolveSubmittedAnswerLabel(
  question: FlatQuestion,
  submittedAnswer: any
) {
  const rawValue = String(submittedAnswer ?? "").trim();
  if (!rawValue) {
    return "Not answered";
  }

  const normalizedRaw = normalizeString(rawValue);
  const options = Array.isArray(question?.options) ? question.options : [];

  const matchedOption = options.find(
    (option) =>
      normalizeString(option?.id) === normalizedRaw ||
      normalizeString(option?.text) === normalizedRaw
  );

  if (matchedOption?.text) {
    return String(matchedOption.text).trim();
  }

  return rawValue;
}

function formatAnswersForSheet(
  questions: FlatQuestion[],
  submittedAnswers: Record<string, string>
) {
  if (!questions.length) {
    return JSON.stringify(submittedAnswers);
  }

  return questions
    .map((question, index) => {
      const answerLabel = resolveSubmittedAnswerLabel(
        question,
        submittedAnswers[question.id]
      );
      return `Q${index + 1} - ${answerLabel}`;
    })
    .join("\n");
}

function getMysqlTimestamp(date = new Date()) {
  return (
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0") +
    " " +
    String(date.getHours()).padStart(2, "0") +
    ":" +
    String(date.getMinutes()).padStart(2, "0") +
    ":" +
    String(date.getSeconds()).padStart(2, "0")
  );
}

function parseServiceAccountCredentials() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.trim();
  if (!raw) {
    return null;
  }

  const candidates = [raw];

  try {
    const decoded = Buffer.from(raw, "base64").toString("utf8").trim();
    if (decoded && decoded !== raw) {
      candidates.push(decoded);
    }
  } catch {
    // Ignore invalid base64 and try the raw value.
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);

      if (parsed?.private_key) {
        parsed.private_key = String(parsed.private_key).replace(/\\n/g, "\n");
      }

      if (parsed?.client_email && parsed?.private_key) {
        return parsed;
      }
    } catch {
      // Try the next candidate.
    }
  }

  return null;
}

function getSheetsClient() {
  if (sheetsInitAttempted) {
    return cachedSheetsClient;
  }

  sheetsInitAttempted = true;

  const credentials = parseServiceAccountCredentials();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID?.trim();

  if (!credentials) {
    console.warn(
      "Quiz submit -> Google Sheets disabled: GOOGLE_SERVICE_ACCOUNT_KEY invalid or missing"
    );
    return null;
  }

  if (!spreadsheetId) {
    console.warn(
      "Quiz submit -> Google Sheets disabled: GOOGLE_SHEET_ID missing"
    );
    return null;
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    cachedSheetsClient = google.sheets({ version: "v4", auth });
    return cachedSheetsClient;
  } catch (error) {
    console.error("Quiz submit -> Google Sheets init failed:", error);
    cachedSheetsClient = null;
    return null;
  }
}

function getSheetRange() {
  return process.env.GOOGLE_SHEET_RANGE?.trim() || "Sheet1!A:J";
}

function getSheetName(range: string) {
  return range.includes("!") ? range.split("!")[0] : range;
}

async function syncSubmissionToSheet(payload: {
  submittedAt: string;
  quizId: string;
  studentName: string;
  studentEmail: string;
  score: number;
  total: number;
  attempted: number;
  percent: number;
  result: string;
  answersForSheet: string;
}): Promise<SheetSyncResult> {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID?.trim();

  if (!sheets || !spreadsheetId) {
    return {
      success: false,
      skipped: true,
      reason: "Google Sheets is not configured",
    };
  }

  const range = getSheetRange();
  const sheetName = getSheetName(range);
  const rowValues = [[
    payload.submittedAt,
    payload.quizId,
    payload.studentName,
    payload.studentEmail,
    payload.score,
    payload.total,
    payload.attempted,
    Number(payload.percent.toFixed(2)),
    payload.result,
    payload.answersForSheet,
  ]];

  try {
    const existingResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows: any[] = Array.isArray(existingResponse?.data?.values)
      ? existingResponse.data.values
      : [];

    const targetIndex = rows.findIndex((row) => {
      const rowQuizId = String(row?.[1] ?? "").trim();
      const rowEmail = String(row?.[3] ?? "").trim().toLowerCase();

      return (
        rowQuizId === String(payload.quizId).trim() &&
        rowEmail === String(payload.studentEmail).trim().toLowerCase()
      );
    });

    if (targetIndex >= 0) {
      const rowNumber = targetIndex + 1;
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A${rowNumber}:J${rowNumber}`,
        valueInputOption: "RAW",
        requestBody: { values: rowValues },
      });

      return { success: true, mode: "updated", rowNumber };
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: rowValues },
    });

    return { success: true, mode: "appended" };
  } catch (error: any) {
    console.error("Quiz submit -> Google Sheets sync failed:", {
      message: error?.message,
      response: error?.response?.data ?? error?.errors ?? null,
    });

    return {
      success: false,
      error: error?.message || "Google Sheets sync failed",
    };
  }
}

async function sendQuizEmails(payload: {
  adminEmail?: string;
  studentEmail: string;
  studentName: string;
  quizId: string;
  quizName: string;
  score: number;
  total: number;
  attempted: number;
  percent: number;
  result: string;
  submittedAt: string;
}) {
  const adminResults = {
    sent: false,
    reason: "",
  };
  const userResults = {
    sent: false,
    reason: "",
  };

  const summaryHtml = `
    <div style="font-family:Arial,sans-serif;font-size:14px;color:#111827;">
      <p><strong>Student:</strong> ${escapeHtml(payload.studentName)}</p>
      <p><strong>Email:</strong> ${escapeHtml(payload.studentEmail)}</p>
      <p><strong>Quiz:</strong> ${escapeHtml(payload.quizName)} (#${escapeHtml(
    payload.quizId
  )})</p>
      <p><strong>Score:</strong> ${payload.score}/${payload.total}</p>
      <p><strong>Attempted:</strong> ${payload.attempted}</p>
      <p><strong>Percent:</strong> ${payload.percent.toFixed(2)}%</p>
      <p><strong>Result:</strong> ${escapeHtml(payload.result)}</p>
      <p><strong>Submitted At:</strong> ${escapeHtml(payload.submittedAt)}</p>
    </div>
  `;

  if (payload.adminEmail) {
    try {
      await sendMail(
        payload.adminEmail,
        `Quiz Submission: ${payload.quizName}`,
        `
          <div style="font-family:Arial,sans-serif;font-size:14px;color:#111827;">
            <h2 style="margin:0 0 12px;">New or Updated Quiz Submission</h2>
            ${summaryHtml}
          </div>
        `
      );
      adminResults.sent = true;
    } catch (error: any) {
      adminResults.reason = error?.message || "Admin email failed";
      console.error("Quiz submit -> admin email failed:", error);
    }
  } else {
    adminResults.reason = "ADMIN_EMAIL missing";
  }

  try {
    await sendMail(
      payload.studentEmail,
      `Quiz Result: ${payload.quizName}`,
      `
        <div style="font-family:Arial,sans-serif;font-size:14px;color:#111827;">
          <p>Hi <strong>${escapeHtml(payload.studentName)}</strong>,</p>
          <p>Your quiz submission has been recorded successfully.</p>
          ${summaryHtml}
          <p>Keep going. You're making solid progress.</p>
        </div>
      `
    );
    userResults.sent = true;
  } catch (error: any) {
    userResults.reason = error?.message || "Student email failed";
    console.error("Quiz submit -> student email failed:", error);
  }

  return { admin: adminResults, student: userResults };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const quizId = String(body?.quizId ?? "").trim();
    const rawAnswers = body?.answers;

    if (!email || !quizId || rawAnswers == null) {
      return NextResponse.json(
        { error: "Email, quizId and answers are required" },
        { status: 400 }
      );
    }

    const normalizedAnswers = normalizeSubmittedAnswers(rawAnswers);
    const submittedAnswerCount = Object.keys(normalizedAnswers).length;

    if (submittedAnswerCount === 0 && !Array.isArray(rawAnswers)) {
      return NextResponse.json(
        { error: "No answers submitted" },
        { status: 400 }
      );
    }

    const [studentRows]: any = await db.query(
      "SELECT name FROM lms_students WHERE email = ? LIMIT 1",
      [email]
    );

    const studentName =
      String(studentRows?.[0]?.name ?? body?.name ?? email.split("@")[0] ?? "")
        .trim() || "Student";

    const [quizRows]: any = await db.query(
      "SELECT id, name, questions, passing_percent FROM quizzes WHERE id = ? LIMIT 1",
      [quizId]
    );

    if (!quizRows?.length) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const quizRow = quizRows[0];
    const quizName =
      String(quizRow?.name ?? body?.quizName ?? `Quiz ${quizId}`).trim() ||
      `Quiz ${quizId}`;
    const passingPercent = Number(quizRow?.passing_percent ?? 75) || 75;
    const parsedQuestions = safeJsonParse(quizRow?.questions, []);
    const flatQuestions = flattenQuizQuestions(
      Array.isArray(parsedQuestions) ? parsedQuestions : []
    );

    let total = flatQuestions.length;
    let correct = 0;

    if (flatQuestions.length > 0) {
      correct = flatQuestions.reduce((count, question) => {
        return count + (isAnswerCorrect(question, normalizedAnswers[question.id]) ? 1 : 0);
      }, 0);
    } else if (Array.isArray(rawAnswers)) {
      total = rawAnswers.length;
      correct = rawAnswers.reduce(
        (count: number, item: any) => count + (item?.correct === true ? 1 : 0),
        0
      );
    } else {
      total = submittedAnswerCount;
    }

    if (total === 0) {
      return NextResponse.json(
        { error: "Quiz has no scorable questions" },
        { status: 400 }
      );
    }

    const attempted =
      flatQuestions.length > 0
        ? flatQuestions.reduce((count, question) => {
            return count + (normalizedAnswers[question.id] ? 1 : 0);
          }, 0)
        : submittedAnswerCount;
    const percent = (correct / total) * 100;
    const passed = percent >= passingPercent;
    const result = passed ? "PASS" : "FAIL";
    const submittedAt = getMysqlTimestamp();

    const answersToStore =
      rawAnswers && typeof rawAnswers === "object"
        ? rawAnswers
        : normalizedAnswers;
    const answersForSheet = formatAnswersForSheet(
      flatQuestions,
      normalizedAnswers
    );

    const [existingRows]: any = await db.query(
      "SELECT id FROM quiz_submissions WHERE quiz_id = ? AND student_email = ? LIMIT 1",
      [quizId, email]
    );

    if (existingRows?.length) {
      await db.query(
        `UPDATE quiz_submissions
         SET student_name = ?, score = ?, total_questions = ?, attempted_questions = ?, percent = ?, result = ?, answers = ?, submitted_at = ?
         WHERE id = ?`,
        [
          studentName,
          correct,
          total,
          attempted,
          percent,
          result,
          JSON.stringify(answersToStore),
          submittedAt,
          existingRows[0].id,
        ]
      );
    } else {
      await db.query(
        `INSERT INTO quiz_submissions
         (quiz_id, student_name, student_email, score, total_questions, attempted_questions, percent, result, answers, submitted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          quizId,
          studentName,
          email,
          correct,
          total,
          attempted,
          percent,
          result,
          JSON.stringify(answersToStore),
          submittedAt,
        ]
      );
    }

    const [sheetSync, emailSync] = await Promise.all([
      syncSubmissionToSheet({
        submittedAt,
        quizId,
        studentName,
        studentEmail: email,
        score: correct,
        total,
        attempted,
        percent,
        result,
        answersForSheet,
      }),
      sendQuizEmails({
        adminEmail: process.env.ADMIN_EMAIL?.trim(),
        studentEmail: email,
        studentName,
        quizId,
        quizName,
        score: correct,
        total,
        attempted,
        percent,
        result,
        submittedAt,
      }),
    ]);

    return NextResponse.json({
      success: true,
      quizId,
      quizName,
      score: correct,
      total,
      attempted,
      percent: Number(percent.toFixed(2)),
      passingPercent,
      result,
      passed,
      submittedAt,
      sheetSync,
      emailSync,
    });
  } catch (error: any) {
    console.error("Quiz submit -> top-level failure:", {
      message: error?.message,
      stack: error?.stack,
    });

    return NextResponse.json(
      {
        error: "Server error",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
