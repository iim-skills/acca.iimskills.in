"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Copy,
  Settings,
  CheckCircle2,
  FileText,
  ListOrdered,
  AlignLeft,
  BookOpen,
  Rocket,
  X,
  Type,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ================= TYPES & CONSTANTS ================= */

type QuestionType = "MCQ" | "SHORT" | "LONG" | "PASSAGE";

type QuestionOption = {
  id: string;
  text: string;
};

type PassageSubQuestion = {
  id: string;
  type: "MCQ";
  text: string;
  options: QuestionOption[];
  correctOptionId: string;
  marks: number;
};

type QuestionItem = {
  id: string;
  type: QuestionType;
  text: string;
  marks: number;
  options?: QuestionOption[];
  correctOptionId?: string;
  answer?: string;
  passage?: string;
  passageQuestions?: PassageSubQuestion[];
};

type QuestionTypeConfig = {
  id: QuestionType;
  label: string;
  icon: LucideIcon;
  description: string;
};

const QUESTION_TYPES: QuestionTypeConfig[] = [
  {
    id: "MCQ",
    label: "Multiple Choice",
    icon: ListOrdered,
    description: "Single correct answer from options",
  },
  {
    id: "SHORT",
    label: "Short Answer",
    icon: AlignLeft,
    description: "One or two sentence response",
  },
  {
    id: "LONG",
    label: "Long Answer",
    icon: FileText,
    description: "Detailed paragraph response",
  },
  {
    id: "PASSAGE",
    label: "Passage Base",
    icon: BookOpen,
    description: "Reading text with sub-questions",
  },
];

/* ================= HELPERS ================= */

const generateId = () => Math.random().toString(36).slice(2, 11);

const createMCQ = (): QuestionItem => ({
  id: generateId(),
  type: "MCQ",
  text: "",
  options: [
    { id: generateId(), text: "Option 1" },
    { id: generateId(), text: "Option 2" },
  ],
  correctOptionId: "",
  marks: 1,
});

const createPassageSubQuestion = (): PassageSubQuestion => ({
  id: generateId(),
  type: "MCQ",
  text: "",
  options: [
    { id: generateId(), text: "Option 1" },
    { id: generateId(), text: "Option 2" },
  ],
  correctOptionId: "",
  marks: 1,
});

const createQuestion = (type: QuestionType): QuestionItem => {
  switch (type) {
    case "MCQ":
      return createMCQ();
    case "SHORT":
      return { id: generateId(), type, text: "", answer: "", marks: 1 };
    case "LONG":
      return { id: generateId(), type, text: "", answer: "", marks: 5 };
    case "PASSAGE":
      return {
        id: generateId(),
        type,
        text: "New Reading Comprehension",
        passage: "",
        passageQuestions: [createPassageSubQuestion()],
        marks: 1,
      };
    default:
      return createMCQ();
  }
};

const cloneQuestion = (question: QuestionItem): QuestionItem => ({
  ...question,
  options: question.options ? question.options.map((opt) => ({ ...opt })) : undefined,
  passageQuestions: question.passageQuestions
    ? question.passageQuestions.map((sq) => ({
        ...sq,
        options: sq.options.map((opt) => ({ ...opt })),
      }))
    : undefined,
});

/* ================= UI COMPONENTS ================= */

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;
type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Input = ({ className = "", ...props }: InputProps) => (
  <input
    {...props}
    className={`w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200 ${className}`}
  />
);

const TextArea = ({ className = "", ...props }: TextAreaProps) => (
  <textarea
    {...props}
    className={`w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200 min-h-[100px] resize-none ${className}`}
  />
);

/* ================= MAIN APP ================= */

