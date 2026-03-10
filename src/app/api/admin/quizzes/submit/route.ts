import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export async function POST(req: Request) {
  try {
    const { quizId, answers } = await req.json();

    if (!quizId || !answers) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const [rows]: any = await pool.query(
      `SELECT questions, passing_percent FROM quizzes WHERE id = ?`,
      [quizId]
    );

    if (!rows.length) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const quiz = rows[0];
    const questions = JSON.parse(quiz.questions);

    let correct = 0;

    questions.forEach((q: any) => {
      const userAnswer = answers[q.id];

      if (userAnswer && userAnswer === q.correctOption) {
        correct++;
      }
    });

    const total = questions.length;
    const percent = (correct / total) * 100;
    const passed = percent >= quiz.passing_percent;

    return NextResponse.json({
      score: correct,
      total,
      percent,
      passed,
    });
  } catch (error) {
    console.error("SUBMIT QUIZ ERROR:", error);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}