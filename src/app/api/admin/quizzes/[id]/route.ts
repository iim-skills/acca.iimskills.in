import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});

/* ================= GET (Single Quiz) ================= */
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

    // parse JSON fields
    quiz.questions = quiz.questions ? JSON.parse(quiz.questions) : [];
    quiz.batch_ids = quiz.batch_ids ? JSON.parse(quiz.batch_ids) : [];

    return NextResponse.json(quiz);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  } finally {
    conn.release();
  }
}

/* ================= PUT (Update Quiz) ================= */
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
        questions.length,
        JSON.stringify(questions),
        id,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  } finally {
    conn.release();
  }
}

/* ================= DELETE ================= */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const conn = await pool.getConnection();

  try {
    await conn.query("DELETE FROM quizzes WHERE id = ?", [params.id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  } finally {
    conn.release();
  }
}