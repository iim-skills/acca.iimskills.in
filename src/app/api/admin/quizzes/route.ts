import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

/* ================= DB POOL ================= */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
});

/* ================= HELPERS ================= */

function normalizeQuestions(questions: any[]) {
  return questions.map((q, index) => {
    const questionId = q.id || `q-${Date.now()}-${index}`;

    const options = (q.options || []).map((opt: any, i: number) => {
      if (typeof opt === "string") {
        return {
          id: `${questionId}-opt-${i}`,
          text: opt,
        };
      }
      return {
        id: opt.id || `${questionId}-opt-${i}`,
        text: opt.text,
      };
    });

    let correctOption = undefined;

    if (typeof q.correctIndex === "number") {
      correctOption = options[q.correctIndex]?.id;
    }

    if (q.correctOption) {
      correctOption = q.correctOption;
    }

    return {
      id: questionId,
      text: q.text,
      type: q.type || "mcq",
      options,
      correctOption,
    };
  });
}

/* ================= GET QUIZZES ================= */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseSlug = searchParams.get("courseSlug");

    let sql = `SELECT * FROM quizzes`;
    let params: any[] = [];

    if (courseSlug) {
      sql += ` WHERE course_slug = ?`;
      params.push(courseSlug);
    }

    sql += ` ORDER BY id DESC`;

    const [rows]: any = await pool.query(sql, params);

    const formatted = rows.map((q: any) => ({
      ...q,
      batch_ids: q.batch_ids ? JSON.parse(q.batch_ids) : [],
      questions: q.questions ? JSON.parse(q.questions) : [],
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("GET QUIZZES ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch quizzes" }, { status: 500 });
  }
}

/* ================= CREATE QUIZ ================= */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      name,
      course_slug,
      module_id,
      submodule_id,
      batch_ids,
      time_minutes,
      passing_percent,
      questions,
      created_by,
    } = body;

    if (!name || !course_slug || !module_id || !questions?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const normalizedQuestions = normalizeQuestions(questions);

    await pool.query(
      `
      INSERT INTO quizzes
      (name, course_slug, module_id, submodule_id, batch_ids, time_minutes, passing_percent, questions, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        name,
        course_slug,
        module_id,
        submodule_id || null,
        JSON.stringify(batch_ids || []),
        time_minutes || 10,
        passing_percent || 50,
        JSON.stringify(normalizedQuestions),
        created_by || "admin",
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CREATE QUIZ ERROR:", error);
    return NextResponse.json({ error: "Failed to create quiz" }, { status: 500 });
  }
}

/* ================= DELETE QUIZ ================= */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Quiz ID required" }, { status: 400 });
    }

    await pool.query(`DELETE FROM quizzes WHERE id = ?`, [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE QUIZ ERROR:", error);
    return NextResponse.json({ error: "Failed to delete quiz" }, { status: 500 });
  }
}