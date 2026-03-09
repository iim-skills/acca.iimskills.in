// src/components/QuizPanel.tsx
"use client";
import React from "react";
import type { Quiz } from "../../../types/types";

type Props = { quiz?: Quiz | null; onClose?: () => void; onSubmit?: (result?: any) => void };

export default function QuizPanel({ quiz, onClose, onSubmit }: Props) {
  if (!quiz || !Array.isArray(quiz.questions)) {
    console.warn("QuizPanel: missing quiz data", quiz);
    return (
      <div className="p-4 text-sm text-gray-500">
        No quiz available.
      </div>
    );
  }

  const questions = quiz.questions;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = { submittedAt: Date.now(), quizId: quiz.id };

    // call callback
    try { onSubmit?.(result); } catch (err) { console.warn(err); }

    // dispatch global event for CourseModules
    try {
      window.dispatchEvent(new CustomEvent("lms_quiz_submitted", { detail: { quizId: quiz.id, result } }));
    } catch (err) { }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <h4 className="text-sm font-semibold">{quiz.name ?? "Quiz"}</h4>
      <div className="text-xs text-gray-600">{questions.length} questions</div>

      {/* minimal UI for demonstration; adapt to your real quiz UI */}
      <div className="space-y-2">
        {questions.map((q, i) => (
          <div key={i} className="p-3 border rounded bg-white">
            <div className="text-sm font-medium">{q.text ?? `Q${i + 1}`}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={onClose} className="px-3 py-2 bg-gray-100 rounded">Close</button>
        <button type="submit" className="px-3 py-2 bg-indigo-600 text-white rounded">Submit Quiz</button>
      </div>
    </form>
  );
}