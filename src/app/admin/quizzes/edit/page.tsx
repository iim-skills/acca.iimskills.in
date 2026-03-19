"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  ArrowLeft,
  Save,
  Target,
  Layout,
  Layers,
  Info,
  CheckCircle2,
  AlignLeft,
  Trash2,
} from "lucide-react";

/* ================= TYPES ================= */

type Question = {
  id: string;
  text: string;
  type: string;
  options: { id: string; text: string }[];
  correctOption?: string;
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
      text: q.text ?? "",
      type: q.type || "MCQ",
      options,
      correctOption: q.correctOption || "",
      parentContent: q.parentContent || null,
    };
  });
}

/* ================= PAGE ================= */

export default function EditQuizPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  /* ================= FETCH QUIZ ================= */
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
          return;
        }

        if (!data) return;

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
          questions: safeJSONParse<Question[]>(data.questions, []),
        };

        setQuiz(mappedQuiz);
        setActiveIdx(0);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id]);

  /* ================= UPDATE HANDLERS ================= */

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

  const handleSetCorrect = (optionId: string) => {
    updateCurrentQuestion({ correctOption: optionId });
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
        headers: {
          "Content-Type": "application/json",
        },
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

  const currentQ = useMemo(() => {
    if (!quiz?.questions?.length) return null;
    return quiz.questions[activeIdx] || quiz.questions[0] || null;
  }, [quiz, activeIdx]);

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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* --- TOP BAR --- */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Quiz Studio</h1>
            <p className="text-xs text-slate-400 font-medium">
              Drafting: {quiz.name}
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-100"
        >
          {isSaving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          Save Changes
        </button>
      </header>

      <main className="max-w-[1600px] mx-auto p-8 grid grid-cols-12 gap-8">
        {/* --- LEFT: NAVIGATOR & SETTINGS --- */}
        <div className="col-span-3 space-y-6">
          <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-blue-600 mb-2 font-bold text-xs uppercase tracking-widest">
              <Layout size={16} />
              Config
            </div>
            <div className="space-y-4">
              <input
                value={quiz.name}
                onChange={(e) =>
                  setQuiz({
                    ...quiz,
                    name: e.target.value,
                  })
                }
                className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={quiz.time_minutes}
                  onChange={(e) =>
                    setQuiz({
                      ...quiz,
                      time_minutes: Number(e.target.value),
                    })
                  }
                  className="p-3 bg-slate-50 border-none rounded-xl text-xs font-bold"
                />
                <input
                  type="number"
                  value={quiz.passing_percent}
                  onChange={(e) =>
                    setQuiz({
                      ...quiz,
                      passing_percent: Number(e.target.value),
                    })
                  }
                  className="p-3 bg-slate-50 border-none rounded-xl text-xs font-bold"
                />
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-600 mb-6 font-bold text-xs uppercase tracking-widest">
              <Layers size={16} />
              Navigator
            </div>
            <div className="grid grid-cols-4 gap-2">
              {quiz.questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  className={`h-11 rounded-xl font-bold text-xs transition-all ${
                    activeIdx === i
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* --- CENTER: EDITING CANVAS --- */}
        <div className="col-span-6">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 min-h-[600px]">
            <div className="flex justify-between items-center mb-10">
              <span className="px-4 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                Question {activeIdx + 1}
              </span>
              <button
                onClick={handleDeleteQuestion}
                className="text-slate-300 hover:text-red-500 transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>

            <textarea
              value={currentQ.text}
              onChange={(e) => updateCurrentQuestion({ text: e.target.value })}
              className="w-full text-2xl font-bold bg-transparent border-none focus:ring-0 placeholder:text-slate-200 min-h-[100px] mb-8 resize-none"
              placeholder="Enter your question prompt..."
            />

            {currentQ.type === "MCQ" && (
              <div className="space-y-3">
                {currentQ.options?.map((opt, idx) => {
                  const isCorrect = currentQ.correctOption === opt.id;
                  return (
                    <div
                      key={opt.id}
                      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                        isCorrect
                          ? "bg-emerald-50 border-emerald-200 shadow-sm"
                          : "bg-slate-50 border-transparent hover:bg-white"
                      }`}
                    >
                      <button
                        onClick={() => handleSetCorrect(opt.id)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                          isCorrect
                            ? "bg-emerald-500 text-white"
                            : "bg-white text-slate-300 shadow-sm hover:text-blue-500"
                        }`}
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
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-semibold text-slate-700"
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      />
                      {isCorrect && (
                        <CheckCircle2
                          size={18}
                          className="text-emerald-500 animate-in zoom-in"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {currentQ.type === "SHORT" && (
              <div className="mt-10 p-12 border-2 border-dashed border-slate-100 rounded-[2rem] text-center bg-slate-50/50">
                <AlignLeft className="mx-auto text-slate-200 mb-4" size={40} />
                <p className="text-slate-400 text-sm font-medium">
                  Short answer input will appear here for students.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* --- RIGHT: INSIGHTS --- */}
        <div className="col-span-3 space-y-6">
          <div className="bg-[#0F172A] text-white p-8 rounded-[2.5rem] shadow-xl">
            <Info className="text-blue-400 mb-4" size={24} />
            <h3 className="font-bold text-lg mb-2">Editor Instructions</h3>
            <ul className="text-[11px] text-slate-400 space-y-4 leading-relaxed font-medium">
              <li className="flex gap-2">
                <span>1.</span> Select the A, B, C, D circles to mark the
                correct answer.
              </li>
              <li className="flex gap-2">
                <span>2.</span> Text changes are held in memory; click Save
                Changes to commit to the database.
              </li>
              <li className="flex gap-2">
                <span>3.</span> Use the Trash icon to remove unwanted questions.
              </li>
            </ul>
          </div>

          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="font-bold text-[10px] uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <Target size={14} className="text-blue-500" /> Scoring Breakdown
            </h3>
            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase mb-2">
              <span>Value per Q</span>
              <span className="text-slate-900">
                {(100 / quiz.questions.length).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-700"
                style={{ width: `${quiz.passing_percent}%` }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}