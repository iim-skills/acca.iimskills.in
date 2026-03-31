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
  BookOpen,
  X,
} from "lucide-react";

export const dynamic = "force-dynamic";

/* ================= TYPES ================= */

type QType = "MCQ" | "SHORT" | "LONG" | "PASSAGE";

type Option = {
  id: string;
  text: string;
};

type Question = {
  id: string;
  type: QType;
  text: string;
  options?: Option[];
  correctOptionId?: string;
  answer?: string;
  marks?: number;
  passage?: string;
  passageQuestions?: Question[];
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

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 11);
}

function createNewQuestion(type: QType = "MCQ"): Question {
  if (type === "SHORT") {
    return {
      id: makeId(),
      type,
      text: "",
      answer: "",
      marks: 1,
    };
  }

  if (type === "LONG") {
    return {
      id: makeId(),
      type,
      text: "",
      answer: "",
      marks: 5,
    };
  }

  if (type === "PASSAGE") {
    return {
      id: makeId(),
      type,
      text: "New Reading Comprehension",
      passage: "",
      passageQuestions: [createNewQuestion("MCQ")],
      marks: 1,
    };
  }

  return {
    id: makeId(),
    type: "MCQ",
    text: "",
    options: [
      { id: makeId(), text: "Option 1" },
      { id: makeId(), text: "Option 2" },
    ],
    correctOptionId: "",
    marks: 1,
  };
}

function normalizeQuestion(input: any, index: number): Question {
  const rawType = input?.type === "COMPREHENSION" ? "PASSAGE" : input?.type;
  const type: QType = rawType || "MCQ";
  const id = input?.id || `q-${Date.now()}-${index}`;

  const base: Question = {
    id,
    type,
    text: input?.text ?? "",
    marks: typeof input?.marks === "number" ? input.marks : type === "LONG" ? 5 : 1,
  };

  if (type === "MCQ") {
    const options = Array.isArray(input?.options) && input.options.length > 0
      ? input.options.map((opt: any, i: number) => ({
          id: opt?.id || `${id}-opt-${i}`,
          text: opt?.text ?? "",
        }))
      : [
          { id: `${id}-opt-0`, text: "Option 1" },
          { id: `${id}-opt-1`, text: "Option 2" },
        ];

    return {
      ...base,
      options,
      correctOptionId: input?.correctOptionId || input?.correctOption || "",
    };
  }

  if (type === "SHORT") {
    return {
      ...base,
      answer: input?.answer ?? "",
    };
  }

  if (type === "LONG") {
    return {
      ...base,
      answer: input?.answer ?? "",
    };
  }

  const passageQuestions = Array.isArray(input?.passageQuestions)
    ? input.passageQuestions.map((sq: any, i: number) => normalizeQuestion({ ...sq, type: "MCQ" }, i))
    : [];

  return {
    ...base,
    passage: input?.passage ?? input?.parentContent ?? "",
    passageQuestions: passageQuestions.length > 0 ? passageQuestions : [createNewQuestion("MCQ")],
  };
}

