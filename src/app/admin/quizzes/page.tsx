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

export default function QuizAdmin({ currentUser: propUser }: { currentUser?: any } = {}) {
  const router = useRouter();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: MsgType }>({
    text: "",
    type: "",
  });

  const resolvedUser =
    propUser ??
    (typeof window !== "undefined"
      ? JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user") || "{}")
      : null);

  const isSuperAdmin = isSuperVariant(resolvedUser?.role);

  useEffect(() => {
    loadInitial();
  }, []);

  const showMsg = (text: string, type: MsgType = "error") => {
    setMessage({ text, type });
    if (type === "success") {
      window.setTimeout(() => setMessage({ text: "", type: "" }), 4000);
    }
  };

  const loadInitial = async () => {
    try {
      setLoading(true);
      const [bRes, qRes] = await Promise.all([
        fetch("/api/admin/batches"),
        fetch("/api/admin/quizzes"),
      ]);

      const bData = await bRes.json();
      const qData = await qRes.json();

      setBatches(Array.isArray(bData) ? bData : []);
      setQuizzes(Array.isArray(qData) ? qData : []);
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

  const filteredQuizzes = useMemo(() => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return quizzes;

    return quizzes.filter((q) => {
      return (
        q.name?.toLowerCase().includes(term) ||
        q.course_slug?.toLowerCase().includes(term) ||
        q.module_id?.toLowerCase().includes(term) ||
        q.batch_ids?.some((b) => String(b).toLowerCase().includes(term))
      );
    });
  }, [quizzes, searchQuery]);

  const avgQuestions = quizzes.length
    ? Math.round(
        quizzes.reduce((a, b) => a + (Number(b.total_questions) || 0), 0) / quizzes.length
      )
    : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-12 overflow-x-hidden">
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 sm:py-8 lg:py-10">
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

        {/* CONTROLS */}
        <div className="mb-5 sm:mb-6 flex flex-col gap-3">
          <div className="flex items-center gap-3 w-full">
            <div className="relative flex-1 group">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
                size={16}
              />
              <input
                type="text"
                placeholder="Search quizzes..."
                className="w-full pl-10 pr-3 py-2.5 sm:py-3 text-sm sm:text-base bg-white border border-slate-200 rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button
              onClick={() => router.push("/admin/quizzes/create")}
              className="shrink-0 flex items-center justify-center gap-2 bg-slate-900 hover:bg-blue-600 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all shadow-lg active:scale-[0.98] min-h-[44px]"
            >
              <Plus size={18} strokeWidth={3} />
              <span>New Quiz</span>
            </button>
          </div>

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

        {/* MAIN CONTENT AREA */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 overflow-hidden">
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
                        Taxonomy
                      </th>
                      <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                        Assignments
                      </th>
                      <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-50">
                    {filteredQuizzes.length === 0 ? (
                      <EmptyState />
                    ) : (
                      filteredQuizzes.map((q) => (
                        <tr key={q.id} className="group hover:bg-blue-50/30 transition-colors">
                          <td className="px-8 py-6">
                            <div className="font-bold text-slate-900 text-lg">
                              {q.name || "Untitled Quiz"}
                            </div>
                            <div className="text-xs text-slate-400 mt-1 flex items-center gap-2 font-medium">
                              <Clock size={12} /> {q.total_questions || 0} Qs •{" "}
                              {q.time_minutes || 0} Mins
                            </div>
                          </td>

                          <td className="px-8 py-6">
                            <span className="inline-block px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold uppercase mb-1">
                              {q.course_slug || "—"}
                            </span>
                            <div className="text-sm text-slate-500 font-medium">
                              {q.module_id || "—"}
                            </div>
                          </td>

                          <td className="px-8 py-6">
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
                          </td>

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
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE / TABLET LIST */}
              <div className="lg:hidden divide-y divide-slate-100">
                {filteredQuizzes.length === 0 ? (
                  <EmptyState />
                ) : (
                  filteredQuizzes.map((q) => (
                    <div key={q.id} className="p-4 sm:p-5 active:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start gap-3 mb-2">
                        <div className="min-w-0">
                          <span className="text-[9px] sm:text-[10px] font-black text-blue-600 uppercase tracking-wider">
                            {q.course_slug || "No Course"}
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
                          {q.total_questions || 0} Qs
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 bg-slate-50 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl">
                        <div className="min-w-0">
                          <p className="text-[8px] font-black text-slate-400 uppercase">
                            Module
                          </p>
                          <p className="text-xs sm:text-sm font-bold text-slate-700 truncate">
                            {q.module_id || "—"}
                          </p>
                        </div>

                        <button
                          onClick={() => window.open(`/admin/quizzes/preview?id=${q.id}`, "_blank")}
                          className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-blue-600 bg-white px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl border border-blue-100 shadow-sm min-h-[36px]"
                        >
                          Preview <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
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