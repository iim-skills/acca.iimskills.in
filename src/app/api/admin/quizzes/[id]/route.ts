import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

/* ================= DB POOL ================= */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
});

/* ================= HELPERS ================= */

function safeParse(value: any, fallback: any) {
  try {
    if (!value) return fallback;
    if (typeof value !== "string") return value;
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeQuestions(questions: any[] = []) {
  return questions.map((q: any) => {
    const isPassage = q.type === "PASSAGE" || q.type === "passage";

    return {
      ...q,
      type: isPassage ? "PASSAGE" : q.type,
      options: Array.isArray(q.options)
        ? q.options.map((opt: any) => ({
            id: String(opt.id || Math.random()),
            text: opt.text || "",
          }))
        : [],
      passageQuestions: isPassage
        ? (q.passageQuestions || q.questions || []).map((sq: any) => ({
            ...sq,
            options: Array.isArray(sq.options)
              ? sq.options.map((opt: any) => ({
                  id: String(opt.id || Math.random()),
                  text: opt.text || "",
                }))
              : [],
          }))
        : [],
    };
  });
}

function getQuestionCount(questions: any[] = []) {
  return questions.reduce((acc, q) => {
    if (q.type === "PASSAGE") {
      const sub = q.passageQuestions || q.questions || [];
      return acc + sub.length;
    }
    return acc + 1;
  }, 0);
}

async function resolveQuizId(
  req: Request,
  params?: Promise<{ id: string }> | { id: string }
) {
  const url = new URL(req.url);
  const queryId = url.searchParams.get("id");

  let routeId = "";
  if (params) {
    const resolved =
      typeof (params as any).then === "function"
        ? await (params as Promise<{ id: string }>)
        : (params as { id: string });

    routeId = resolved?.id || "";
  }

  return queryId || routeId;
}

/* ================= GET ================= */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let conn: mysql.PoolConnection | null = null;

  try {
    const id = await resolveQuizId(req, params);

    conn = await pool.getConnection();

    // SINGLE QUIZ
    if (id && !isNaN(Number(id))) {
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

      const normalizedQuestions = normalizeQuestions(parsedQuestions);

      const savedTime = Number(quiz.time_minutes || 10);

      return NextResponse.json({
        id: quiz.id,
        name: quiz.name,
        course_slug: quiz.course_slug,
        module_id: quiz.module_id,
        submodule_id: quiz.submodule_id,
        time_minutes: savedTime,
        quizTime: savedTime,
        passing_percent: quiz.passing_percent || 40,
        totalMarks: quiz.total_marks || normalizedQuestions.length,
        totalQuestions: getQuestionCount(normalizedQuestions),
        questions: normalizedQuestions,
        batch_ids: safeParse(quiz.batch_ids, []),
      });
    }

    // ALL QUIZZES
    const [rows]: any = await conn.query("SELECT * FROM quizzes");

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

      const savedTime = Number(quiz.time_minutes || 10);

      return {
        id: quiz.id,
        name: quiz.name,
        totalQuestions: getQuestionCount(parsedQuestions),
        time_minutes: savedTime,
        quizTime: savedTime,
        passing_percent: quiz.passing_percent,
      };
    });

    return NextResponse.json(allQuizzes);
  } catch (err: any) {
    console.error("❌ GET ERROR:", err);
    return NextResponse.json(
      { error: err?.message || "Fetch failed" },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}

/* ================= PUT ================= */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let conn: mysql.PoolConnection | null = null;

  try {
    const { id } = await params;
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: "Invalid quiz ID" },
        { status: 400 }
      );
    }

    const body = await req.json();

    conn = await pool.getConnection();

    const {
      name,
      course_slug,
      module_id,
      submodule_id,
      batch_ids,
      time_minutes,
      quizTime,
      passing_percent,
      questions,
    } = body;

    const cleanQuestions = Array.isArray(questions) ? questions : [];
    const total_questions = getQuestionCount(cleanQuestions);

    await conn.query(
      `UPDATE quizzes 
       SET
         name = COALESCE(?, name),
         course_slug = COALESCE(?, course_slug),
         module_id = COALESCE(?, module_id),
         submodule_id = COALESCE(?, submodule_id),
         batch_ids = COALESCE(?, batch_ids),
         time_minutes = COALESCE(?, time_minutes),
         passing_percent = COALESCE(?, passing_percent),
         total_questions = ?,
         questions = ?
       WHERE id = ?`,
      [
        name ?? null,
        course_slug ?? null,
        module_id ?? null,
        submodule_id ?? null,
        batch_ids !== undefined ? JSON.stringify(batch_ids || []) : null,
        time_minutes ?? quizTime ?? null,
        passing_percent ?? null,
        total_questions,
        JSON.stringify(cleanQuestions),
        Number(id),
      ]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("❌ PUT ERROR:", err);
    return NextResponse.json(
      { error: err?.message || "Update failed" },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}

/* ================= DELETE ================= */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let conn: mysql.PoolConnection | null = null;

  try {
    const { id } = await params;
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: "Invalid quiz ID" },
        { status: 400 }
      );
    }

    conn = await pool.getConnection();

    await conn.query("DELETE FROM quizzes WHERE id = ?", [Number(id)]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("❌ DELETE ERROR:", err);
    return NextResponse.json(
      { error: err?.message || "Delete failed" },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}