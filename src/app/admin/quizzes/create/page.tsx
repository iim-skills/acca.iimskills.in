"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  CheckCircle2,
  Type,
  AlignLeft,
  Layers,
  Save,
  ChevronLeft,
  Info,
  Target,
  Layout,
  Trash,
} from "lucide-react";

/* ================= TYPES ================= */

type QType = "MCQ" | "SHORT" | "LONG" | "COMPREHENSION";

interface Question {
  id: string;
  type: QType;
  text: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  parentContent?: string;
}

const generateId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

function createNewQuestion(type: QType = "MCQ"): Question {
  return {
    id: generateId(),
    type,
    text: "",
    options: [
      { id: generateId(), text: "" },
      { id: generateId(), text: "" },
    ],
    correctOptionId: "",
  };
}

export default function CreateQuizPage() {
  const router = useRouter();

  // Quiz Meta
  const [quizName, setQuizName] = useState("");
  const [time, setTime] = useState(30);
  const [passing, setPassing] = useState(50);

  // Questions State
  const [questions, setQuestions] = useState<Question[]>([createNewQuestion()]);
  const [activeIdx, setActiveIdx] = useState(0);

  const activeQuestion = questions[activeIdx] ?? questions[0];

  const handleAddQuestion = () => {
    const newQ = createNewQuestion();
    setQuestions((prev) => [...prev, newQ]);
    setActiveIdx(questions.length);
  };

  const updateActiveQuestion = (updates: Partial<Question>) => {
    setQuestions((prev) => {
      const updated = [...prev];
      if (!updated[activeIdx]) return prev;
      updated[activeIdx] = { ...updated[activeIdx], ...updates };
      return updated;
    });
  };

  const handleDeleteQuestion = () => {
    setQuestions((prev) => {
      if (prev.length <= 1) {
        setActiveIdx(0);
        return [createNewQuestion()];
      }

      const updated = prev.filter((_, i) => i !== activeIdx);
      const nextIndex = Math.max(0, activeIdx - 1);
      setActiveIdx(nextIndex);
      return updated;
    });
  };

  const handlePublish = async () => {
    if (!quizName.trim()) {
      alert("Please enter quiz name");
      return;
    }

    if (questions.length === 0) {
      alert("Add at least one question");
      return;
    }

    try {
      const res = await fetch("/api/admin/quizzes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quizName,
          time,
          passing,
          questions,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data?.error || "Failed to publish quiz");
        return;
      }

      alert("✅ Quiz Published Successfully");
      router.push("/admin");
    } catch (err) {
      console.error("Publish Error:", err);
      alert("Something went wrong");
    }
  };

  const passingCount = useMemo(() => {
    const total = questions.length || 1;
    return Math.ceil((passing / 100) * total);
  }, [passing, questions.length]);

  const weightPerQuestion = useMemo(() => {
    const total = questions.length || 1;
    return (100 / total).toFixed(1);
  }, [questions.length]);

  if (!activeQuestion) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      {/* --- TOP BAR --- */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold">Quiz Studio</h1>
            <p className="text-xs text-slate-500">Drafting New Assessment</p>
          </div>
        </div>

        <button
          onClick={handlePublish}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all"
        >
          <Save size={18} /> Publish Quiz
        </button>
      </header>

      <main className="max-w-[1600px] mx-auto p-8 grid grid-cols-12 gap-8">
        {/* --- LEFT COLUMN: GENERAL INFO --- */}
        <div className="col-span-3 space-y-6">
          <section className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 text-blue-600 mb-6">
              <Layout size={18} />
              <h2 className="font-bold text-sm uppercase tracking-wider">
                General Info
              </h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Quiz Name
                </label>
                <input
                  value={quizName}
                  onChange={(e) => setQuizName(e.target.value)}
                  placeholder="e.g. JavaScript Advanced"
                  className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Time (Mins)
                  </label>
                  <input
                    type="number"
                    value={time}
                    onChange={(e) => setTime(Number(e.target.value))}
                    className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Passing %
                  </label>
                  <input
                    type="number"
                    value={passing}
                    onChange={(e) => setPassing(Number(e.target.value))}
                    className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm outline-none"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-600 mb-6">
              <Layers size={18} />
              <h2 className="font-bold text-sm uppercase tracking-wider">
                Navigator
              </h2>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  className={`h-10 rounded-xl font-bold text-xs transition-all ${
                    activeIdx === i
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={handleAddQuestion}
                className="h-10 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 flex items-center justify-center hover:bg-slate-50 transition-all"
              >
                <Plus size={16} />
              </button>
            </div>
          </section>
        </div>

        {/* --- CENTER COLUMN: DYNAMIC EDITOR --- */}
        <div className="col-span-6">
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 min-h-[600px] relative">
            <div className="flex justify-between items-center mb-8">
              <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                Question {activeIdx + 1} of {questions.length}
              </span>
              <button
                onClick={handleDeleteQuestion}
                className="text-slate-300 hover:text-red-500 transition-colors"
              >
                <Trash size={20} />
              </button>
            </div>

            {/* Type Switcher Toolbar */}
            <div className="flex gap-2 mb-8 p-1 bg-slate-50 rounded-2xl w-fit">
              <TypeBtn
                active={activeQuestion.type === "MCQ"}
                onClick={() => updateActiveQuestion({ type: "MCQ" })}
                icon={<Type size={16} />}
                label="MCQ"
              />
              <TypeBtn
                active={activeQuestion.type === "SHORT"}
                onClick={() => updateActiveQuestion({ type: "SHORT" })}
                icon={<AlignLeft size={16} />}
                label="Short"
              />
              <TypeBtn
                active={activeQuestion.type === "COMPREHENSION"}
                onClick={() => updateActiveQuestion({ type: "COMPREHENSION" })}
                icon={<Layers size={16} />}
                label="Context"
              />
            </div>

            {/* Comprehension: Parent Content Area */}
            {activeQuestion.type === "COMPREHENSION" && (
              <div className="mb-6 p-6 bg-amber-50 rounded-3xl border border-amber-100">
                <label className="text-[10px] font-black text-amber-600 uppercase mb-2 block">
                  Shared Context / Passage
                </label>
                <textarea
                  value={activeQuestion.parentContent || ""}
                  onChange={(e) =>
                    updateActiveQuestion({ parentContent: e.target.value })
                  }
                  placeholder="Paste the paragraph or content that applies to this question..."
                  className="w-full bg-transparent border-none focus:ring-0 text-sm italic text-slate-700 resize-none h-24"
                />
              </div>
            )}

            <textarea
              placeholder="Type your question here..."
              value={activeQuestion.text}
              onChange={(e) => updateActiveQuestion({ text: e.target.value })}
              className="w-full text-2xl font-bold bg-transparent border-none focus:ring-0 placeholder:text-slate-200 resize-none h-32 mb-8"
            />

            {/* MCQ Options Rendering */}
            {activeQuestion.type === "MCQ" && (
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                  Multiple Choice Options
                </p>
                {activeQuestion.options.map((opt, idx) => {
                  const isCorrect = activeQuestion.correctOptionId === opt.id;
                  return (
                    <div
                      key={opt.id}
                      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                        isCorrect
                          ? "bg-emerald-50 border-emerald-200 shadow-sm"
                          : "bg-white border-slate-100"
                      }`}
                    >
                      <button
                        onClick={() =>
                          updateActiveQuestion({ correctOptionId: opt.id })
                        }
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                          isCorrect
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-50 text-slate-300"
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </button>

                      <input
                        value={opt.text}
                        onChange={(e) => {
                          const newOpts = [...activeQuestion.options];
                          newOpts[idx] = { ...newOpts[idx], text: e.target.value };
                          updateActiveQuestion({ options: newOpts });
                        }}
                        placeholder={`Option ${idx + 1}...`}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-semibold outline-none"
                      />

                      {isCorrect && (
                        <CheckCircle2 size={18} className="text-emerald-500" />
                      )}
                    </div>
                  );
                })}

                <button
                  onClick={() =>
                    updateActiveQuestion({
                      options: [
                        ...activeQuestion.options,
                        { id: generateId(), text: "" },
                      ],
                    })
                  }
                  className="text-xs font-bold text-blue-600 px-4 py-2 hover:bg-blue-50 rounded-lg transition-all"
                >
                  + Add Option
                </button>
              </div>
            )}

            {/* Short Answer View */}
            {activeQuestion.type === "SHORT" && (
              <div className="p-12 border-2 border-dashed border-slate-100 rounded-[2rem] text-center">
                <p className="text-slate-300 font-bold italic">
                  Students will see a text input field here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* --- RIGHT COLUMN: TIPS & PREVIEW --- */}
        <div className="col-span-3 space-y-6">
          <div className="bg-[#0F172A] text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="bg-white/10 w-10 h-10 rounded-xl flex items-center justify-center mb-6">
                <Info size={20} />
              </div>
              <h3 className="font-bold text-lg mb-4">Creator Tips</h3>
              <ul className="text-sm text-slate-400 space-y-4">
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                  Use the navigator to hop between questions.
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                  Click the A/B/C/D bubbles to set the correct answer.
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                  Use "Context" type for Reading Comprehension questions.
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="font-bold text-sm flex items-center gap-2 mb-6">
              <Target size={16} className="text-blue-500" /> Scoring Preview
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                <span>Weight Per Question</span>
                <span className="text-slate-900">{weightPerQuestion}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, passing))}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed italic text-center">
                Students must answer at least {passingCount} questions correctly
                to pass.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function TypeBtn({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
        active ? "bg-white shadow-sm text-blue-600" : "text-slate-400 hover:text-slate-600"
      }`}
    >
      {icon} {label}
    </button>
  );
}