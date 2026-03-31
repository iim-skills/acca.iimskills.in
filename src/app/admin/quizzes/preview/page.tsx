"use client";

import { useEffect, useState } from "react";

type Option = {
  id: string;
  text: string;
};

type Question = {
  id: string;
  type: "MCQ" | "SHORT" | "LONG" | "PASSAGE";
  text: string;
  options?: Option[];
  passage?: string;
  passageQuestions?: Question[];
};

type Quiz = {
  name: string;
  questions: Question[];
  totalMarks: number;
  totalQuestions: number;
};

export default function PreviewPage() {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 min

  // ✅ LOAD FROM LOCAL STORAGE (FIXED)
  useEffect(() => {
    const data = localStorage.getItem("previewQuiz");
    if (data) {
      setQuiz(JSON.parse(data));
    }
  }, []);

  // ✅ TIMER
  useEffect(() => {
    if (!quiz) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quiz]);

  if (!quiz) {
    return (
      <div className="p-10 text-center text-red-500 font-semibold">
        ❌ No quiz data found
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      
      {/* ✅ HEADER */}
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-2xl font-bold">{quiz.name}</h1>

        <div className="text-red-500 font-semibold">
          ⏱ {Math.floor(timeLeft / 60)}:
          {(timeLeft % 60).toString().padStart(2, "0")}
        </div>
      </div>

      {/* ✅ QUESTIONS */}
      <div className="space-y-10">
        {quiz.questions.map((q, index) => {

          // 🔹 PASSAGE TYPE
          if (q.type === "PASSAGE") {
            return (
              <div key={q.id} className="space-y-6 border p-6 rounded-xl">
                
                <h2 className="font-bold text-lg">
                  {q.text || "Reading Passage"}
                </h2>

                <div className="bg-gray-100 p-4 rounded whitespace-pre-wrap">
                  {q.passage || "No passage provided"}
                </div>

                {q.passageQuestions?.map((sq, i) => (
                  <div key={sq.id} className="space-y-3">
                    <p className="font-semibold">
                      {i + 1}. {sq.text}
                    </p>

                    {sq.options?.map((opt, idx) => (
                      <label key={opt.id} className="block">
                        <input
                          type="radio"
                          name={sq.id}
                          className="mr-2"
                        />
                        {opt.text}
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            );
          }

          // 🔹 NORMAL QUESTIONS
          return (
            <div key={q.id} className="space-y-4">
              <p className="font-semibold">
                {index + 1}. {q.text}
              </p>

              {q.type === "MCQ" &&
                q.options?.map((opt, i) => (
                  <label key={opt.id} className="block">
                    <input
                      type="radio"
                      name={q.id}
                      className="mr-2"
                    />
                    {opt.text}
                  </label>
                ))}

              {(q.type === "SHORT" || q.type === "LONG") && (
                <textarea
                  className="w-full border p-2 rounded"
                  placeholder="Write your answer..."
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}