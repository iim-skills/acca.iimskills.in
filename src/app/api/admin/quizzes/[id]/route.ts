import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

/* ================= DB ================= */

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
});

/* ================= HELPERS ================= */

function safeParse(value: any, fallback: any) {
  try {
    if (!value) return fallback;
    if (typeof value === "string") return JSON.parse(value);
    return value;
  } catch {
    return fallback;
  }
}

// ✅ IMPORTANT (correct count including passage)
function getQuestionCount(questions: any[] = []) {
  return questions.reduce((acc, q) => {
    if (q.type === "PASSAGE") {
      return acc + (q.passageQuestions?.length || 0);
    }
    return acc + 1;
  }, 0);
}

/* ================= GET ================= */

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Quiz ID required" }, { status: 400 });
  }

  const conn = await pool.getConnection();

  try {
    const [rows]: any = await conn.query(
      "SELECT * FROM quizzes WHERE id = ?",
      [id]
    );

    if (!rows.length) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const quiz = rows[0];

    // ✅ SAFE PARSE (VERY IMPORTANT)
    quiz.questions = safeParse(quiz.questions, []);
    quiz.batch_ids = safeParse(quiz.batch_ids, []);

    return NextResponse.json(quiz);
  } catch (err) {
    console.error("GET ERROR:", err);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  } finally {
    conn.release();
  }
}

/* ================= PUT ================= */

export async function PUT(req: Request) {
  const body = await req.json();
  const conn = await pool.getConnection();

  try {
    const {
      id,
      name,
      course_slug,
      module_id,
      submodule_id,
      batch_ids,
      time_minutes,
      passing_percent,
      questions,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Quiz ID required" }, { status: 400 });
    }

    // ✅ FIX COUNT (PASSAGE SUPPORT)
    const total_questions = getQuestionCount(questions);

    // ✅ ENSURE CLEAN JSON
    const cleanQuestions = Array.isArray(questions) ? questions : [];

    await conn.query(
      `UPDATE quizzes 
       SET 
         name = ?, 
         course_slug = ?, 
         module_id = ?, 
         submodule_id = ?, 
         batch_ids = ?, 
         time_minutes = ?, 
         passing_percent = ?, 
         total_questions = ?, 
         questions = ?
       WHERE id = ?`,
      [
        name,
        course_slug,
        module_id,
        submodule_id || null,
        JSON.stringify(batch_ids || []),
        time_minutes,
        passing_percent,
        total_questions,
        JSON.stringify(cleanQuestions),
        id,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PUT ERROR:", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  } finally {
    conn.release();
  }
}

/* ================= DELETE ================= */

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Quiz ID required" }, { status: 400 });
  }

  const conn = await pool.getConnection();

  try {
    await conn.query("DELETE FROM quizzes WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  } finally {
    conn.release();
  }
}