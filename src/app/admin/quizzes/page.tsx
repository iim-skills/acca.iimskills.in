"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Trash2,
  Film,
  Plus,
  X,
  CheckCircle2,
  Search,
  Clock,
  ExternalLink,
  Pencil,
  BarChart3,
  Users,
  Loader2,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ============== TYPES & HELPERS =============== */
type MsgType = "success" | "error" | "";

type Batch = {
  id: string | number;
  name?: string;
  level?: string;
  type?: string;
};

type Quiz = {
  id?: string | number;
  name?: string;
  course_slug?: string;
  module_id?: string;
  batch_ids?: string[];
  time_minutes?: number | null;
  total_questions?: number | null;
  createdAt?: string;
  questions?: any[];
};

type CourseModule = {
  moduleId: string;
  name: string;
  submodules?: {
    submoduleId: string;
    title: string;
    items?: any[];
  }[];
};

type Course = {
  id?: string | number;
  courseId?: string;
  slug?: string;
  name?: string;
  description?: string;
  courseData?: {
    modules?: CourseModule[];
  };
};

const ITEMS_PER_PAGE = 5;

const getQuestionCount = (questions: any[] = []) => {
  return questions.reduce((acc, q) => {
    if (q.type === "PASSAGE") {
      return acc + (q.passageQuestions?.length || 0);
    }
    return acc + 1;
  }, 0);
};

function normalizeRole(raw?: string) {
  if (!raw) return "";
  return raw
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ");
}

function isSuperVariant(raw?: string) {
  const r = normalizeRole(raw);
  return ["super admin", "superadmin", "sa", "super-admin"].includes(r);
}

