import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

/* ================= DB POOL ================= */
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "127.0.0.1",
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "test",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/* ================= HELPERS ================= */

// ✅ Safe JSON parse
function safeParse(value: any, fallback: any) {
  try {
    if (!value) return fallback;
    if (typeof value !== "string") return value;
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

// ✅ Normalize questions (MCQ + PASSAGE)
function normalizeQuestions(questions: any[] = []) {
  return questions.map((q: any) => {
    const isPassage =
      q.type === "PASSAGE" || q.type === "passage";

    return {
      ...q,
      type: isPassage ? "PASSAGE" : q.type,

      options: Array.isArray(q.options)
        ? q.options.map((opt: any) => ({
            id: String(opt.id || Math.random()),
            text: opt.text || "",
          }))
        : [],

      // ✅ PASSAGE SUPPORT
      passageQuestions: isPassage
        ? (q.passageQuestions || q.questions || []).map(
            (sq: any) => ({
              ...sq,
              options: Array.isArray(sq.options)
                ? sq.options.map((opt: any) => ({
                    id: String(opt.id || Math.random()),
                    text: opt.text || "",
                  }))
                : [],
            })
          )
        : [],
    };
  });
}

// ✅ Count only real questions (ignore passage wrapper)
function getQuestionCount(questions: any[] = []) {
  return questions.reduce((acc, q) => {
    if (q.type === "PASSAGE") {
      const sub =
        q.passageQuestions ||
        q.questions ||
        [];
      return acc + sub.length;
    }
    return acc + 1;
  }, 0);
}

/* ================= GET ================= */
export async function GET(req: Request) {
  const url = new URL(req.url);

  // ✅ FIXED ID EXTRACTION (works with /12 and ?id=12)
  const pathParts = url.pathname.split("/").filter(Boolean);
  const id =
    url.searchParams.get("id") ||
    pathParts[pathParts.length - 1];

  const conn = await pool.getConnection();

  try {
    // 🔹 SINGLE QUIZ
    if (id && !isNaN(Number(id))) {
      console.log("📡 Fetch quiz ID:", id);

      const [rows]: any = await conn.query(
        "SELECT * FROM quizzes WHERE id = ?",
        [Number(id)]
      );

      if (!rows.length) {
        return NextResponse.json(
          { error: "Quiz not found" },
          { status: 404 }
        );
      }

      const quiz = rows[0];

      let parsedQuestions = safeParse(quiz.questions, []);

      // 🔥 HANDLE DOUBLE STRING JSON
      if (typeof parsedQuestions === "string") {
        try {
          parsedQuestions = JSON.parse(parsedQuestions);
        } catch {
          parsedQuestions = [];
        }
      }

      if (!Array.isArray(parsedQuestions)) {
        parsedQuestions = [];
      }

      const normalizedQuestions =
        normalizeQuestions(parsedQuestions);

      const finalQuiz = {
        id: quiz.id,
        name: quiz.name,
        time_minutes: quiz.time_minutes || 10,
        passing_percent: quiz.passing_percent || 40,
        totalMarks:
          quiz.total_marks || normalizedQuestions.length,
        totalQuestions:
          getQuestionCount(normalizedQuestions),
        questions: normalizedQuestions,
        batch_ids: safeParse(quiz.batch_ids, []),
      };

      console.log("✅ Quiz Loaded:", finalQuiz.id);

      return NextResponse.json(finalQuiz);
    }

    // 🔹 ALL QUIZZES
    const [rows]: any = await conn.query(
      "SELECT * FROM quizzes"
    );

    const allQuizzes = rows.map((quiz: any) => {
      let parsedQuestions = safeParse(quiz.questions, []);

      if (typeof parsedQuestions === "string") {
        try {
          parsedQuestions = JSON.parse(parsedQuestions);
        } catch {
          parsedQuestions = [];
        }
      }

      if (!Array.isArray(parsedQuestions)) {
        parsedQuestions = [];
      }

      return {
        id: quiz.id,
        name: quiz.name,
        totalQuestions: getQuestionCount(parsedQuestions),
        time_minutes: quiz.time_minutes,
        passing_percent: quiz.passing_percent,
      };
    });

    return NextResponse.json(allQuizzes);
  } catch (err) {
    console.error("❌ GET ERROR:", err);
    return NextResponse.json(
      { error: "Fetch failed" },
      { status: 500 }
    );
  } finally {
    conn.release();
  }
}

/* ================= PUT ================= */
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const body = await req.json();
  const conn = await pool.getConnection();

  try {
    const {
      name,
      questions,
      time_minutes,
      passing_percent,
    } = body;

    const cleanQuestions = Array.isArray(questions)
      ? questions
      : [];

    const total_questions =
      getQuestionCount(cleanQuestions);

    await conn.query(
      `UPDATE quizzes 
       SET 
         name = ?, 
         questions = ?, 
         time_minutes = ?, 
         passing_percent = ?, 
         total_questions = ?
       WHERE id = ?`,
      [
        name,
        JSON.stringify(cleanQuestions),
        time_minutes || 10,
        passing_percent || 40,
        total_questions,
        Number(id),
      ]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("❌ PUT ERROR:", err.message);
    return NextResponse.json(
      { error: "Update failed" },
      { status: 500 }
    );
  } finally {
    conn.release();
  }
}

/* ================= DELETE ================= */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const conn = await pool.getConnection();

  try {
    await conn.query(
      "DELETE FROM quizzes WHERE id = ?",
      [Number(id)]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("❌ DELETE ERROR:", err.message);
    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 }
    );
  } finally {
    conn.release();
  }
}