"use client";

import { useSearchParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

/* ================= TYPES ================= */

type Option = {
  id: string;
  text: string;
};

type Question = {
  id: string;
  text: string;
  options: Option[];
  correctOption?: string;
};

type Quiz = {
  id: string;
  name: string;
  course_slug: string;
  module_id: string;
  submodule_id?: string;
  batch_ids?: string[];
  time_minutes?: number;
  passing_percent?: number;
  questions: Question[];
};

/* ================= HELPERS ================= */

const generateId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2);

export default function EditQuizPage() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("id");

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  /* ================= LOAD QUIZ ================= */

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const res = await fetch(`/api/admin/quizzes?id=${id}`);
        const data = await res.json();
        setQuiz(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  /* ================= UPDATE QUIZ ================= */

  const updateQuiz = async () => {
    if (!quiz) return;

    try {
      const res = await fetch("/api/admin/quizzes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quiz),
      });

      if (!res.ok) throw new Error("Update failed");

      setMsg("Quiz updated successfully ✅");
      setTimeout(() => setMsg(""), 4000);
    } catch (err: any) {
      setMsg(err.message);
    }
  };

  /* ================= QUESTION HANDLERS ================= */

  const addQuestion = () => {
    if (!quiz) return;

    const newQ: Question = {
      id: generateId(),
      text: "",
      options: [
        { id: generateId(), text: "" },
        { id: generateId(), text: "" },
        { id: generateId(), text: "" },
        { id: generateId(), text: "" },
      ],
      correctOption: undefined,
    };

    setQuiz({
      ...quiz,
      questions: [...quiz.questions, newQ],
    });
  };

  const removeQuestion = (qid: string) => {
    if (!quiz) return;

    setQuiz({
      ...quiz,
      questions: quiz.questions.filter((q) => q.id !== qid),
    });
  };

  const updateQuestionText = (qid: string, value: string) => {
    if (!quiz) return;

    setQuiz({
      ...quiz,
      questions: quiz.questions.map((q) =>
        q.id === qid ? { ...q, text: value } : q
      ),
    });
  };

  const updateOptionText = (
    qid: string,
    optId: string,
    value: string
  ) => {
    if (!quiz) return;

    setQuiz({
      ...quiz,
      questions: quiz.questions.map((q) =>
        q.id === qid
          ? {
              ...q,
              options: q.options.map((opt) =>
                opt.id === optId ? { ...opt, text: value } : opt
              ),
            }
          : q
      ),
    });
  };

  const setCorrect = (qid: string, optId: string) => {
    if (!quiz) return;

    setQuiz({
      ...quiz,
      questions: quiz.questions.map((q) =>
        q.id === qid ? { ...q, correctOption: optId } : q
      ),
    });
  };

  /* ================= UI ================= */

  if (loading) return <div className="p-10">Loading...</div>;
  if (!quiz) return <div className="p-10">Quiz not found</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Edit Quiz</h1>

      {/* Quiz Name */}
      <div>
        <label className="font-semibold">Quiz Name</label>
        <input
          value={quiz.name}
          onChange={(e) =>
            setQuiz({ ...quiz, name: e.target.value })
          }
          className="w-full p-3 border rounded-lg mt-1"
        />
      </div>

      {/* Meta */}
      <div className="grid grid-cols-3 gap-4">
        <input
          type="number"
          placeholder="Time (mins)"
          value={quiz.time_minutes || 0}
          onChange={(e) =>
            setQuiz({
              ...quiz,
              time_minutes: Number(e.target.value),
            })
          }
          className="p-2 border rounded"
        />

        <input
          type="number"
          placeholder="Passing %"
          value={quiz.passing_percent || 0}
          onChange={(e) =>
            setQuiz({
              ...quiz,
              passing_percent: Number(e.target.value),
            })
          }
          className="p-2 border rounded"
        />

        <div className="p-2 border rounded bg-gray-100 text-center">
          {quiz.questions.length} Questions
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {quiz.questions.map((q, idx) => (
          <div key={q.id} className="p-4 border rounded-lg bg-white">
            <div className="flex justify-between items-center mb-2">
              <strong>Q{idx + 1}</strong>
              <button
                onClick={() => removeQuestion(q.id)}
                className="text-red-500"
              >
                <Trash2 size={18} />
              </button>
            </div>

            {/* Question text */}
            <input
              value={q.text}
              onChange={(e) =>
                updateQuestionText(q.id, e.target.value)
              }
              placeholder="Enter question"
              className="w-full p-2 border rounded mb-3"
            />

            {/* Options */}
            {q.options.map((opt, i) => (
              <div key={opt.id} className="flex items-center gap-2 mb-2">
                <input
                  type="radio"
                  checked={q.correctOption === opt.id}
                  onChange={() => setCorrect(q.id, opt.id)}
                />
                <input
                  value={opt.text}
                  onChange={(e) =>
                    updateOptionText(q.id, opt.id, e.target.value)
                  }
                  placeholder={`Option ${i + 1}`}
                  className="w-full p-2 border rounded"
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Add Question */}
      <button
        onClick={addQuestion}
        className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
      >
        <Plus size={16} /> Add Question
      </button>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 border rounded"
        >
          Cancel
        </button>

        <button
          onClick={updateQuiz}
          className="bg-green-600 text-white px-6 py-2 rounded"
        >
          Save Changes
        </button>
      </div>

      {msg && (
        <div className="text-center text-sm text-green-600">
          {msg}
        </div>
      )}
    </div>
  );
}