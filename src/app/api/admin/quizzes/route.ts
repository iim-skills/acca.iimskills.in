import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

/* ================= DB POOL ================= */

let pool: mysql.Pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT || 3306),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

/* ================= HELPERS ================= */

function safeJSONParse(value: any, fallback: any) {
  try {
    if (!value) return fallback;
    if (typeof value === "string") return JSON.parse(value);
    return value;
  } catch {
    return fallback;
  }
}

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

/* =====================================================
   GET QUIZZES
===================================================== */

export async function GET(req: NextRequest) {
  try {
    const pool = getPool();
    const { searchParams } = new URL(req.url);

    const courseSlug = searchParams.get("courseSlug");

    let sql = `SELECT * FROM quizzes`;
    const params: any[] = [];

    if (courseSlug) {
      sql += ` WHERE course_slug = ?`;
      params.push(courseSlug);
    }

    sql += ` ORDER BY id DESC`;

    const [rows]: any = await pool.query(sql, params);

    const formatted = rows.map((q: any) => ({
      id: q.id,

      /* ⭐ IMPORTANT FOR DROPDOWN */
      title: q.name,

      name: q.name,
      course_slug: q.course_slug,
      module_id: q.module_id,
      submodule_id: q.submodule_id,

      batch_ids: safeJSONParse(q.batch_ids, []),
      questions: safeJSONParse(q.questions, []),

      time_minutes: q.time_minutes,
      passing_percent: q.passing_percent,
      created_by: q.created_by,

      createdAt: q.createdAt,
      updatedAt: q.updatedAt,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("GET QUIZZES ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch quizzes" },
      { status: 500 }
    );
  }
}

/* =====================================================
   CREATE QUIZ
===================================================== */

export async function POST(req: Request) {
  try {
    const pool = getPool();
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
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const normalizedQuestions = normalizeQuestions(questions);

    const [result]: any = await pool.query(
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

    return NextResponse.json({
      success: true,
      id: result.insertId,
    });
  } catch (error) {
    console.error("CREATE QUIZ ERROR:", error);
    return NextResponse.json(
      { error: "Failed to create quiz" },
      { status: 500 }
    );
  }
}

/* =====================================================
   UPDATE QUIZ
===================================================== */

export async function PUT(req: Request) {
  try {
    const pool = getPool();
    const body = await req.json();

    const { id, name, questions } = body;

    if (!id) {
      return NextResponse.json({ error: "Quiz ID required" }, { status: 400 });
    }

    const normalizedQuestions = questions
      ? normalizeQuestions(questions)
      : undefined;

    await pool.query(
      `
      UPDATE quizzes
      SET name = ?, questions = ?
      WHERE id = ?
      `,
      [name, JSON.stringify(normalizedQuestions || []), id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("UPDATE QUIZ ERROR:", error);
    return NextResponse.json(
      { error: "Failed to update quiz" },
      { status: 500 }
    );
  }
}

/* =====================================================
   DELETE QUIZ
===================================================== */

export async function DELETE(req: Request) {
  try {
    const pool = getPool();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Quiz ID required" },
        { status: 400 }
      );
    }

    await pool.query(`DELETE FROM quizzes WHERE id = ?`, [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE QUIZ ERROR:", error);
    return NextResponse.json(
      { error: "Failed to delete quiz" },
      { status: 500 }
    );
  }
}