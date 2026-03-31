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

      connectTimeout: 10000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
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

/* ================= FIXED NORMALIZER ================= */

function normalizeQuestions(questions: any[]) {
  return questions.map((q, index) => {
    const questionId = q.id || `q-${Date.now()}-${index}`;

    // ✅ MCQ OPTIONS
    const options = (q.options || []).map((opt: any, i: number) => ({
      id: opt.id || `${questionId}-opt-${i}`,
      text: opt.text || opt,
    }));

    // ✅ PASSAGE SUB QUESTIONS
    const passageQuestions = (q.passageQuestions || []).map((sq: any, i: number) => {
      const subId = sq.id || `${questionId}-sub-${i}`;

      return {
        id: subId,
        text: sq.text,
        type: sq.type || "MCQ",
        marks: sq.marks || 1,
        options: (sq.options || []).map((opt: any, j: number) => ({
          id: opt.id || `${subId}-opt-${j}`,
          text: opt.text || opt,
        })),
        correctOptionId: sq.correctOptionId || null,
      };
    });

    return {
      id: questionId,
      text: q.text,
      type: q.type || "MCQ",
      marks: q.marks || 1,

      options,
      correctOptionId: q.correctOptionId || null,

      // ✅ IMPORTANT
      passage: q.passage || null,
      passageQuestions,

      parentContent: q.parentContent || null,
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

    const id = searchParams.get("id");
    const courseSlug = searchParams.get("courseSlug");

    let sql = `SELECT * FROM quizzes`;
    const params: any[] = [];

    if (id) {
      sql += ` WHERE id = ?`;
      params.push(id);
    } else if (courseSlug) {
      sql += ` WHERE course_slug = ?`;
      params.push(courseSlug);
    }

    sql += ` ORDER BY id DESC`;

    const [rows]: any = await pool.query(sql, params);

    const formatted = rows.map((q: any) => ({
      id: q.id,
      name: q.name,
      title: q.name,
      course_slug: q.course_slug,
      module_id: q.module_id,
      submodule_id: q.submodule_id,
      batch_ids: safeJSONParse(q.batch_ids, []),
      questions: safeJSONParse(q.questions, []),
      time_minutes: q.time_minutes,
      passing_percent: q.passing_percent,
      created_by: q.created_by,
      created_at: q.created_at,
    }));

    if (id) return NextResponse.json(formatted[0] || null);

    return NextResponse.json(formatted);

  } catch (error) {
    console.error("GET QUIZZES ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch quizzes" }, { status: 500 });
  }
}

/* =====================================================
   CREATE QUIZ
===================================================== */

export async function POST(req: Request) {
  try {
    const pool = getPool();
    const body = await req.json();

    console.log("Create Quiz Payload:", body);

    const name = body.name || body.quizName;
    const time_minutes = body.time_minutes || body.time || 10;
    const passing_percent = body.passing_percent || body.passing || 50;
    const questions = body.questions || [];

    const course_slug = body.course_slug || "demo-course";
    const module_id = body.module_id || "MOD_1";
    const submodule_id = body.submodule_id || null;
    const batch_ids = body.batch_ids || [];
    const created_by = body.created_by || "admin";

    if (!name || !course_slug || !module_id || !questions.length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const normalizedQuestions = normalizeQuestions(questions);

    console.log("FINAL QUESTIONS:", normalizedQuestions);

    const [result]: any = await pool.query(
      `
      INSERT INTO quizzes
      (name, course_slug, module_id, submodule_id, batch_ids, time_minutes, passing_percent, questions, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `,
      [
        name,
        course_slug,
        module_id,
        submodule_id,
        JSON.stringify(batch_ids),
        time_minutes,
        passing_percent,
        JSON.stringify(normalizedQuestions),
        created_by,
      ]
    );

    return NextResponse.json({
      success: true,
      id: result.insertId,
    });

  } catch (error) {
    console.error("CREATE QUIZ ERROR:", error);
    return NextResponse.json({ error: "Failed to create quiz" }, { status: 500 });
  }
}

/* =====================================================
   UPDATE QUIZ
===================================================== */

export async function PUT(req: Request) {
  try {
    const pool = getPool();
    const body = await req.json();

    const {
      id,
      name,
      quizName,
      course_slug,
      module_id,
      submodule_id,
      batch_ids,
      time_minutes,
      time,
      passing_percent,
      passing,
      questions,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Quiz ID required" }, { status: 400 });
    }

    const normalizedQuestions = questions
      ? normalizeQuestions(questions)
      : [];

    await pool.query(
      `
      UPDATE quizzes
      SET 
        name = ?,
        course_slug = ?,
        module_id = ?,
        submodule_id = ?,
        batch_ids = ?,
        time_minutes = ?,
        passing_percent = ?,
        questions = ?
      WHERE id = ?
      `,
      [
        name || quizName,
        course_slug || "demo-course",
        module_id || "MOD_1",
        submodule_id || null,
        JSON.stringify(batch_ids || []),
        time_minutes || time || 10,
        passing_percent || passing || 50,
        JSON.stringify(normalizedQuestions),
        id,
      ]
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("UPDATE QUIZ ERROR:", error);
    return NextResponse.json({ error: "Failed to update quiz" }, { status: 500 });
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
      return NextResponse.json({ error: "Quiz ID required" }, { status: 400 });
    }

    await pool.query(`DELETE FROM quizzes WHERE id = ?`, [id]);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("DELETE QUIZ ERROR:", error);
    return NextResponse.json({ error: "Failed to delete quiz" }, { status: 500 });
  }
}