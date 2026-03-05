// app/admin/quizzes/preview/PreviewClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Question = {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
};

type Quiz = {
  id: number;
  name: string;
  time_minutes: number;
  passing_percent: number;
  questions: Question[];
};

export default function PreviewClient() {
  const searchParams = useSearchParams();
  const quizId = searchParams.get("id");

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [answers, setAnswers] = useState<{ [key: string]: number }>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!quizId) return;

    const fetchQuiz = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/quizzes");
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const data = await res.json();
        const found = data.find((q: Quiz) => String(q.id) === String(quizId));
        setQuiz(found || null);
      } catch (err: any) {
        console.error("fetchQuiz error:", err);
        setError("Failed to load quiz.");
        setQuiz(null);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  const handleSelect = (questionId: string, optionIndex: number) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = () => {
    if (!quiz) return;

    let correct = 0;

    quiz.questions.forEach((q) => {
      if (answers[q.id] === q.correctIndex) correct++;
    });

    const percent = (correct / quiz.questions.length) * 100;
    setScore(percent);
    setSubmitted(true);
  };

  if (!quizId) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-bold">No quiz selected</h2>
        <p className="text-sm text-slate-500">Provide an `id` query param (e.g. ?id=123).</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-bold">Loading quiz…</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-bold">Error</h2>
        <p className="text-sm text-rose-600">{error}</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-bold">Quiz not found</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold mb-2">{quiz.name}</h1>
        <p className="text-sm text-slate-500 mb-6">
          Time: {quiz.time_minutes} mins • Passing: {quiz.passing_percent}%
        </p>

        {quiz.questions.map((q, index) => (
          <div key={q.id} className="mb-6">
            <h3 className="font-semibold mb-2">
              {index + 1}. {q.text}
            </h3>
            <div className="space-y-2">
              {q.options.map((opt, i) => {
                const isCorrect = submitted && i === q.correctIndex;
                const isWrong = submitted && answers[q.id] === i && i !== q.correctIndex;

                return (
                  <div
                    key={i}
                    onClick={() => handleSelect(q.id, i)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") handleSelect(q.id, i);
                    }}
                    className={`p-3 rounded-lg border cursor-pointer transition ${
                      isCorrect
                        ? "bg-emerald-100 border-emerald-500"
                        : isWrong
                        ? "bg-rose-100 border-rose-500"
                        : "bg-slate-50"
                    }`}
                  >
                    {String.fromCharCode(65 + i)}. {opt}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {!submitted ? (
          <button
            onClick={handleSubmit}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold"
          >
            Submit Quiz
          </button>
        ) : (
          <div className="mt-4">
            <h2 className="text-lg font-bold">Score: {score.toFixed(2)}%</h2>
            <p
              className={`font-semibold ${
                score >= quiz.passing_percent ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {score >= quiz.passing_percent ? "PASSED" : "FAILED"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}