"use client";

import React, { useEffect, useState } from "react";
import {
  Trash2,
  Film,
  Plus,
  X,
  CheckCircle2,
  Search,
  ChevronRight,
  Clock,
  ExternalLink,
  Pencil,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Lightweight types ---
type MsgType = "success" | "error" | "";

type Batch = {
  id: string | number;
  name?: string;
  level?: string;
  type?: string;
  startDate?: string | null;
};

type RawSubmodule = { submoduleId?: string; id?: string; slug?: string; title?: string; name?: string; [k: string]: any };
type RawModule = { moduleId?: string; slug?: string; id?: string; name?: string; title?: string; submodules?: RawSubmodule[]; [k: string]: any };
type Course = { slug: string; name?: string; modules?: Array<string | RawModule>; [k: string]: any };

// Quiz question type
type QuizQuestion = { id: string; text: string; options: string[]; correctIndex: number };

type Quiz = {
  id?: string | number;
  name?: string;
  course_slug?: string;
  module_id?: string;
  batch_ids?: string[];
  time_minutes?: number | null;
  passing_percent?: number | null;
  total_questions?: number | null;
  questions?: QuizQuestion[];
  createdAt?: string;
};

// Simple UUID fallback
const generateId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2);

/* ============== ROLE HELPERS =============== */
function normalizeRole(raw?: string) {
  if (!raw) return "";
  return raw.toString().toLowerCase().trim().replace(/[_\-]+/g, " ").replace(/\s+/g, " ");
}
function isSuperVariant(raw?: string) {
  const r = normalizeRole(raw);
  return r === "super admin" || r === "superadmin" || r === "sa" || r === "super-admin";
}