function normalizeQuestions(questions: any[]) {
  return (questions || []).map((q, index) => normalizeQuestion(q, index));
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
      type="button"
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

        if (!res.ok || !data) {
          console.error("Failed to load quiz:", data);
          setQuiz(null);
          return;
        }

        const rawQuestions = safeJSONParse<any[]>(data.questions, []);

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

  const handleChangeType = (type: QType) => {
    setQuiz((prev) => {
      if (!prev || !prev.questions.length) return prev;

      const updatedQuestions = [...prev.questions];
      const current = updatedQuestions[activeIdx];
      if (!current) return prev;

      const nextQ = createNewQuestion(type);
      nextQ.id = current.id;
      nextQ.text = current.text || nextQ.text;

      if (type === "MCQ") {
        nextQ.options = current.options?.length ? current.options : nextQ.options;
        nextQ.correctOptionId = current.correctOptionId || "";
        nextQ.marks = current.marks ?? 1;
      }

      if (type === "SHORT" || type === "LONG") {
        nextQ.answer = current.answer || "";
        nextQ.marks = current.marks ?? (type === "LONG" ? 5 : 1);
      }

      if (type === "PASSAGE") {
        nextQ.passage = current.passage || "";
        nextQ.passageQuestions =
          current.passageQuestions?.length ? current.passageQuestions : [createNewQuestion("MCQ")];
        nextQ.marks = current.marks ?? 1;
      }

      updatedQuestions[activeIdx] = nextQ;

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

  const handleAddOption = () => {
    if (!currentQ || currentQ.type !== "MCQ") return;

    const nextOptions = [
      ...(currentQ.options || []),
      { id: makeId(), text: "" },
    ];

    updateCurrentQuestion({ options: nextOptions });
  };

  const handleRemoveOption = (optIdx: number) => {
    if (!currentQ || currentQ.type !== "MCQ") return;
    const nextOptions = (currentQ.options || []).filter((_, i) => i !== optIdx);

    const nextCorrect =
      currentQ.correctOptionId &&
      nextOptions.some((opt) => opt.id === currentQ.correctOptionId)
        ? currentQ.correctOptionId
        : "";

    updateCurrentQuestion({
      options: nextOptions,
      correctOptionId: nextCorrect,
    });
  };

  const handleAddSubQuestion = () => {
    if (!currentQ || currentQ.type !== "PASSAGE") return;

    const nextSubQuestions = [
      ...(currentQ.passageQuestions || []),
      createNewQuestion("MCQ"),
    ];

    updateCurrentQuestion({ passageQuestions: nextSubQuestions });
  };

  const handleRemoveSubQuestion = (subIdx: number) => {
    if (!currentQ || currentQ.type !== "PASSAGE") return;

    const nextSubQuestions = (currentQ.passageQuestions || []).filter((_, i) => i !== subIdx);
    updateCurrentQuestion({
      passageQuestions: nextSubQuestions.length ? nextSubQuestions : [createNewQuestion("MCQ")],
    });
  };

  const handleUpdateSubQuestion = (subIdx: number, updates: Partial<Question>) => {
    if (!currentQ || currentQ.type !== "PASSAGE") return;

    const nextSubQuestions = [...(currentQ.passageQuestions || [])];
    nextSubQuestions[subIdx] = { ...nextSubQuestions[subIdx], ...updates };
    updateCurrentQuestion({ passageQuestions: nextSubQuestions });
  };

  const handleUpdateSubOption = (subIdx: number, optIdx: number, text: string) => {
    if (!currentQ || currentQ.type !== "PASSAGE") return;

    const nextSubQuestions = [...(currentQ.passageQuestions || [])];
    const nextOptions = [...(nextSubQuestions[subIdx].options || [])];
    nextOptions[optIdx] = { ...nextOptions[optIdx], text };
    nextSubQuestions[subIdx] = { ...nextSubQuestions[subIdx], options: nextOptions };

    updateCurrentQuestion({ passageQuestions: nextSubQuestions });
  };

  const handleAddSubOption = (subIdx: number) => {
    if (!currentQ || currentQ.type !== "PASSAGE") return;

    const nextSubQuestions = [...(currentQ.passageQuestions || [])];
    const nextOptions = [...(nextSubQuestions[subIdx].options || [])];
    nextOptions.push({ id: makeId(), text: "" });
    nextSubQuestions[subIdx] = { ...nextSubQuestions[subIdx], options: nextOptions };

    updateCurrentQuestion({ passageQuestions: nextSubQuestions });
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
      router.push("/admin/quizzes");
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
            type="button"
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
          type="button"
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
                  type="button"
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={handleAddQuestion}
                className="h-10 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 flex items-center justify-center hover:bg-slate-50 transition-all"
                type="button"
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
                type="button"
              >
                <Trash size={20} />
              </button>
            </div>

            {/* Type Switcher Toolbar */}
            <div className="flex gap-2 mb-8 p-1 bg-slate-50 rounded-2xl w-fit">
              <TypeBtn
                active={currentQ.type === "MCQ"}
                onClick={() => handleChangeType("MCQ")}
                icon={<Type size={16} />}
                label="MCQ"
              />
              <TypeBtn
                active={currentQ.type === "SHORT"}
                onClick={() => handleChangeType("SHORT")}
                icon={<AlignLeft size={16} />}
                label="Short"
              />
              <TypeBtn
                active={currentQ.type === "LONG"}
                onClick={() => handleChangeType("LONG")}
                icon={<Layers size={16} />}
                label="Long"
              />
              <TypeBtn
                active={currentQ.type === "PASSAGE"}
                onClick={() => handleChangeType("PASSAGE")}
                icon={<BookOpen size={16} />}
                label="Passage"
              />
            </div>

            {/* PASSAGE */}
            {currentQ.type === "PASSAGE" && (
              <div className="mb-8 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">
                  Passage Content
                </label>
                <textarea
                  value={currentQ.passage || ""}
                  onChange={(e) => updateCurrentQuestion({ passage: e.target.value })}
                  placeholder="Paste the passage content here..."
                  className="w-full bg-transparent border-none focus:ring-0 text-sm text-slate-700 resize-none h-32"
                />

                <div className="mt-6 border-t border-slate-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      Linked Questions
                    </h3>
                    <button
                      onClick={handleAddSubQuestion}
                      type="button"
                      className="text-xs font-bold bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-all flex items-center gap-1.5"
                    >
                      <Plus size={14} /> Add Linked Question
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(currentQ.passageQuestions || []).map((sq, sqIdx) => (
                      <div key={sq.id} className="relative p-4 bg-white rounded-2xl border border-slate-200">
                        <button
                          onClick={() => handleRemoveSubQuestion(sqIdx)}
                          className="absolute top-3 right-3 text-slate-300 hover:text-red-500 transition-all"
                          type="button"
                        >
                          <Trash2 size={16} />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                          <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Question Text</label>
                            <input
                              value={sq.text}
                              placeholder="Enter the question related to the passage..."
                              onChange={(e) => handleUpdateSubQuestion(sqIdx, { text: e.target.value })}
                              className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Marks</label>
                            <input
                              type="number"
                              value={sq.marks ?? 1}
                              onChange={(e) =>
                                handleUpdateSubQuestion(sqIdx, { marks: Number(e.target.value) })
                              }
                              className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4 border-l-2 border-indigo-100">
                          {(sq.options || []).map((opt, optIdx) => {
                            const isCorrect = sq.correctOptionId === opt.id;

                            return (
                              <div key={opt.id} className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    const nextSubs = [...(currentQ.passageQuestions || [])];
                                    nextSubs[sqIdx] = {
                                      ...nextSubs[sqIdx],
                                      correctOptionId: opt.id,
                                    };
                                    updateCurrentQuestion({ passageQuestions: nextSubs });
                                  }}
                                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                                    isCorrect
                                      ? "bg-indigo-600 border-indigo-600"
                                      : "bg-white border-slate-300"
                                  }`}
                                  type="button"
                                >
                                  {isCorrect && <div className="w-2 h-2 bg-white rounded-full" />}
                                </button>

                                <input
                                  value={opt.text}
                                  placeholder={`Option ${optIdx + 1}`}
                                  onChange={(e) => handleUpdateSubOption(sqIdx, optIdx, e.target.value)}
                                  className="bg-transparent text-sm border-b border-transparent hover:border-slate-300 focus:border-indigo-400 focus:outline-none py-1 flex-1"
                                />

                                {isCorrect && (
                                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                                )}
                              </div>
                            );
                          })}

                          <button
                            onClick={() => handleAddSubOption(sqIdx)}
                            type="button"
                            className="text-[10px] font-bold text-indigo-500 hover:underline text-left mt-1"
                          >
                            + Add Option
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* QUESTION TEXT */}
            {currentQ.type !== "PASSAGE" && (
              <textarea
                placeholder="Type your question here..."
                value={currentQ.text}
                onChange={(e) => updateCurrentQuestion({ text: e.target.value })}
                className="w-full text-2xl font-bold bg-transparent border-none focus:ring-0 placeholder:text-slate-200 resize-none h-32 mb-8"
              />
            )}

            {/* MCQ OPTIONS */}
            {currentQ.type === "MCQ" && (
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                  Multiple Choice Options
                </p>

                {(currentQ.options || []).map((opt, idx) => {
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
                          const nextOptions = [...(currentQ.options || [])];
                          nextOptions[idx] = { ...nextOptions[idx], text: e.target.value };
                          updateCurrentQuestion({ options: nextOptions });
                        }}
                        placeholder={`Option ${idx + 1}...`}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-semibold outline-none"
                      />

                      <button
                        onClick={() => handleRemoveOption(idx)}
                        type="button"
                        className="text-slate-300 hover:text-red-500 transition-colors"
                        title="Remove option"
                      >
                        <X size={16} />
                      </button>

                      {isCorrect && <CheckCircle2 size={18} className="text-emerald-500" />}
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-xs font-bold text-blue-600 px-4 py-2 hover:bg-blue-50 rounded-lg transition-all"
                >
                  + Add Option
                </button>
              </div>
            )}

            {/* SHORT / LONG */}
            {(currentQ.type === "SHORT" || currentQ.type === "LONG") && (
              <div className="mt-6 space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Expected Answer Template
                </label>
                <textarea
                  placeholder="Specify what a correct answer should include..."
                  value={currentQ.answer || ""}
                  onChange={(e) => updateCurrentQuestion({ answer: e.target.value })}
                  className="w-full border border-slate-200 rounded-2xl p-4 min-h-[120px] outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
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
                  Use “Passage” for reading comprehension questions.
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