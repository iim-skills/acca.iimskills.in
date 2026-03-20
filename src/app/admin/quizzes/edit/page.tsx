"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Loader2,
  ChevronLeft,
  Save,
  Target,
  Layout,
  Layers,
  Info,
  CheckCircle2,
  AlignLeft,
  Trash2,
  Plus,
  Type,
  Trash,
} from "lucide-react";

export const dynamic = "force-dynamic";

/* ================= TYPES ================= */

type QType = "MCQ" | "SHORT" | "LONG" | "COMPREHENSION";

type Question = {
  id: string;
  type: QType;
  text: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  parentContent?: string;
};

type Quiz = {
  id: number | string;
  name: string;
  course_slug: string;
  module_id: string;
  submodule_id: string | null;
  batch_ids: string[];
  created_by: string;
  time_minutes: number;
  passing_percent: number;
  questions: Question[];
};

type ApiQuizResponse = {
  id: number | string;
  name?: string;
  title?: string;
  course_slug?: string;
  module_id?: string;
  submodule_id?: string | null;
  batch_ids?: string[] | string;
  created_by?: string;
  time_minutes?: number;
  passing_percent?: number;
  questions?: Question[] | string;
};

/* ================= HELPERS ================= */

function safeJSONParse<T>(value: unknown, fallback: T): T {
  try {
    if (value === null || value === undefined || value === "") return fallback;
    if (typeof value === "string") return JSON.parse(value) as T;
    return value as T;
  } catch {
    return fallback;
  }
}

function normalizeQuestions(questions: Question[]) {
  return questions.map((q, index) => {
    const questionId = q.id || `q-${Date.now()}-${index}`;

    const options = (q.options || []).map((opt, i) => ({
      id: opt.id || `${questionId}-opt-${i}`,
      text: opt.text ?? "",
    }));

    return {
      id: questionId,
      type: q.type || "MCQ",
      text: q.text ?? "",
      options,
      correctOptionId: q.correctOptionId || "",
      parentContent: q.parentContent || "",
    };
  });
}

function createNewQuestion(type: QType = "MCQ"): Question {
  return {
    id: crypto.randomUUID(),
    type,
    text: "",
    options: [
      { id: crypto.randomUUID(), text: "" },
      { id: crypto.randomUUID(), text: "" },
    ],
    correctOptionId: "",
    parentContent: "",
  };
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

/* ================= WRAPPER ================= */

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10">Loading...</div>}>
      <EditQuizPage />
    </Suspense>
  );
}

/* ================= EDIT PAGE ================= */

function EditQuizPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchQuiz = async () => {
      try {
        const res = await fetch(`/api/admin/quizzes?id=${id}`);
        const data: ApiQuizResponse | null = await res.json();

        if (!res.ok) {
          console.error("Failed to load quiz:", data);
          setQuiz(null);
          return;
        }

        if (!data) {
          setQuiz(null);
          return;
        }

        const rawQuestions = safeJSONParse<Question[]>(data.questions, []);
        const mappedQuiz: Quiz = {
          id: data.id,
          name: data.name || data.title || "",
          course_slug: data.course_slug || "demo-course",
          module_id: data.module_id || "MOD_1",
          submodule_id: data.submodule_id ?? null,
          batch_ids: safeJSONParse<string[]>(data.batch_ids, []),
          created_by: data.created_by || "admin",
          time_minutes: data.time_minutes ?? 10,
          passing_percent: data.passing_percent ?? 50,
          questions: normalizeQuestions(rawQuestions.length ? rawQuestions : [createNewQuestion()]),
        };

        setQuiz(mappedQuiz);
        setActiveIdx(0);
      } catch (err) {
        console.error("Fetch error:", err);
        setQuiz(null);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id]);

  const currentQ = useMemo(() => {
    if (!quiz?.questions?.length) return null;
    return quiz.questions[activeIdx] || quiz.questions[0] || null;
  }, [quiz, activeIdx]);

  const updateCurrentQuestion = (updates: Partial<Question>) => {
    setQuiz((prev) => {
      if (!prev || !prev.questions.length) return prev;

      const updatedQuestions = [...prev.questions];
      const current = updatedQuestions[activeIdx];
      if (!current) return prev;

      updatedQuestions[activeIdx] = { ...current, ...updates };

      return {
        ...prev,
        questions: updatedQuestions,
      };
    });
  };

  const handleAddQuestion = () => {
    setQuiz((prev) => {
      if (!prev) return prev;

      const newQuestion = createNewQuestion();
      const nextQuestions = [...prev.questions, newQuestion];
      setActiveIdx(nextQuestions.length - 1);

      return {
        ...prev,
        questions: nextQuestions,
      };
    });
  };

  const handleDeleteQuestion = () => {
    setQuiz((prev) => {
      if (!prev || prev.questions.length <= 1) return prev;

      const filtered = prev.questions.filter((_, i) => i !== activeIdx);
      const nextActive = activeIdx > 0 ? activeIdx - 1 : 0;
      setActiveIdx(nextActive);

      return {
        ...prev,
        questions: filtered,
      };
    });
  };

  const handleSave = async () => {
    if (!quiz) return;

    if (!quiz.name.trim()) {
      alert("Please enter quiz name");
      return;
    }

    if (!quiz.questions.length) {
      alert("Add at least one question");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        id: quiz.id,
        name: quiz.name,
        course_slug: quiz.course_slug,
        module_id: quiz.module_id,
        submodule_id: quiz.submodule_id,
        batch_ids: quiz.batch_ids,
        time_minutes: quiz.time_minutes,
        passing_percent: quiz.passing_percent,
        questions: normalizeQuestions(quiz.questions),
        created_by: quiz.created_by,
      };

      const res = await fetch("/api/admin/quizzes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to save quiz");
        return;
      }

      alert("Quiz Saved Successfully!");
      router.push("/admin");
    } catch (err) {
      console.error(err);
      alert("Something went wrong while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (!quiz || !currentQ) {
    return (
      <div className="p-10 text-center text-slate-500 font-bold">
        Quiz not found
      </div>
    );
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
            <h1 className="text-lg font-bold">Edit Quiz</h1>
            <p className="text-xs text-slate-500">Editing Assessment</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all"
        >
          {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          {isSaving ? "Saving..." : "Save Quiz"}
        </button>
      </header>

      <main className="max-w-[1600px] mx-auto p-8 grid grid-cols-12 gap-8">
        {/* --- LEFT COLUMN: GENERAL INFO --- */}
        <div className="col-span-3 space-y-6">
          <section className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 text-blue-600 mb-6">
              <Layout size={18} />
              <h2 className="font-bold text-sm uppercase tracking-wider">General Info</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Quiz Name</label>
                <input
                  value={quiz.name}
                  onChange={(e) =>
                    setQuiz((prev) => (prev ? { ...prev, name: e.target.value } : prev))
                  }
                  placeholder="e.g. JavaScript Advanced"
                  className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Time (Mins)</label>
                  <input
                    type="number"
                    value={quiz.time_minutes}
                    onChange={(e) =>
                      setQuiz((prev) =>
                        prev ? { ...prev, time_minutes: Number(e.target.value) } : prev
                      )
                    }
                    className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Passing %</label>
                  <input
                    type="number"
                    value={quiz.passing_percent}
                    onChange={(e) =>
                      setQuiz((prev) =>
                        prev ? { ...prev, passing_percent: Number(e.target.value) } : prev
                      )
                    }
                    className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm outline-none"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-600 mb-6">
              <Layers size={18} />
              <h2 className="font-bold text-sm uppercase tracking-wider">Navigator</h2>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {quiz.questions.map((_, i) => (
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
                Question {activeIdx + 1} of {quiz.questions.length}
              </span>

              <button
                onClick={handleDeleteQuestion}
                className="text-slate-300 hover:text-red-500 transition-colors"
                disabled={quiz.questions.length <= 1}
              >
                <Trash size={20} />
              </button>
            </div>

            {/* Type Switcher Toolbar */}
            <div className="flex gap-2 mb-8 p-1 bg-slate-50 rounded-2xl w-fit">
              <TypeBtn
                active={currentQ.type === "MCQ"}
                onClick={() => updateCurrentQuestion({ type: "MCQ" })}
                icon={<Type size={16} />}
                label="MCQ"
              />
              <TypeBtn
                active={currentQ.type === "SHORT"}
                onClick={() => updateCurrentQuestion({ type: "SHORT" })}
                icon={<AlignLeft size={16} />}
                label="Short"
              />
              <TypeBtn
                active={currentQ.type === "COMPREHENSION"}
                onClick={() => updateCurrentQuestion({ type: "COMPREHENSION" })}
                icon={<Layers size={16} />}
                label="Context"
              />
            </div>

            {/* Comprehension: Parent Content Area */}
            {currentQ.type === "COMPREHENSION" && (
              <div className="mb-6 p-6 bg-amber-50 rounded-3xl border border-amber-100">
                <label className="text-[10px] font-black text-amber-600 uppercase mb-2 block">
                  Shared Context / Passage
                </label>
                <textarea
                  value={currentQ.parentContent || ""}
                  onChange={(e) => updateCurrentQuestion({ parentContent: e.target.value })}
                  placeholder="Paste the paragraph or content that applies to this question..."
                  className="w-full bg-transparent border-none focus:ring-0 text-sm italic text-slate-700 resize-none h-24"
                />
              </div>
            )}

            <textarea
              placeholder="Type your question here..."
              value={currentQ.text}
              onChange={(e) => updateCurrentQuestion({ text: e.target.value })}
              className="w-full text-2xl font-bold bg-transparent border-none focus:ring-0 placeholder:text-slate-200 resize-none h-32 mb-8"
            />

            {/* MCQ Options Rendering */}
            {currentQ.type === "MCQ" && (
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                  Multiple Choice Options
                </p>

                {currentQ.options.map((opt, idx) => {
                  const isCorrect = currentQ.correctOptionId === opt.id;

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
                        onClick={() => updateCurrentQuestion({ correctOptionId: opt.id })}
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                          isCorrect ? "bg-emerald-500 text-white" : "bg-slate-50 text-slate-300"
                        }`}
                        type="button"
                      >
                        {String.fromCharCode(65 + idx)}
                      </button>

                      <input
                        value={opt.text}
                        onChange={(e) => {
                          const newOpts = [...currentQ.options];
                          newOpts[idx] = { ...newOpts[idx], text: e.target.value };
                          updateCurrentQuestion({ options: newOpts });
                        }}
                        placeholder={`Option ${idx + 1}...`}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-semibold outline-none"
                      />

                      {isCorrect && <CheckCircle2 size={18} className="text-emerald-500" />}
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={() =>
                    updateCurrentQuestion({
                      options: [...currentQ.options, { id: crypto.randomUUID(), text: "" }],
                    })
                  }
                  className="text-xs font-bold text-blue-600 px-4 py-2 hover:bg-blue-50 rounded-lg transition-all"
                >
                  + Add Option
                </button>
              </div>
            )}

            {/* Short Answer View */}
            {currentQ.type === "SHORT" && (
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
                <span className="text-slate-900">
                  {(100 / quiz.questions.length).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all"
                  style={{ width: `${quiz.passing_percent}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed italic text-center">
                Students must answer at least{" "}
                {Math.ceil((quiz.passing_percent / 100) * quiz.questions.length)} questions correctly
                to pass.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}