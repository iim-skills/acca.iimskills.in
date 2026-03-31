"use client";

import React, { useEffect, useState } from "react";

type QuestionOption = {
  id: string;
  text: string;
};

type PassageSubQuestion = {
  id: string;
  text: string;
  options: QuestionOption[];
};

type QuestionItem = {
  id: string;
  type: "MCQ" | "SHORT" | "LONG" | "PASSAGE";
  text: string;
  marks: number;
  options?: QuestionOption[];
  passage?: string;
  passageQuestions?: PassageSubQuestion[];
};

type QuizData = {
  id: number;
  name: string;
  questions: QuestionItem[];
  totalMarks: number;
  totalQuestions: number;
};

export default function PreviewClient({ id }: { id?: string }) {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("🔥 PREVIEW ID:", id);

    const fetchQuiz = async () => {
      try {
        if (!id) {
          console.log("❌ NO ID");
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/admin/quizzes?id=${id}`);

        if (!res.ok) {
          console.log("❌ API FAILED");
          setLoading(false);
          return;
        }

        const data = await res.json();

        console.log("✅ QUIZ DATA:", data);

        setQuiz(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id]);

  // ❌ NO ID
  if (!id) {
    return (
      <div className="h-screen flex items-center justify-center text-red-500">
        ❌ Missing Quiz ID in URL
      </div>
    );
  }

  // ⏳ LOADING
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Loading preview...
      </div>
    );
  }

  // ❌ NO DATA
  if (!quiz) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        No quiz data found
      </div>
    );
  }

  let globalIndex = 1;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow border p-8 space-y-10">

        {/* HEADER */}
        <div className="border-b pb-4">
          <h1 className="text-2xl font-bold">{quiz.name}</h1>
          <p className="text-sm text-gray-500">
            {quiz.totalQuestions} Questions • {quiz.totalMarks} Marks
          </p>
        </div>

        {/* QUESTIONS */}
        <div className="space-y-10">
          {quiz.questions.map((q) => {

            // ✅ PASSAGE
            if (q.type === "PASSAGE") {
              return (
                <div key={q.id} className="space-y-6">

                  <h2 className="text-xl font-bold border-l-4 border-indigo-500 pl-4">
                    {q.text}
                  </h2>

                  <div className="bg-slate-50 p-6 rounded border italic">
                    {q.passage}
                  </div>

                  {q.passageQuestions?.map((sq) => {
                    const num = globalIndex++; // 🔥 COUNT ONLY SUB QUESTIONS

                    return (
                      <div key={sq.id} className="space-y-3">

                        <p className="font-semibold text-lg">
                          {num}. {sq.text}
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                          {sq.options?.map((opt, i) => (
                            <div key={opt.id} className="border p-3 rounded flex gap-2">
                              <span>{String.fromCharCode(65 + i)}.</span>
                              {opt.text}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            }

            // ✅ NORMAL QUESTION
            const num = globalIndex++;

            return (
              <div key={q.id} className="space-y-4">

                <p className="text-lg font-semibold">
                  {num}. {q.text}
                </p>

                {q.type === "MCQ" && (
                  <div className="grid grid-cols-2 gap-3">
                    {q.options?.map((opt, i) => (
                      <div key={opt.id} className="border p-3 rounded flex gap-2">
                        <span>{String.fromCharCode(65 + i)}.</span>
                        {opt.text}
                      </div>
                    ))}
                  </div>
                )}

                {(q.type === "SHORT" || q.type === "LONG") && (
                  <div className="h-12 bg-slate-100 rounded"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}