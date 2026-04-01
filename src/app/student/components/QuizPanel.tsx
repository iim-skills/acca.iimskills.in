"use client";

import React, { useMemo, useState } from "react";
import type { Quiz } from "../../../types/types";

type Props = {
  quiz?: Quiz | null;
  onClose?: () => void;
  onSubmit?: (result?: any) => void;
  onSubmitted?: (result?: any) => void; // support both
  email?: string;
};

/* ================= NORMALIZE QUIZ ================= */
function normalizeQuestions(quiz: any) {
  if (!quiz || !Array.isArray(quiz.questions)) return [];

  const output: any[] = [];

  quiz.questions.forEach((q: any, index: number) => {
    // PASSAGE → convert to multiple questions
    if (q.type === "PASSAGE") {
      const passage = q.passage || q.text || "";

      (q.passageQuestions || []).forEach((pq: any, i: number) => {
        output.push({
          ...pq,
          id: pq.id || `p-${index}-${i}`,
          passage,
        });
      });

      return;
    }

    // NORMAL QUESTION
    output.push({
      ...q,
      id: q.id || `q-${index}`,
    });
  });

  return output;
}

/* ================= COMPONENT ================= */
export default function QuizPanel({
  quiz,
  onClose,
  onSubmit,
  onSubmitted,
}: Props) {
  const questions = useMemo(() => normalizeQuestions(quiz), [quiz]);

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  if (!questions.length) {
    return (
      <div className="p-4 text-sm text-gray-500">
        No quiz available.
      </div>
    );
  }

  const current = questions[index];
  const isLast = index === questions.length - 1;

  /* ================= HANDLERS ================= */
  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [current.id]: value,
    }));
  };

  const handleSubmit = () => {
    const result = {
      submittedAt: Date.now(),
      quizId: quiz?.id,
      answers,
      total: questions.length,
    };

    // call both (safe)
    try {
      onSubmit?.(result);
      onSubmitted?.(result);
    } catch (err) {
      console.warn(err);
    }

    // LMS event
    try {
      window.dispatchEvent(
        new CustomEvent("lms_quiz_submitted", {
          detail: { quizId: quiz?.id, result },
        })
      );
    } catch {}
  };

  /* ================= UI ================= */
  return (
    <div className="space-y-4 p-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">
          {quiz?.name ?? "Quiz"}
        </h4>
        <span className="text-xs text-gray-500">
          {index + 1} / {questions.length}
        </span>
      </div>

      {/* PASSAGE */}
      {current.passage && (
        <div className="rounded border bg-yellow-50 p-3 text-sm whitespace-pre-line">
          {current.passage}
        </div>
      )}

      {/* QUESTION */}
      <div className="rounded border bg-white p-4">
        <div className="mb-3 text-sm font-medium">
          {current.text || "Question"}
        </div>

        {/* MCQ */}
        {current.type === "MCQ" && (
          <div className="space-y-2">
            {(current.options || []).map((opt: any) => (
              <label
                key={opt.id}
                className="flex cursor-pointer items-start gap-2"
              >
                <input
                  type="radio"
                  name={current.id}
                  value={opt.id}
                  checked={answers[current.id] === opt.id}
                  onChange={(e) => handleAnswer(e.target.value)}
                />
                <span className="text-sm">{opt.text}</span>
              </label>
            ))}
          </div>
        )}

        {/* SHORT */}
        {current.type === "SHORT" && (
          <textarea
            className="w-full rounded border p-2 text-sm"
            rows={4}
            value={answers[current.id] || ""}
            onChange={(e) => handleAnswer(e.target.value)}
            placeholder="Type your answer..."
          />
        )}
      </div>

      {/* ACTIONS */}
      <div className="flex justify-between">
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="rounded bg-gray-100 px-3 py-2 disabled:opacity-50"
        >
          Prev
        </button>

        {!isLast ? (
          <button
            onClick={() => setIndex((i) => i + 1)}
            className="rounded bg-indigo-600 px-3 py-2 text-white"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="rounded bg-green-600 px-3 py-2 text-white"
          >
            Submit Quiz
          </button>
        )}
      </div>

      {/* CLOSE */}
      <div>
        <button
          onClick={onClose}
          className="text-xs text-gray-500 underline"
        >
          Close
        </button>
      </div>
    </div>
  );
}