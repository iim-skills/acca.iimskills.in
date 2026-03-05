"use client";

import React, { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Filter,
  Loader2,
  ArrowRight,
  X,
  Edit,
  Trash,
  MoreVertical,
} from "lucide-react";

/**
 * QuizManagement.tsx
 *
 * Replaces your BatchManagement page with a Quiz Management / Quiz Creator page.
 * - Lists existing quizzes (GET /api/admin/quizzes)
 * - Create New Quiz button opens a modal
 * - Module selection (button grid) — fetched from /api/admin/modules
 * - Submodule auto-updates when a module is selected
 * - Add MCQ/Text questions in the modal, select correct answer for MCQ
 * - Save quiz to POST /api/admin/quizzes (submodule_id included)
 *
 * Drop into your admin pages (replace BatchManagement).
 */

type Submodule = {
  id: string;
  name: string;
};

type ModuleItem = {
  id: string;
  name: string;
  submodules: Submodule[];
};

type QuizRow = {
  id: number | string;
  title: string;
  submodule_id?: number | string | null;
  total_questions?: number;
  time_limit_minutes?: number | null;
  passing_percent?: number | null;
  created_at?: string;
  module_name?: string; // optional derived display fields
  submodule_name?: string;
};

type QuestionType = "mcq" | "text";

type Option = { id: string; text: string };

type Question = {
  id: string;
  question: string;
  type: QuestionType;
  marks: number;
  options: Option[];
  correctAnswer: string;
};

