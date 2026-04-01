"use client";

import React, { useMemo, useState } from "react";
import type { Quiz } from "../../../types/types";

type Props = {
  quiz?: Quiz | null;
  onClose?: () => void;
  onSubmit?: (result?: any) => void;
  onSubmitted?: (result?: any) => void;
  email?: string;
};

/* ================= NORMALIZE QUIZ ================= */
function normalizeQuestions(quiz: any) {
  if (!quiz || !Array.isArray(quiz.questions)) return [];

  const output: any[] = [];

  quiz.questions.forEach((q: any, index: number) => {
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
      <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
        <p className="text-sm font-medium text-gray-500">No quiz content available at this time.</p>
      </div>
    );
  }

  const current = questions[index];
  const isLast = index === questions.length - 1;
  const progress = ((index + 1) / questions.length) * 100;

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

    try {
      onSubmit?.(result);
      onSubmitted?.(result);
    } catch (err) {
      console.warn(err);
    }

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
    <div className="max-w-2xl mx-auto bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden transition-all">
      {/* PROGRESS BAR */}
      <div className="h-1.5 w-full bg-gray-100">
        <div 
          className="h-full bg-indigo-500 transition-all duration-300 ease-out" 
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-6 space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-bold text-gray-900 leading-tight">
              {quiz?.name ?? "Quiz Assessment"}
            </h4>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mt-1">
              Step {index + 1} of {questions.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            title="Close Quiz"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* PASSAGE SECTION */}
        {current.passage && (
          <div className="relative group">
            <div className="absolute -left-2 top-0 bottom-0 w-1 bg-indigo-100 rounded-full" />
            <div className="rounded-xl border border-indigo-50 bg-indigo-50/30 p-4 text-sm text-gray-700 italic leading-relaxed whitespace-pre-line shadow-sm">
              <span className="font-semibold text-indigo-600 block mb-1 not-italic tracking-wide uppercase text-[10px]">Reference Text:</span>
              {current.passage}
            </div>
          </div>
        )}

        {/* QUESTION CARD */}
        <div className="space-y-4">
          <div className="text-base font-semibold text-gray-800 leading-snug">
            {current.text || "Please answer the following:"}
          </div>

          {/* MCQ OPTIONS */}
          {current.type === "MCQ" && (
            <div className="grid gap-3">
              {(current.options || []).map((opt: any) => {
                const isSelected = answers[current.id] === opt.id;
                return (
                  <label
                    key={opt.id}
                    className={`
                      flex cursor-pointer items-center gap-3 p-4 rounded-xl border-2 transition-all
                      ${isSelected 
                        ? "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600" 
                        : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"}
                    `}
                  >
                    <div className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center
                      ${isSelected ? "border-indigo-600" : "border-gray-300"}
                    `}>
                      {isSelected && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
                    </div>
                    <input
                      type="radio"
                      className="hidden"
                      name={current.id}
                      value={opt.id}
                      checked={isSelected}
                      onChange={(e) => handleAnswer(e.target.value)}
                    />
                    <span className={`text-sm font-medium ${isSelected ? "text-indigo-900" : "text-gray-700"}`}>
                      {opt.text}
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          {/* SHORT ANSWER */}
          {current.type === "SHORT" && (
            <textarea
              className="w-full rounded-xl border-2 border-gray-100 p-4 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none min-h-[120px] placeholder:text-gray-300"
              value={answers[current.id] || ""}
              onChange={(e) => handleAnswer(e.target.value)}
              placeholder="Write your response here..."
            />
          )}
        </div>

        {/* ACTIONS */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-50">
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 disabled:opacity-30 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          {!isLast ? (
            <button
              onClick={() => setIndex((i) => i + 1)}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all"
            >
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="rounded-xl bg-emerald-600 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all"
            >
              Finish & Submit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}