// src\app\components\Students\QuizPanel.tsx
"use client";

import React, { useEffect, useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";

type Option = {
  id?: string;
  text?: string;
};

type Question = {
  id?: string;
  text?: string;
  options?: Option[];
  correctOption?: string | number;
};

type Quiz = {
  id: string;
  name?: string;
  time_minutes?: number;
  questions: Question[];
};

type Props = {
  quiz: Quiz;
  email: string; // 👈 added email from LMS
  onClose?: () => void;
  onSubmitted?: (result: any) => void;
};

const QUESTIONS_PER_PAGE = 4;

export default function QuizPanel({ quiz, email, onClose, onSubmitted }: Props) {
  const [answers, setAnswers] = useState<Record<number, string | number>>({});
  const [page, setPage] = useState(0);
  const [timeLeft, setTimeLeft] = useState((quiz.time_minutes ?? 30) * 60);

  const totalPages = Math.ceil(
    (quiz.questions?.length ?? 0) / QUESTIONS_PER_PAGE
  );

  /* ================= TIMER ================= */

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const startIndex = page * QUESTIONS_PER_PAGE;

  const visibleQuestions = quiz.questions.slice(
    startIndex,
    startIndex + QUESTIONS_PER_PAGE
  );

  const handleSelect = (qIndex: number, value: string | number) => {
    setAnswers((prev) => ({
      ...prev,
      [qIndex]: value,
    }));
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async () => {
    // Build detailed answers array: [{ q: 1, a: 1, correct: true }, ...]
    const results: Array<{ q: number; a: number | null; correct: boolean }> = [];
    let score = 0;
    let attempted = 0;

    quiz.questions.forEach((q, index) => {
      const qNo = index + 1;
      const selectedId = answers[index];
      let selectedOptionNumber: number | null = null;

      if (selectedId !== undefined && selectedId !== null && String(selectedId) !== "") {
        const match = String(selectedId).match(/opt-(\d+)/);
        if (match && match[1]) {
          selectedOptionNumber = parseInt(match[1], 10);
        } else if (!Number.isNaN(Number(selectedId))) {
          // if option stored as numeric
          selectedOptionNumber = Number(selectedId);
        } else {
          // try to map option id to its index+1 if options exist
          if (Array.isArray(q.options)) {
            const foundIdx = q.options.findIndex((o) => o.id === selectedId);
            if (foundIdx !== -1) selectedOptionNumber = foundIdx + 1;
          }
        }
      }

      // determine correct option number
      let correctOptionNumber: number | null = null;
      if (q.correctOption !== undefined && q.correctOption !== null && String(q.correctOption) !== "") {
        const co = String(q.correctOption);
        const m = co.match(/opt-(\d+)/);
        if (m && m[1]) {
          correctOptionNumber = parseInt(m[1], 10);
        } else if (!Number.isNaN(Number(co))) {
          correctOptionNumber = Number(co);
        } else {
          // try to match by option id to find index
          if (Array.isArray(q.options)) {
            const foundIdx = q.options.findIndex((o) => String(o.id) === co);
            if (foundIdx !== -1) correctOptionNumber = foundIdx + 1;
          }
        }
      }

      const correct = selectedOptionNumber !== null && correctOptionNumber !== null && selectedOptionNumber === correctOptionNumber;

      if (selectedOptionNumber !== null) attempted++;
      if (correct) score++;

      results.push({
        q: qNo,
        a: selectedOptionNumber,
        correct,
      });
    });

    const total = quiz.questions.length;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

    try {
      const res = await fetch("/api/admin/quizzes/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quizId: quiz.id,
          email, // email from LMS
          totalQuestions: total,
          attemptedQuestions: attempted,
          score,
          answers: results, // send structured detailed results
          submittedAt: Date.now(),
        }),
      });

      const data = await res.json();

      onSubmitted?.({
        score,
        total,
        percentage,
        rawResponse: data,
      });

    } catch (error) {
      // intentionally no console logs per request
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-indigo-50 to-white p-8 overflow-y-auto">

      {/* HEADER */}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-indigo-800">
            {quiz.name ?? "Quiz"}
          </h2>

          <p className="text-sm text-gray-500">
            Questions: {quiz.questions.length}
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-lg font-semibold text-rose-600">
            ⏱ {formatTime(timeLeft)}
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="text-sm text-gray-600 hover:text-black"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* QUESTIONS */}

      <div className="space-y-6 flex-1">
        {visibleQuestions.map((q, i) => {
          const actualIndex = startIndex + i;

          return (
            <div
              key={actualIndex}
              className="bg-white p-6 rounded-xl shadow-md border border-gray-200"
            >
              <h4 className="font-semibold mb-4 text-gray-800">
                {actualIndex + 1}. {q.text}
              </h4>

              <div className="space-y-3">
                {q.options?.map((opt, idx) => (
                  <label
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                      answers[actualIndex] === opt.id
                        ? "bg-indigo-100 border-indigo-400"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${actualIndex}`}
                      value={opt.id}
                      checked={answers[actualIndex] === opt.id}
                      onChange={() =>
                        handleSelect(actualIndex, opt.id ?? idx)
                      }
                    />

                    <span>{opt.text}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTER NAVIGATION */}

      <div className="mt-8 flex justify-between items-center">
        <button
          disabled={page === 0}
          onClick={() => setPage((p) => p - 1)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
        >
          <ChevronLeft size={16} /> Previous
        </button>

        <div className="text-sm text-gray-500">
          Page {page + 1} of {totalPages}
        </div>

        {page < totalPages - 1 ? (
          <button
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Submit Quiz
          </button>
        )}
      </div>
    </div>
  );
}