export default function QuizManagement() {
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [fetching, setFetching] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Modal / Create
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Modules & Submodules
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [selectedSubmoduleId, setSelectedSubmoduleId] = useState<string>("");
  const [submodules, setSubmodules] = useState<Submodule[]>([]);

  // Quiz form state
  const [title, setTitle] = useState("");
  const [timeLimit, setTimeLimit] = useState<number | "">("");
  const [passingPercent, setPassingPercent] = useState<number | "">("");

  // Questions state
  const [questions, setQuestions] = useState<Question[]>([]);

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadQuizzes();
    loadModules();
  }, []);

  // load quizzes
  const loadQuizzes = async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/admin/quizzes");
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to fetch quizzes");
      }
      const data = await res.json();
      // Expect data.quizzes or data array
      const list: any[] = data.quizzes ?? data;
      // Optionally map module/submodule names if API returns them; otherwise leave as-is
      setQuizzes(
        list.map((q) => ({
          id: q.id,
          title: q.title ?? q.name ?? "",
          submodule_id: q.submodule_id ?? q.submoduleId ?? null,
          total_questions: q.total_questions ?? q.totalQuestions ?? 0,
          time_limit_minutes: q.time_limit_minutes ?? q.timeLimitMinutes ?? null,
          passing_percent: q.passing_percent ?? q.passingPercent ?? null,
          created_at: q.created_at ?? q.createdAt ?? null,
          module_name: q.module_name ?? q.moduleName,
          submodule_name: q.submodule_name ?? q.submoduleName,
        }))
      );
    } catch (err: any) {
      console.error("LOAD QUIZZES ERROR:", err);
      alert("Failed to load quizzes. See console.");
    } finally {
      setFetching(false);
    }
  };

  // load modules + submodules
  const loadModules = async () => {
    try {
      const res = await fetch("/api/admin/modules");
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to fetch modules");
      }
      const data: ModuleItem[] = await res.json();
      setModules(data || []);
    } catch (err) {
      console.error("LOAD MODULES ERROR:", err);
    }
  };

  // when selectedModuleId changes, update submodules
  useEffect(() => {
    const m = modules.find((x) => x.id === selectedModuleId);
    if (m) {
      setSubmodules(m.submodules ?? []);
    } else {
      setSubmodules([]);
    }
    setSelectedSubmoduleId("");
  }, [selectedModuleId, modules]);

  // QUESTION helpers
  const addQuestion = (type: QuestionType) => {
    const q: Question = {
      id: crypto.randomUUID(),
      question: "",
      type,
      marks: 1,
      options: type === "mcq" ? [{ id: crypto.randomUUID(), text: "" }, { id: crypto.randomUUID(), text: "" }] : [],
      correctAnswer: "",
    };
    setQuestions((p) => [...p, q]);
  };

  const updateQuestionField = (questionId: string, field: keyof Question, value: any) => {
    setQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, [field]: value } : q)));
  };

  const updateOptionText = (questionId: string, optionId: string, text: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId ? { ...q, options: q.options.map((o) => (o.id === optionId ? { ...o, text } : o)) } : q
      )
    );
  };

  const addOptionToQuestion = (questionId: string) => {
    setQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, options: [...q.options, { id: crypto.randomUUID(), text: "" }] } : q)));
  };

  const removeQuestion = (questionId: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  // create quiz
  const handleCreateQuiz = async () => {
    if (!title.trim()) return alert("Quiz title is required");
    if (!selectedModuleId) return alert("Select a module");
    if (!selectedSubmoduleId) return alert("Select a submodule");

    if (questions.length === 0) return alert("Add at least one question");

    setCreating(true);

    // Prepare payload matching API in previous messages:
    const payload = {
      title,
      description: null,
      timeLimitMinutes: timeLimit === "" ? null : Number(timeLimit),
      passingPercent: passingPercent === "" ? null : Number(passingPercent),
      submoduleId: selectedSubmoduleId,
      negativeMarking: false,
      questions: questions.map((q) => {
        if (q.type === "mcq") {
          return {
            question: q.question,
            type: q.type,
            marks: q.marks,
            options: q.options.map((o) => ({ text: o.text })),
            correctIndex: q.options.findIndex((o) => o.id === q.correctAnswer),
          };
        }
        return {
          question: q.question,
          type: q.type,
          marks: q.marks,
        };
      }),
    };

    try {
      const res = await fetch("/api/admin/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("CREATE QUIZ ERR:", data);
        throw new Error(data?.error || "Failed to create quiz");
      }
      alert("Quiz created successfully");
      // reset form
      setTitle("");
      setTimeLimit("");
      setPassingPercent("");
      setSelectedModuleId("");
      setSelectedSubmoduleId("");
      setQuestions([]);
      setIsModalOpen(false);
      // reload list
      await loadQuizzes();
    } catch (err) {
      console.error("CREATE QUIZ ERROR:", err);
      alert("Failed to create quiz. Check console.");
    } finally {
      setCreating(false);
    }
  };

  // delete quiz
  const handleDeleteQuiz = async (id: number | string) => {
    if (!confirm("Delete this quiz? This cannot be undone.")) return;
    try {
      setActionLoadingId(String(id));
      const res = await fetch(`/api/admin/quizzes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Delete failed");
      }
      await loadQuizzes();
    } catch (err) {
      console.error("DELETE QUIZ ERROR:", err);
      alert("Failed to delete quiz");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered quizzes
  const visibleQuizzes = quizzes.filter((q) => {
    if (!searchTerm.trim()) return true;
    const s = searchTerm.toLowerCase();
    return (q.title || "").toLowerCase().includes(s) || (q.module_name || "").toLowerCase().includes(s) || (q.submodule_name || "").toLowerCase().includes(s);
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-12 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quiz Management</h1>
          <p className="text-slate-500 text-sm">Create quizzes and link them to submodules.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search quizzes..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/10 outline-none w-64 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-all text-sm">
            <Filter size={16} /> Filters
          </button>

          <button
            onClick={() => {
              // open modal for create; reset form
              setTitle("");
              setTimeLimit("");
              setPassingPercent("");
              setSelectedModuleId("");
              setSelectedSubmoduleId("");
              setQuestions([]);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 text-sm"
          >
            <Plus size={18} /> Create New Quiz
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-w-6xl mx-auto mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Quiz</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Module / Submodule</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Questions</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Time</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Manage</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {fetching ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <Loader2 className="animate-spin mx-auto text-indigo-500" size={32} />
                  </td>
                </tr>
              ) : visibleQuizzes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center text-slate-400">
                    No quizzes yet. Create one to get started.
                  </td>
                </tr>
              ) : (
                visibleQuizzes.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/40 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="font-extrabold text-slate-900">{q.title}</div>
                      <div className="text-xs text-slate-400 mt-1">{q.created_at ? new Date(q.created_at).toLocaleDateString() : ""}</div>
                    </td>

                    <td className="px-8 py-6">
                      <div className="text-sm font-semibold">{q.module_name ?? "-"}</div>
                      <div className="text-xs text-slate-400 mt-1">{q.submodule_name ?? "-"}</div>
                    </td>

                    <td className="px-8 py-6">
                      <div className="text-sm font-black">{q.total_questions ?? 0}</div>
                    </td>

                    <td className="px-8 py-6">
                      <div className="text-sm font-semibold">{q.time_limit_minutes ?? "-"} min</div>
                    </td>

                    <td className="px-8 py-6 text-right flex items-center justify-end gap-2">
                      <button
                        title="Edit"
                        className="p-2 text-slate-500 hover:text-indigo-600 rounded-lg"
                        // For now edit opens modal prefilled — not implemented (optional)
                        onClick={() => {
                          alert("Edit not implemented in this view. You can implement edit flow to load quiz into modal.");
                        }}
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteQuiz(q.id)}
                        className="p-2 text-rose-500 hover:text-rose-700 rounded-lg"
                        disabled={actionLoadingId === String(q.id)}
                      >
                        {actionLoadingId === String(q.id) ? <Loader2 className="animate-spin" size={18} /> : <Trash size={18} />}
                      </button>
                      <button className="p-2 text-slate-300 hover:text-indigo-600" title="More">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Quiz */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />

          <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl relative overflow-auto max-h-[90vh]">
            {/* header */}
            <div className="bg-slate-900 p-6 flex items-center justify-between text-white rounded-t-xl">
              <h2 className="text-2xl font-black">Create Quiz</h2>
              <div className="flex items-center gap-3">
                <button className="px-3 py-2 rounded-md bg-slate-800/30 text-sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button className="px-3 py-2 rounded-md bg-slate-700/30 text-sm" onClick={() => {}}>
                  Preview
                </button>
                <button className="p-2 rounded-full hover:bg-white/10" onClick={() => setIsModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Module selection grid */}
              <div>
                <label className="text-xs font-black uppercase tracking-wide text-slate-400">Select Module</label>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {modules.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedModuleId(m.id)}
                      className={`py-3 rounded-2xl text-xs font-black uppercase border-2 transition-all ${
                        selectedModuleId === m.id ? "border-indigo-600 bg-indigo-50 text-indigo-600" : "border-slate-100 text-slate-500"
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submodule selector (grid) */}
              <div>
                <label className="text-xs font-black uppercase tracking-wide text-slate-400">Select Submodule</label>
                <div className="mt-3">
                  {submodules.length === 0 ? (
                    <div className="text-sm text-slate-400">Choose a module to see submodules</div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {submodules.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedSubmoduleId(s.id)}
                          className={`py-3 rounded-2xl text-xs font-black uppercase border-2 transition-all ${
                            selectedSubmoduleId === s.id ? "border-rose-600 bg-rose-50 text-rose-600" : "border-slate-100 text-slate-500"
                          }`}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quiz details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black uppercase text-slate-400">Quiz Title</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full mt-2 p-3 rounded-xl bg-slate-50" placeholder="e.g. React Basics Test" />
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-slate-400">Time Limit (minutes)</label>
                  <input type="number" value={timeLimit as any} onChange={(e) => setTimeLimit(e.target.value === "" ? "" : Number(e.target.value))} className="w-full mt-2 p-3 rounded-xl bg-slate-50" />
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-slate-400">Passing %</label>
                  <input type="number" value={passingPercent as any} onChange={(e) => setPassingPercent(e.target.value === "" ? "" : Number(e.target.value))} className="w-full mt-2 p-3 rounded-xl bg-slate-50" />
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-slate-400">Total Questions</label>
                  <input readOnly value={questions.length} className="w-full mt-2 p-3 rounded-xl bg-slate-100" />
                </div>
              </div>

              {/* Question buttons */}
              <div className="flex gap-3">
                <button onClick={() => addQuestion("mcq")} className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2">
                  <Plus size={16} /> Add MCQ
                </button>
                <button onClick={() => addQuestion("text")} className="bg-green-600 text-white px-4 py-2 rounded-xl flex items-center gap-2">
                  <Plus size={16} /> Add Text
                </button>
              </div>

              {/* Questions list */}
              <div className="space-y-4">
                {questions.map((q, qi) => (
                  <div key={q.id} className="border p-4 rounded-xl">
                    <div className="flex justify-between items-center mb-3">
                      <div className="font-bold">Question {qi + 1} — {q.type.toUpperCase()}</div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-slate-500 mr-2">Marks</div>
                        <input type="number" min={1} value={q.marks} onChange={(e) => updateQuestionField(q.id, "marks", Number(e.target.value || 1))} className="w-20 p-2 rounded border" />
                        <button onClick={() => removeQuestion(q.id)} className="ml-3 text-rose-500">Remove</button>
                      </div>
                    </div>

                    <textarea value={q.question} onChange={(e) => updateQuestionField(q.id, "question", e.target.value)} placeholder="Enter question text" className="w-full p-3 rounded-lg border mb-3" />

                    {q.type === "mcq" ? (
                      <div className="space-y-2">
                        {q.options.map((opt, oi) => (
                          <div key={opt.id} className="flex items-center gap-3">
                            <input type="radio" name={`correct-${q.id}`} checked={q.correctAnswer === opt.id} onChange={() => updateQuestionField(q.id, "correctAnswer", opt.id)} />
                            <input value={opt.text} onChange={(e) => updateOptionText(q.id, opt.id, e.target.value)} placeholder={`Option ${oi + 1}`} className="flex-1 p-2 border rounded" />
                          </div>
                        ))}
                        <button onClick={() => addOptionToQuestion(q.id)} className="text-sm text-blue-600">+ Add Option</button>
                      </div>
                    ) : (
                      <div>
                        <label className="text-sm font-semibold">Answer (text)</label>
                        <textarea placeholder="Optional sample answer / instructions" className="w-full p-2 mt-2 border rounded" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-end gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-md bg-slate-100">Cancel</button>
                <button
                  onClick={handleCreateQuiz}
                  disabled={creating}
                  className="px-6 py-3 rounded-2xl bg-black text-white flex items-center gap-2"
                >
                  {creating ? <Loader2 className="animate-spin" /> : <>Save Quiz <ArrowRight size={16} /></>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}