export default function QuizAdmin({
  currentUser: propUser,
}: {
  currentUser?: any;
} = {}) {
  const router = useRouter();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: MsgType }>({
    text: "",
    type: "",
  });

  const resolvedUser =
    propUser ??
    (typeof window !== "undefined"
      ? JSON.parse(
          sessionStorage.getItem("user") || localStorage.getItem("user") || "{}"
        )
      : null);

  const isSuperAdmin = isSuperVariant(resolvedUser?.role);

  useEffect(() => {
    loadInitial();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const showMsg = (text: string, type: MsgType = "error") => {
    setMessage({ text, type });
    if (type === "success") {
      window.setTimeout(() => setMessage({ text: "", type: "" }), 4000);
    }
  };

  const loadInitial = async () => {
    try {
      setLoading(true);
      const [bRes, qRes, cRes] = await Promise.all([
        fetch("/api/admin/batches"),
        fetch("/api/admin/quizzes"),
        fetch("/api/admin/courses"),
      ]);

      const bData = await bRes.json();
      const qData = await qRes.json();
      const cData = await cRes.json();

      setBatches(Array.isArray(bData) ? bData : []);
      setQuizzes(Array.isArray(qData) ? qData : []);
      setCourses(Array.isArray(cData) ? cData : cData?.courses || []);
    } catch (err) {
      showMsg("Failed to load quizzes", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = async (id: string | number) => {
    if (!isSuperAdmin) return showMsg("Unauthorized — Super Admin only", "error");
    if (!confirm("Permanently delete this quiz?")) return;

    try {
      const res = await fetch(`/api/admin/quizzes?id=${encodeURIComponent(String(id))}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      showMsg("Quiz removed", "success");
      setQuizzes((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      showMsg("Delete failed", "error");
    }
  };

const getTaxonomy = (quiz: Quiz) => {
  let courseName = "Unassigned";
  let moduleName = "Unassigned";
  let submoduleName = "Unassigned";

  for (const course of courses) {
    const modules = course?.courseData?.modules || [];

    for (const mod of modules) {
      const submodules = mod.submodules || [];

      for (const sub of submodules) {
        const items = sub.items || [];

        const found = items.find((item: any) => {
          if (item.type !== "quiz") return false;

          return (
            String(item.quizId) === String(quiz.id) ||
            String(item.quizRefId) === String(quiz.id)
          );
        });

        if (found) {
          return {
            courseName: course.name || "Unassigned",
            moduleName: mod.name || "Unassigned",
            submoduleName: sub.title || "Unassigned", // ✅ NEW
          };
        }
      }
    }
  }

  return { courseName, moduleName, submoduleName };
};

  const filteredQuizzes = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return quizzes;

    return quizzes.filter((q) => {
      const taxonomy = getTaxonomy(q);

      return (
        q.name?.toLowerCase().includes(term) ||
        q.course_slug?.toLowerCase().includes(term) ||
        q.module_id?.toLowerCase().includes(term) ||
        taxonomy.courseName.toLowerCase().includes(term) ||
        taxonomy.moduleName.toLowerCase().includes(term) ||
        q.batch_ids?.some((b) => String(b).toLowerCase().includes(term))
      );
    });
  }, [quizzes, search, courses]);

  const totalPages = Math.max(1, Math.ceil(filteredQuizzes.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedQuizzes = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredQuizzes.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredQuizzes, currentPage]);

  const avgQuestions = quizzes.length
    ? Math.round(
        quizzes.reduce((a, b) => a + (Number(b.total_questions) || 0), 0) / quizzes.length
      )
    : 0;

  const startIndex = filteredQuizzes.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, filteredQuizzes.length);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-12 overflow-x-hidden">
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 sm:py-8 lg:py-10">
        {/* CONTROLS */}
        <div className="mb-5 sm:mb-6 w-full flex justify-between flex-col gap-3">
          <AnimatePresence>
            {message.text && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm ${
                  message.type === "success"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                {message.type === "success" ? <CheckCircle2 size={16} /> : <X size={16} />}
                {message.text}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 mb-6 sm:mb-8">
          <div className="col-span-1">
            <StatCard
              icon={<Film className="text-blue-600" />}
              label="Total Quizzes"
              value={quizzes.length}
            />
          </div>

          <div className="col-span-1">
            <StatCard
              icon={<Users className="text-indigo-600" />}
              label="Active Batches"
              value={batches.length}
            />
          </div>

          <div className="col-span-2 lg:col-span-1">
            <StatCard
              icon={<BarChart3 className="text-emerald-600" />}
              label="Avg. Questions"
              value={avgQuestions}
            />
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex flex-col justify-between gap-4 border-b border-gray-50 p-6 md:flex-row md:items-center bg-white rounded-t-[2rem] border border-slate-200/60 border-b-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Quiz Management</h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-[320px]">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search quiz, course, module..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all text-sm"
              />
            </div>

            <button
              onClick={() => router.push("/admin/quizzes/create")}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-xl font-semibold shadow-sm transition-all active:scale-95"
            >
              <Plus size={18} strokeWidth={3} />
              <span>New Quiz</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-b-[2rem] shadow-sm border border-slate-200/60 overflow-hidden">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-blue-600" size={32} />
              <span className="text-slate-400 font-medium animate-pulse">
                Loading assessments...
              </span>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                        Quiz Info
                      </th>
                      <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                        Chapter
                      </th>
                      <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                        MOdule
                      </th>
                      <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                        Course
                      </th>
                      {/* <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                        Assignments
                      </th> */}
                      <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-50">
                    {filteredQuizzes.length === 0 ? (
                      <tr>
                        <td colSpan={3}>
                          <EmptyState />
                        </td>
                      </tr>
                    ) : (
                      paginatedQuizzes.map((q) => {
                        const taxonomy = getTaxonomy(q);

                        return (
                          <tr key={q.id} className="group hover:bg-blue-50/30 transition-colors">
                            <td className="mt-1 text-sm text-slate-500 font-medium">
                              <div className="font-semibold text-slate-600 text-[14px]">
                                {q.name || "Untitled Quiz"}
                              </div>
                              <div className="flex gap-2 items-center text-xs text-blue-500 font-medium mt-0.5">
                                <Clock size={12} /> {getQuestionCount(q.questions)} Qs •{" "}
                                {q.time_minutes || 0} Mins
                              </div>
                            </td>
                             <td className="px-8 py-6">
                      <div className="mt-1 text-sm text-slate-500 font-medium">
    {taxonomy.submoduleName}
  </div>
                            </td>
                             <td className="px-8 py-6">
    
 
  <div className="mt-1 text-sm text-slate-500 font-medium">
     {taxonomy.moduleName}
  </div>
 
                            </td>

                            <td className="mt-1 text-sm text-slate-500 font-medium">
                              {taxonomy.courseName}
                            </td>

                            {/* <td className="px-8 py-6">
                              <div className="flex flex-wrap gap-1 max-w-[220px]">
                                {q.batch_ids?.length ? (
                                  q.batch_ids.map((bid, i) => (
                                    <span
                                      key={i}
                                      className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-bold border border-blue-100"
                                    >
                                      {bid}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-slate-400 italic">
                                    Universal Access
                                  </span>
                                )}
                              </div>
                            </td> */}

                            <td className="px-8 py-6 text-right">
                              <div className="flex justify-end gap-1">
                                <ActionButton
                                  icon={<ExternalLink size={18} />}
                                  color="blue"
                                  onClick={() =>
                                    window.open(`/admin/quizzes/preview?id=${q.id}`, "_blank")
                                  }
                                />
                                <ActionButton
                                  icon={<Pencil size={18} />}
                                  color="indigo"
                                  onClick={() => router.push(`/admin/quizzes/edit?id=${q.id}`)}
                                />
                                <ActionButton
                                  icon={<Trash2 size={18} />}
                                  color="rose"
                                  onClick={() => handleDeleteQuiz(q.id!)}
                                  disabled={!isSuperAdmin}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE / TABLET LIST */}
              <div className="lg:hidden divide-y divide-slate-100">
                {filteredQuizzes.length === 0 ? (
                  <EmptyState />
                ) : (
                  paginatedQuizzes.map((q) => {
                    const taxonomy = getTaxonomy(q);

                    return (
                      <div key={q.id} className="p-4 sm:p-5 active:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-start gap-3 mb-2">
                          <div className="min-w-0">
                            <span className="text-[9px] sm:text-[10px] font-black text-blue-600 uppercase tracking-wider">
                              {taxonomy.courseName}
                            </span>
                            <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-tight truncate">
                              {q.name || "Untitled Quiz"}
                            </h3>
                          </div>

                          <ActionButton
                            icon={<Pencil size={16} />}
                            color="indigo"
                            onClick={() => router.push(`/admin/quizzes/edit?id=${q.id}`)}
                          />
                        </div>

                        <div className="flex items-center gap-3 text-[11px] sm:text-xs font-medium text-slate-500 mb-3">
                          <div className="flex items-center gap-1">
                            <Clock size={13} className="text-slate-400" /> {q.time_minutes || 0}m
                          </div>
                          <div className="flex items-center gap-1">
                            <BarChart3 size={13} className="text-slate-400" />{" "}
                            {getQuestionCount(q.questions)} Qs
                          </div>
                        </div>

                        <div className="bg-slate-50 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl space-y-2">
                          <div className="min-w-0">
                            <p className="text-[8px] font-black text-slate-400 uppercase">
                              Course Name
                            </p>
                            <p className="text-xs sm:text-sm font-bold text-slate-700 truncate mt-0.5">
                              {taxonomy.courseName}
                            </p>
                          </div>

                          <div className="min-w-0">
                            <p className="text-[8px] font-black text-slate-400 uppercase">
                              Module Name
                            </p>
                            <p className="text-xs sm:text-sm font-bold text-slate-700 truncate mt-0.5">
                              {taxonomy.moduleName}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex justify-end">
                          <button
                            onClick={() =>
                              window.open(`/admin/quizzes/preview?id=${q.id}`, "_blank")
                            }
                            className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-blue-600 bg-white px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl border border-blue-100 shadow-sm min-h-[36px]"
                          >
                            Preview <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* PAGINATION */}
              {filteredQuizzes.length > 0 && (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/40">
                  <p className="text-sm text-slate-500">
                    Showing {startIndex}-{endIndex} of {filteredQuizzes.length} entries
                  </p>

                  {totalPages > 1 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={16} />
                        Prev
                      </button>

                      <div className="flex items-center gap-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`min-w-10 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                              currentPage === page
                                ? "bg-blue-600 text-white shadow-sm"
                                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

/* ============== SUB-COMPONENTS =============== */

function EmptyState() {
  return (
    <div className="py-20 flex flex-col items-center justify-center text-center px-6">
      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
        <Search size={32} />
      </div>
      <h3 className="text-lg font-bold text-slate-900">No quizzes found</h3>
      <p className="text-slate-500 max-w-xs mx-auto text-sm mt-1">
        Try adjusting your search or create a new assessment from scratch.
      </p>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-[1.5rem] shadow-sm border border-slate-200/50 flex items-center gap-3 sm:gap-4 h-full">
      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {label}
        </p>
        <p className="text-xl sm:text-2xl font-black text-slate-900 leading-none mt-1">
          {value}
        </p>
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  color,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  color: "blue" | "indigo" | "rose";
  onClick: () => void;
  disabled?: boolean;
}) {
  const colors = {
    blue: "text-blue-500 hover:bg-blue-50",
    indigo: "text-indigo-500 hover:bg-indigo-50",
    rose: "text-rose-500 hover:bg-rose-50",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-2 rounded-lg transition-all min-h-[36px] min-w-[36px] flex items-center justify-center ${
        disabled ? "opacity-20 cursor-not-allowed" : colors[color]
      }`}
    >
      {icon}
    </button>
  );
}