export default function App() {
  const [quizName, setQuizName] = useState<string>("Untitled Assessment");
  const [questions, setQuestions] = useState<QuestionItem[]>([createMCQ()]);
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  const activeQ = questions[activeIdx] ?? questions[0] ?? createMCQ();

  const replaceActiveQuestion = (newQuestion: QuestionItem) => {
    setQuestions((prev) => {
      if (prev.length === 0) return [newQuestion];
      const next = [...prev];
      next[activeIdx] = newQuestion;
      return next;
    });
  };

  const updateQuestion = (updates: Partial<QuestionItem>) => {
    setQuestions((prev) => {
      if (!prev[activeIdx]) return prev;
      const next = [...prev];
      next[activeIdx] = {
        ...next[activeIdx],
        ...updates,
      };
      return next;
    });
  };

  const addQuestion = (type: QuestionType = "MCQ") => {
    const newQ = createQuestion(type);
    setQuestions((prev) => [...prev, newQ]);
    setActiveIdx(questions.length);
  };

  const deleteQuestion = (index: number) => {
    if (questions.length === 1) return;

    const nextIndex = Math.max(0, index - 1);

    setQuestions((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : [createMCQ()];
    });

    setActiveIdx(nextIndex);
  };

  const duplicateQuestion = (index: number) => {
    const qToCopy = questions[index];
    if (!qToCopy) return;

    const copy = cloneQuestion(qToCopy);
    copy.id = generateId();

    setQuestions((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      return next;
    });
    setActiveIdx(index + 1);
  };

  const updateOption = (optIdx: number, text: string) => {
    setQuestions((prev) => {
      const current = prev[activeIdx];
      if (!current?.options) return prev;

      const next = [...prev];
      const options = current.options.map((opt, idx) =>
        idx === optIdx ? { ...opt, text } : opt
      );

      next[activeIdx] = {
        ...current,
        options,
      };
      return next;
    });
  };

  const addOption = () => {
    setQuestions((prev) => {
      const current = prev[activeIdx];
      if (!current) return prev;

      const next = [...prev];
      const options = [...(current.options ?? []), { id: generateId(), text: "" }];

      next[activeIdx] = {
        ...current,
        options,
      };
      return next;
    });
  };

  const removeOption = (optIdx: number) => {
    setQuestions((prev) => {
      const current = prev[activeIdx];
      if (!current?.options) return prev;

      const next = [...prev];
      const options = current.options.filter((_, i) => i !== optIdx);

      next[activeIdx] = {
        ...current,
        options,
        correctOptionId:
          current.correctOptionId && !options.some((opt) => opt.id === current.correctOptionId)
            ? ""
            : current.correctOptionId,
      };
      return next;
    });
  };

  /* PASSAGE SPECIFIC HANDLERS */
  const addSubQuestion = () => {
    setQuestions((prev) => {
      const current = prev[activeIdx];
      if (!current) return prev;

      const next = [...prev];
      const passageQuestions = [...(current.passageQuestions ?? []), createPassageSubQuestion()];

      next[activeIdx] = {
        ...current,
        passageQuestions,
      };
      return next;
    });
  };

  const updateSubQuestion = (subIdx: number, updates: Partial<PassageSubQuestion>) => {
    setQuestions((prev) => {
      const current = prev[activeIdx];
      if (!current?.passageQuestions) return prev;

      const next = [...prev];
      const passageQuestions = current.passageQuestions.map((sq, idx) =>
        idx === subIdx ? { ...sq, ...updates } : sq
      );

      next[activeIdx] = {
        ...current,
        passageQuestions,
      };
      return next;
    });
  };

  const updateSubOption = (subIdx: number, optIdx: number, text: string) => {
    setQuestions((prev) => {
      const current = prev[activeIdx];
      if (!current?.passageQuestions?.[subIdx]) return prev;

      const next = [...prev];
      const passageQuestions = current.passageQuestions.map((sq, idx) => {
        if (idx !== subIdx) return sq;
        const options = sq.options.map((opt, oIdx) =>
          oIdx === optIdx ? { ...opt, text } : opt
        );
        return { ...sq, options };
      });

      next[activeIdx] = {
        ...current,
        passageQuestions,
      };
      return next;
    });
  };

  const addSubOption = (subIdx: number) => {
    setQuestions((prev) => {
      const current = prev[activeIdx];
      if (!current?.passageQuestions?.[subIdx]) return prev;

      const next = [...prev];
      const passageQuestions = current.passageQuestions.map((sq, idx) => {
        if (idx !== subIdx) return sq;
        return {
          ...sq,
          options: [...sq.options, { id: generateId(), text: "" }],
        };
      });

      next[activeIdx] = {
        ...current,
        passageQuestions,
      };
      return next;
    });
  };



const router = useRouter();

const handlePublish = async () => {
  try {
    setIsPublishing(true);

    const payload = {
      name: quizName,
      questions,
      totalMarks: calculateTotalMarks(),
      totalQuestions: getTotalQuestionCount(),
    };

    // ✅ CALL API
    const res = await fetch("/api/admin/quizzes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.message || "Publish failed");
    }

    // ✅ SAVE FOR PREVIEW (FIXED)
    localStorage.setItem("previewQuiz", JSON.stringify(payload));

    // ✅ REDIRECT
    router.push("/admin/quizzes/preview");

  } catch (err: any) {
    console.error(err);
    alert(err.message || "Something went wrong");
  } finally {
    setIsPublishing(false);
  }
};

  const calculateTotalMarks = () => {
    return questions.reduce((acc, q) => {
      if (q.type === "PASSAGE") {
        return acc + (q.passageQuestions?.reduce((s, sq) => s + (sq.marks || 0), 0) || 0);
      }
      return acc + (q.marks || 0);
    }, 0);
  };

  const getGlobalStartIndex = (idx: number) => {
    let count = 0;

    for (let i = 0; i < idx; i += 1) {
      const current = questions[i];
      if (!current) continue;

      if (current.type === "PASSAGE") {
        count += current.passageQuestions?.length || 0;
      } else {
        count += 1;
      }
    }

    return count + 1;
  };

  const getTotalQuestionCount = () => {
    return questions.reduce((acc, q) => {
      if (q.type === "PASSAGE") return acc + (q.passageQuestions?.length || 0);
      return acc + 1;
    }, 0);
  };

  const globalStartForActive = getGlobalStartIndex(activeIdx);

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden">
      {/* HEADER */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
            <Rocket size={20} />
          </div>
          <div>
            <input
              value={quizName}
              onChange={(e) => setQuizName(e.target.value)}
              className="bg-transparent font-semibold text-lg focus:outline-none border-b border-transparent hover:border-slate-300 focus:border-indigo-500 px-1 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/quizzes/preview" target="_blank"
            className="flex items-center gap-2 px-5 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all font-semibold"
          >
            <span>Quiz Preview</span>
          </Link>
          <button
  type="button"
  onClick={handlePublish}
  disabled={isPublishing}
  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg 
  hover:bg-indigo-700 active:scale-95 transition-all font-semibold shadow-lg shadow-indigo-200 
  disabled:opacity-70 disabled:cursor-not-allowed"
>
  {isPublishing ? (
    <span className="flex items-center gap-2">
      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      Publishing...
    </span>
  ) : (
    <>
      <Rocket size={18} />
      <span>Publish & Preview</span>
    </>
  )}
</button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* LEFT NAVIGATOR */}
        <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-100">
            <div className="relative group">
              <button
                type="button"
                className="w-full flex items-center justify-between bg-indigo-50 text-indigo-700 px-4 py-2.5 rounded-xl font-bold transition-all hover:bg-indigo-100"
                onClick={() => addQuestion("MCQ")}
              >
                <div className="flex items-center gap-2">
                  <Plus size={20} />
                  <span>Add Section</span>
                </div>
                <Settings
                  size={16}
                  className="text-indigo-400 group-hover:rotate-90 transition-transform duration-500"
                />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
            {questions.map((q, i) => {
              const Icon =
                QUESTION_TYPES.find((t) => t.id === q.type)?.icon ?? ListOrdered;
              const isActive = i === activeIdx;
              const qNum = getGlobalStartIndex(i);

              return (
                <div key={q.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => setActiveIdx(i)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                      isActive
                        ? "bg-slate-900 text-white shadow-lg"
                        : "hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <span
                      className={`flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-bold ${
                        isActive
                          ? "bg-indigo-500 text-white"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {q.type === "PASSAGE" ? "P" : qNum}
                    </span>
                    <div className="flex-1 truncate">
                      <p className="text-xs font-bold uppercase tracking-wider opacity-60 flex items-center gap-1">
                        <Icon size={10} />
                        {q.type}
                      </p>
                      <p className="text-sm font-medium truncate">
                        {q.text || <span className="italic opacity-50">Empty...</span>}
                      </p>
                    </div>
                  </button>

                  {!isActive && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteQuestion(i);
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>TOTAL ITEMS</span>
              <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                {getTotalQuestionCount()}
              </span>
            </div>
          </div>
        </aside>

        {/* CENTER EDITOR */}
        <section className="flex-1 bg-[#F8FAFC] p-8 overflow-y-auto custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-6">
            <motion.div
              key={activeQ.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
            >
              {/* Question Context Header */}
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <select
                    value={activeQ.type}
                    onChange={(e) => replaceActiveQuestion(createQuestion(e.target.value as QuestionType))}
                    className="bg-white border border-slate-200 text-sm font-semibold rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {QUESTION_TYPES.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <div className="h-4 w-[1px] bg-slate-300" />
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <span>{activeQ.type === "PASSAGE" ? "Section Marks:" : "Marks:"}</span>
                    <input
                      type="number"
                      disabled={activeQ.type === "PASSAGE"}
                      value={
                        activeQ.type === "PASSAGE"
                          ? activeQ.passageQuestions?.reduce((s, sq) => s + (sq.marks || 0), 0) || 0
                          : activeQ.marks
                      }
                      onChange={(e) => updateQuestion({ marks: Number(e.target.value) })}
                      className={`w-12 border border-slate-200 rounded px-1.5 py-0.5 text-center focus:ring-1 focus:ring-indigo-500 outline-none ${
                        activeQ.type === "PASSAGE"
                          ? "bg-slate-100 text-slate-400"
                          : "bg-white"
                      }`}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => duplicateQuestion(activeIdx)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                    title="Duplicate"
                  >
                    <Copy size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteQuestion(activeIdx)}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Editor Content */}
              <div className="p-8 space-y-8">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Type size={14} />
                    {activeQ.type === "PASSAGE"
                      ? "Passage Section Title"
                      : `Question ${globalStartForActive}`}
                  </label>
                  <TextArea
                    placeholder={
                      activeQ.type === "PASSAGE"
                        ? "Title of the reading section..."
                        : "Type your question here..."
                    }
                    value={activeQ.text}
                    className="text-lg font-medium leading-relaxed min-h-[80px]"
                    onChange={(e) => updateQuestion({ text: e.target.value })}
                  />
                </div>

                {/* MCQ SPECIFIC */}
                {activeQ.type === "MCQ" && (
                  <div className="space-y-4">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      Options
                    </label>
                    <div className="space-y-3">
                      <AnimatePresence>
                        {activeQ.options?.map((opt, i) => (
                          <motion.div
                            key={opt.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex items-center gap-3 group"
                          >
                            <button
                              type="button"
                              onClick={() => updateQuestion({ correctOptionId: opt.id })}
                              className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                activeQ.correctOptionId === opt.id
                                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100"
                                  : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                              }`}
                            >
                              <CheckCircle2 size={20} />
                            </button>
                            <Input
                              value={opt.text}
                              placeholder={`Option ${i + 1}`}
                              onChange={(e) => updateOption(i, e.target.value)}
                              className={
                                activeQ.correctOptionId === opt.id
                                  ? "border-emerald-200 bg-emerald-50/20"
                                  : ""
                              }
                            />
                            <button
                              type="button"
                              onClick={() => removeOption(i)}
                              className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition-all"
                            >
                              <X size={18} />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                    <button
                      type="button"
                      onClick={addOption}
                      className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-all"
                    >
                      <Plus size={18} />
                      <span>Add Choice</span>
                    </button>
                  </div>
                )}

                {/* SHORT / LONG SPECIFIC */}
                {(activeQ.type === "SHORT" || activeQ.type === "LONG") && (
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      Expected Answer Template
                    </label>
                    <TextArea
                      placeholder="Specify what a correct answer should include..."
                      value={activeQ.answer}
                      onChange={(e) => updateQuestion({ answer: e.target.value })}
                    />
                  </div>
                )}

                {/* PASSAGE SPECIFIC */}
                {activeQ.type === "PASSAGE" && (
                  <div className="space-y-10">
                    <div className="space-y-4">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                        Passage Content (Readable Text)
                      </label>
                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-inner bg-white">
                        <div className="flex items-center gap-2 p-2 border-b border-slate-200 bg-slate-50/50">
                          <div className="flex p-1 rounded bg-white border border-slate-200 gap-1">
                            <button type="button" className="p-1 px-2 text-xs font-bold hover:bg-slate-100 rounded">
                              B
                            </button>
                            <button type="button" className="p-1 px-2 text-xs italic hover:bg-slate-100 rounded">
                              I
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold ml-2 tracking-widest uppercase">
                            Reading Text
                          </span>
                        </div>
                        <textarea
                          className="w-full p-8 min-h-[250px] bg-transparent focus:outline-none text-slate-700 leading-loose font-serif text-lg"
                          placeholder="Type or paste the readable passage here..."
                          value={activeQ.passage}
                          onChange={(e) => updateQuestion({ passage: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                          Linked Questions
                        </label>
                        <button
                          type="button"
                          onClick={addSubQuestion}
                          className="text-xs font-bold bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-1.5 shadow-md shadow-indigo-100"
                        >
                          <Plus size={14} /> Add Linked Question
                        </button>
                      </div>

                      <div className="space-y-8">
                        {activeQ.passageQuestions?.map((sq, sqIdx) => (
                          <div
                            key={sq.id}
                            className="relative p-6 bg-slate-50/50 rounded-2xl border border-slate-200 group"
                          >
                            <div className="absolute -left-3 top-6 w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center text-xs font-black shadow-lg">
                              {globalStartForActive + sqIdx}
                            </div>

                            <div className="flex items-start justify-between gap-4 mb-4">
                              <div className="flex-1 space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">
                                  Question Text
                                </label>
                                <Input
                                  value={sq.text}
                                  placeholder="Enter the question related to the passage..."
                                  onChange={(e) =>
                                    updateSubQuestion(sqIdx, { text: e.target.value })
                                  }
                                  className="font-medium bg-white"
                                />
                              </div>
                              <div className="w-20 space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">
                                  Marks
                                </label>
                                <Input
                                  type="number"
                                  value={sq.marks}
                                  onChange={(e) =>
                                    updateSubQuestion(sqIdx, { marks: Number(e.target.value) })
                                  }
                                  className="text-center bg-white font-bold"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4 border-l-2 border-indigo-100">
                              {sq.options?.map((opt, optIdx) => (
                                <div key={opt.id} className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setQuestions((prev) => {
                                        const current = prev[activeIdx];
                                        if (!current?.passageQuestions?.[sqIdx]) return prev;

                                        const next = [...prev];
                                        const passageQuestions = current.passageQuestions.map((item, idx) =>
                                          idx === sqIdx
                                            ? { ...item, correctOptionId: opt.id }
                                            : item
                                        );

                                        next[activeIdx] = {
                                          ...current,
                                          passageQuestions,
                                        };
                                        return next;
                                      });
                                    }}
                                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                                      sq.correctOptionId === opt.id
                                        ? "bg-indigo-600 border-indigo-600"
                                        : "bg-white border-slate-300"
                                    }`}
                                  >
                                    {sq.correctOptionId === opt.id && (
                                      <div className="w-2 h-2 bg-white rounded-full" />
                                    )}
                                  </button>
                                  <input
                                    value={opt.text}
                                    placeholder={`Option ${optIdx + 1}`}
                                    onChange={(e) =>
                                      updateSubOption(sqIdx, optIdx, e.target.value)
                                    }
                                    className="bg-transparent text-sm border-b border-transparent hover:border-slate-300 focus:border-indigo-400 focus:outline-none py-1 flex-1"
                                  />
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => addSubOption(sqIdx)}
                                className="text-[10px] font-bold text-indigo-500 hover:underline text-left mt-1"
                              >
                                + Add Option
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setQuestions((prev) => {
                                  const current = prev[activeIdx];
                                  if (!current?.passageQuestions) return prev;

                                  const next = [...prev];
                                  const passageQuestions = current.passageQuestions.filter(
                                    (_, idx) => idx !== sqIdx
                                  );

                                  next[activeIdx] = {
                                    ...current,
                                    passageQuestions,
                                  };
                                  return next;
                                });
                              }}
                              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* QUICK PREVIEW CARD */}
            <div className="bg-white/50 backdrop-blur-sm p-8 rounded-2xl border border-slate-200 border-dashed">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">
                Final Candidate View
              </h4>
              <div className="space-y-6">
                {activeQ.type === "PASSAGE" ? (
                  <div className="space-y-8">
                    <div className="prose prose-slate max-w-none">
                      <h2 className="text-2xl font-bold text-slate-900 border-l-4 border-indigo-500 pl-4 mb-4">
                        {activeQ.text || "Untitled Reading Section"}
                      </h2>
                      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 font-serif text-lg leading-loose text-slate-800 whitespace-pre-wrap italic">
                        {activeQ.passage || "Reading text will appear here..."}
                      </div>
                    </div>

                    <div className="space-y-8 mt-10">
                      {activeQ.passageQuestions?.map((sq, i) => (
                        <div key={sq.id} className="space-y-4">
                          <p className="font-bold text-slate-900">
                            {globalStartForActive + i}. {sq.text || "Question text..."}
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            {sq.options?.map((o, idx) => (
                              <div
                                key={o.id}
                                className="p-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 flex items-center gap-2 shadow-sm"
                              >
                                <span className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center text-[10px] font-bold">
                                  {String.fromCharCode(65 + idx)}
                                </span>
                                {o.text || "Option"}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xl font-semibold text-slate-900 leading-snug">
                      {globalStartForActive}. {activeQ.text || "Question preview will appear here..."}
                    </p>
                    {activeQ.type === "MCQ" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {activeQ.options?.map((o, idx) => (
                          <div
                            key={o.id}
                            className="p-4 bg-white border border-slate-200 rounded-xl flex items-center gap-3 shadow-sm"
                          >
                            <div className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400">
                              {String.fromCharCode(65 + idx)}
                            </div>
                            <span className="text-sm text-slate-600 font-medium">
                              {o.text || `Option ${idx + 1}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {(activeQ.type === "SHORT" || activeQ.type === "LONG") && (
                      <div className="w-full h-12 bg-slate-100 rounded-lg border-b-2 border-slate-200" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT PROPERTY PANEL */}
        <aside className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0">
          <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
            <section>
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Settings size={16} className="text-slate-400" />
                Global Controls
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500">
                    Quick Add Section
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {QUESTION_TYPES.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => addQuestion(type.id)}
                        className="p-2 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-50 hover:border-indigo-300 transition-all flex items-center gap-2"
                      >
                        <type.icon size={12} className="text-indigo-500" />
                        {type.id}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  <span className="text-xs font-bold text-indigo-900">Shuffle Quiz</span>
                  <div className="w-10 h-5 bg-indigo-600 rounded-full relative cursor-pointer">
                    <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-slate-900 rounded-2xl p-5 text-white shadow-xl shadow-slate-200 relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-sm font-bold opacity-60 mb-2">Quiz Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-medium opacity-50">Total Marks</span>
                    <span className="text-2xl font-black">{calculateTotalMarks()}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-medium opacity-50">Global Qs Count</span>
                    <span className="text-lg font-bold">{getTotalQuestionCount()}</span>
                  </div>
                  <div className="pt-3 border-t border-white/10">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                      <CheckCircle2 size={12} />
                      Syncing...
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl" />
            </section>
          </div>
        </aside>
      </main>

      {/* FOOTER STATS */}
      <footer className="h-8 bg-slate-100 border-t border-slate-200 px-4 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <div className="flex gap-4">
          <span>v2.6.0 Build</span>
          <span>Status: Question Continuity Applied</span>
        </div>
        <div className="flex gap-4">
          <span className="text-indigo-500 underline cursor-pointer">Export Data</span>
          <span>Latency: 14ms</span>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #CBD5E1;
        }
      `}} />
    </div>
  );
}