/* ============== MAIN COMPONENT =============== */
export default function QuizAdmin({ currentUser: propUser }: { currentUser?: any } = {}) : React.ReactElement {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // UI State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: MsgType }>({ text: "", type: "" });

  // Form State
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [selectedSubmodule, setSelectedSubmodule] = useState<string>("");
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [selectAllBatches, setSelectAllBatches] = useState(false);

  // Quiz meta
  const [quizName, setQuizName] = useState<string>("");
  const [quizTime, setQuizTime] = useState<number | "">(30); // minutes
  const [passingPercent, setPassingPercent] = useState<number | "">(50);

  // Questions builder
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [qText, setQText] = useState("");
  const [qOptions, setQOptions] = useState<string[]>(["", "", "", ""]);
  const [qCorrect, setQCorrect] = useState<number>(0);

  // resolve user role (prop OR storage)
  const getStoredUser = () => {
    try {
      const s = sessionStorage.getItem("user") ?? localStorage.getItem("user");
      if (!s) return null;
      return JSON.parse(s);
    } catch {
      return null;
    }
  };
  const resolvedUser = propUser ?? getStoredUser();
  const roleRaw = resolvedUser?.role ?? "";
  const normalizedRole = normalizeRole(roleRaw);
  const isSuperAdmin = isSuperVariant(roleRaw);
  const isAdmin = !isSuperAdmin && normalizedRole === "admin";

  useEffect(() => {
    console.log("QuizAdmin resolvedUser:", resolvedUser, "role:", roleRaw, "normalized:", normalizedRole, "isSuperAdmin:", isSuperAdmin, "isAdmin:", isAdmin);
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInitial = async () => {
    await Promise.all([loadBatches(), loadCourses(), loadQuizzes()]);
  };

  const loadBatches = async () => {
    try {
      const res = await fetch("/api/admin/batches");
      if (!res.ok) throw new Error("Failed to load batches");
      const data = await res.json();
      setBatches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("loadBatches:", err);
      setBatches([]);
    }
  };

  const loadCourses = async () => {
    try {
      const res = await fetch("/api/admin/courses");
      if (!res.ok) throw new Error("Failed to load courses");
      const data = await res.json();
      setCourses(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0) setSelectedCourse((data[0].slug as string) ?? "");
    } catch (err) {
      console.error("loadCourses:", err);
      setCourses([]);
    }
  };

  const loadQuizzes = async () => {
    try {
      const res = await fetch("/api/admin/quizzes");
      if (!res.ok) throw new Error("Failed to load quizzes");
      const data = await res.json();
      setQuizzes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("loadQuizzes:", err);
      setQuizzes([]);
    }
  };

  const normalizeCourseModules = (course?: Course | null) => {
    if (!course || !Array.isArray(course.modules)) return [] as { id: string; name: string; submodules: { id: string; title: string }[] }[];
    return course.modules.map((m, idx: number) => {
      if (typeof m === "string") return { id: m, name: m, submodules: [] };
      const mm = m as RawModule;
      const id = mm.moduleId ?? mm.slug ?? mm.id ?? `module_${idx}`;
      const name = mm.name ?? mm.title ?? String(id);
      const submodules = Array.isArray(mm.submodules)
        ? mm.submodules.map((s: RawSubmodule, sidx: number) => {
            const sid = s.submoduleId ?? s.id ?? s.slug ?? `${id}_sub_${sidx}`;
            const title = s.title ?? s.name ?? String(sid);
            return { id: String(sid), title: String(title) };
          })
        : [];
      return { id: String(id), name: String(name), submodules };
    });
  };

  useEffect(() => {
    const c = courses.find((x) => x.slug === selectedCourse);
    if (!c) {
      setSelectedModule("");
      setSelectedSubmodule("");
      return;
    }
    const modules = normalizeCourseModules(c);
    if (modules.length > 0) {
      const firstModule = modules[0];
      if (!modules.some((m) => m.id === selectedModule)) {
        setSelectedModule(firstModule.id);
        setSelectedSubmodule(firstModule.submodules?.[0]?.id ?? "");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourse, courses]);

  const toggleBatch = (id: string | number) => {
    const s = String(id);
    setSelectedBatches((prev) => {
      const next = prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s];
      setSelectAllBatches(next.length > 0 && next.length === batches.length);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!selectAllBatches) {
      setSelectedBatches(batches.map((b) => String(b.id)));
      setSelectAllBatches(true);
    } else {
      setSelectedBatches([]);
      setSelectAllBatches(false);
    }
  };

  const showMsg = (text: string, type: MsgType = "error") => {
    setMessage({ text, type });
    if (type === "success") {
      setTimeout(() => setMessage({ text: "", type: "" }), 5000);
    }
  };

  // Question builder actions
  const resetQuestionForm = () => {
    setQText("");
    setQOptions(["", "", "", ""]);
    setQCorrect(0);
  };

  const addQuestion = () => {
    if (!qText.trim()) return showMsg("Question text required");
    const filledOptions = qOptions.map((o) => o.trim());
    if (filledOptions.some((o) => o === "")) return showMsg("All 4 options are required");
    const q: QuizQuestion = { id: generateId(), text: qText.trim(), options: filledOptions, correctIndex: qCorrect };
    setQuestions((prev) => [...prev, q]);
    resetQuestionForm();
    showMsg("Question added", "success");
  };

  const removeQuestion = (id: string) => setQuestions((prev) => prev.filter((q) => q.id !== id));

  // --- Create Quiz ---
  const createQuiz = async () => {
    if (!quizName.trim()) return showMsg("Provide a quiz name");
    if (!selectedModule) return showMsg("Select a module");
    if (!Number(quizTime) || Number(quizTime) <= 0) return showMsg("Provide valid quiz time (minutes)");
    if (!Number(passingPercent) || Number(passingPercent) < 0 || Number(passingPercent) > 100) return showMsg("Provide valid passing % (0-100)");
    if (questions.length === 0) return showMsg("Add at least one question");

    try {
      const payload = {
        name: quizName,
        course_slug: selectedCourse,
        module_id: selectedModule,
        submodule_id: selectedSubmodule || null,
        batch_ids: selectedBatches,
        time_minutes: Number(quizTime),
        passing_percent: Number(passingPercent),
        total_questions: questions.length,
        questions,
        created_by: resolvedUser?.email ?? "admin",
      };

      const res = await fetch("/api/admin/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create quiz");

      showMsg("Quiz created successfully!", "success");
      // reset
      setQuizName("");
      setQuizTime(30);
      setPassingPercent(50);
      setSelectedBatches([]);
      setSelectAllBatches(false);
      setQuestions([]);
      setIsDrawerOpen(false);

      await loadQuizzes();
    } catch (err: any) {
      console.error(err);
      showMsg(err?.message || "Create failed");
    }
  };

  const currentModules = normalizeCourseModules(courses.find((c) => c.slug === selectedCourse) ?? null);
  const currentSubmodules = currentModules.find((m) => m.id === selectedModule)?.submodules ?? [];

  const filteredQuizzes = quizzes.filter((q) => {
    const name = (q?.name ?? "").toString().toLowerCase();
    const courseSlug = (q?.course_slug ?? "").toString().toLowerCase();
    const qstr = searchQuery.trim().toLowerCase();
    if (!qstr) return true;
    return name.includes(qstr) || courseSlug.includes(qstr);
  });

  const safeDate = (d?: string | null) => {
    if (!d) return "-";
    try {
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return "-";
      return dt.toLocaleDateString();
    } catch {
      return "-";
    }
  };

  /* ============ ROLE-GUARDED DELETE FOR QUIZ ============ */
  const canDelete = () => isSuperAdmin;
  const handleDeleteQuiz = async (id: string | number) => {
    if (!canDelete()) {
      showMsg("Unauthorized — only Super Admin can delete quizzes", "error");
      return;
    }
    if (!confirm("Are you sure you want to delete this quiz?")) return;
    try {
      const res = await fetch(`/api/admin/quizzes?id=${encodeURIComponent(String(id))}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      showMsg("Quiz deleted", "success");
      await loadQuizzes();
    } catch (err: any) {
      console.error(err);
      showMsg(err?.message ?? "Delete failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* HEADER */}
      <header className="bg-white border-b z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Film size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Quiz Central</h1>
          </div>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm active:scale-95"
          >
            <Plus size={18} />
            <span>Create Quiz</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* STATS SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="text-slate-500 text-sm font-medium mb-1 uppercase tracking-wider">Total Quizzes</div>
            <div className="text-3xl font-bold">{quizzes.length}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="text-slate-500 text-sm font-medium mb-1 uppercase tracking-wider">Active Batches</div>
            <div className="text-3xl font-bold">{batches.length}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="text-slate-500 text-sm font-medium mb-1 uppercase tracking-wider">Recent Quizzes (7d)</div>
            <div className="text-3xl font-bold">
              {quizzes.filter((v) => {
                const createdAt = v?.createdAt;
                if (!createdAt) return false;
                const date = new Date(createdAt);
                if (Number.isNaN(date.getTime())) return false;
                return date > new Date(Date.now() - 86400000 * 7);
              }).length}
            </div>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by quiz name or course..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {message.text && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                }`}
              >
                {message.type === "success" ? <CheckCircle2 size={16} /> : <X size={16} />}
                {message.text}
              </motion.div>
            )}
          </div>
        </div>

        {/* QUIZZES GRID */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {filteredQuizzes.length === 0 ? (
            <div className="p-20 text-center">
              <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Film size={32} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">No quizzes found</h3>
              <p className="text-slate-500">Create your first quiz using the "Create Quiz" button.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Quiz Details</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Course / Module</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Batches</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredQuizzes.map((v) => {
                    const id = v?.id ?? generateId();
                    const name = v?.name ?? "Untitled Quiz";
                    const courseSlug = v?.course_slug ?? "-";
                    const moduleName = v?.module_id ?? "";
                    const submoduleName = (v as any)?.submodule_id ?? "";
                    const batchIds = Array.isArray(v?.batch_ids) ? v.batch_ids : [];
                    const createdAt = v?.createdAt;
                    return (
                      <motion.tr layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={String(id)} className="group hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-slate-900 rounded flex items-center justify-center text-white shrink-0">
                              <Film size={20} />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 leading-tight mb-1">{name}</div>
                              <div className="text-sm text-slate-700 truncate max-w-37.5">{v?.total_questions ?? (v.questions?.length ?? 0)} questions • {v.time_minutes ?? "-"} mins</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold uppercase w-fit">{courseSlug}</div>
                            <div className="text-sm text-slate-700 truncate max-w-37.5">{moduleName} {submoduleName && <span className="text-slate-400">/ {submoduleName}</span>}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1 max-w-50">
                            {batchIds.length > 0 ? (
                              batchIds.map((bid: any, i: number) => (
                                <span key={i} className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">{String(bid)}</span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400">All students</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Clock size={14} />
                            {safeDate(createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => window.open(`/admin/quizzes/preview?id=${encodeURIComponent(String(id))}`, "_blank")}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="View Quiz"
                            >
                              <ExternalLink size={18} />
                            </button>

                            {/* EDIT button (always available) */}
                            <button
                              onClick={() => window.open(`/admin/quizzes/edit?id=${encodeURIComponent(String(id))}`, "_blank")}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              title="Edit Quiz"
                            >
                              <Pencil size={18} />
                            </button>

                            {/* DELETE button: only clickable for Super Admin */}
                            {canDelete() ? (
                              <button
                                onClick={() => handleDeleteQuiz(id)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                title="Delete Quiz"
                              >
                                <Trash2 size={18} />
                              </button>
                            ) : (
                              <button
                                onClick={() => showMsg("Unauthorized — only Super Admin can delete quizzes", "error")}
                                className="p-2 text-slate-300 rounded-lg cursor-not-allowed"
                                title="Delete Quiz — Super Admin only"
                                aria-disabled
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* RIGHT SIDE SLIDE-OVER DRAWER (Quiz Creator) */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDrawerOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40" />

            {/* Drawer Content */}
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed top-0 right-0 bottom-0 w-full max-w-xl bg-white z-50 shadow-2xl flex flex-col">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-lg">
                  <div className="text-blue-600 bg-blue-50 p-1.5 rounded">
                    <Plus size={18} />
                  </div>
                  New Quiz
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Quiz Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Quiz Name</label>
                  <input value={quizName} onChange={(e) => setQuizName(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none" placeholder="e.g. Mid-term Assessment" />
                </div>

                {/* Course + Module */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Course</label>
                    <select
                      value={selectedCourse}
                      onChange={(e) => {
                        setSelectedCourse(e.target.value);
                        setSelectedModule("");
                        setSelectedSubmodule("");
                      }}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    >
                      <option value="">Choose course</option>
                      {courses.map((c) => (
                        <option key={c.slug ?? c.name} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Module</label>
                    <select
                      value={selectedModule}
                      onChange={(e) => {
                        setSelectedModule(e.target.value);
                        const chosen = currentModules.find((m) => m.id === e.target.value);
                        setSelectedSubmodule(chosen?.submodules?.[0]?.id ?? "");
                      }}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    >
                      <option value="">Choose module</option>
                      {currentModules.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Submodule */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Submodule (Optional)
                  </label>
                  <select
                    value={selectedSubmodule}
                    onChange={(e) => setSelectedSubmodule(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  >
                    <option value="">No Submodule</option>
                    {currentSubmodules.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Batch Multiselect */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-slate-700">Assign to Batches</label>
                    <button type="button" onClick={handleSelectAll} className="text-xs font-bold text-blue-600 hover:text-blue-700">{selectAllBatches ? "Deselect All" : "Select All"}</button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {batches.map((b) => {
                      const isChecked = selectedBatches.includes(String(b.id));
                      return (
                        <div key={b.id} onClick={() => toggleBatch(b.id)} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isChecked ? "bg-blue-50 border-blue-200 ring-1 ring-blue-200" : "bg-slate-50 border-slate-100"}`}>
                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isChecked ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-300"}`}>
                            {isChecked && <CheckCircle2 size={14} />}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-800">{b.name}</div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-tighter">{b.level} • {b.type}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">If no batch is selected, the quiz will be available to <strong>all students</strong>.</p>
                </div>

                {/* Quiz Meta (time / passing %) */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Quiz Time (mins)</label>
                    <input type="number" min={1} value={quizTime} onChange={(e) => setQuizTime(e.target.value === "" ? "" : Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Passing %</label>
                    <input type="number" min={0} max={100} value={passingPercent} onChange={(e) => setPassingPercent(e.target.value === "" ? "" : Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Total Questions</label>
                    <div className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none">{questions.length}</div>
                  </div>
                </div>

                {/* Questions Builder */}
                <div className="border rounded-xl p-4 bg-slate-50">
                  <div className="mb-3 font-semibold">Add Question</div>
                  <div className="mb-2">
                    <input value={qText} onChange={(e) => setQText(e.target.value)} placeholder="Question text" className="w-full p-3 rounded-lg border border-slate-200 outline-none bg-white" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input type="radio" name="correct" checked={qCorrect === i} onChange={() => setQCorrect(i)} />
                        <input value={qOptions[i]} onChange={(e) => setQOptions((prev) => { const next = [...prev]; next[i] = e.target.value; return next; })} placeholder={`Option ${String.fromCharCode(65 + i)}`} className="w-full p-2 rounded border border-slate-200 outline-none bg-white" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={addQuestion} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold">Add Question</button>
                    <button onClick={resetQuestionForm} className="px-4 py-2 border rounded-lg">Reset</button>
                  </div>
                </div>

                {/* Questions list */}
                <div>
                  <div className="mb-2 font-semibold">Questions ({questions.length})</div>
                  <div className="space-y-2">
                    {questions.map((q, idx) => (
                      <div key={q.id} className="p-3 rounded-xl border bg-white flex items-start justify-between">
                        <div>
                          <div className="font-bold">{idx + 1}. {q.text}</div>
                          <div className="text-sm text-slate-600 mt-1">{q.options.map((o, i) => (
                            <div key={i} className={`text-sm ${i === q.correctIndex ? 'text-emerald-600 font-semibold' : 'text-slate-600'}`}>{String.fromCharCode(65 + i)}. {o}</div>
                          ))}</div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button onClick={() => removeQuestion(q.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg">Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t bg-slate-50">
                <div className="flex gap-3">
                  <button onClick={() => setIsDrawerOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                  <button onClick={createQuiz} className="flex-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2">Create Quiz <ChevronRight size={18} /></button>
                </div>
                {message.text && (
                  <p className={`mt-3 text-center text-xs font-bold ${message.type === "error" ? "text-rose-600" : "text-emerald-600"}`}>{message.text}</p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}