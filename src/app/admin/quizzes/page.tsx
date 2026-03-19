"use client";

import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import { motion } from "framer-motion";

/* ============== TYPES & HELPERS =============== */
type MsgType = "success" | "error" | "";

type Batch = { id: string | number; name?: string; level?: string; type?: string };
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
  return raw.toString().toLowerCase().trim().replace(/[_\-]+/g, " ").replace(/\s+/g, " ");
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
  const [message, setMessage] = useState<{ text: string; type: MsgType }>({ text: "", type: "" });

  // Resolve user role
  const resolvedUser = propUser ?? (typeof window !== "undefined" ? JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user") || "{}") : null);
  const isSuperAdmin = isSuperVariant(resolvedUser?.role);

  useEffect(() => {
    loadInitial();
  }, []);

  const loadInitial = async () => {
    try {
      const [bRes, qRes] = await Promise.all([
        fetch("/api/admin/batches"),
        fetch("/api/admin/quizzes")
      ]);
      const bData = await bRes.json();
      const qData = await qRes.json();
      setBatches(Array.isArray(bData) ? bData : []);
      setQuizzes(Array.isArray(qData) ? qData : []);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    }
  };

  const showMsg = (text: string, type: MsgType = "error") => {
    setMessage({ text, type });
    if (type === "success") setTimeout(() => setMessage({ text: "", type: "" }), 4000);
  };

  const handleDeleteQuiz = async (id: string | number) => {
    if (!isSuperAdmin) return showMsg("Unauthorized — Super Admin only", "error");
    if (!confirm("Permanently delete this quiz?")) return;

    try {
      const res = await fetch(`/api/admin/quizzes?id=${encodeURIComponent(String(id))}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showMsg("Quiz removed", "success");
      setQuizzes(quizzes.filter(q => q.id !== id));
    } catch {
      showMsg("Delete failed");
    }
  };

  const filteredQuizzes = quizzes.filter((q) => {
    const term = searchQuery.toLowerCase();
    return q.name?.toLowerCase().includes(term) || q.course_slug?.toLowerCase().includes(term);
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* HEADER */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-200">
              <Film size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-800">Quiz Management</h1>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Administrator Portal</p>
            </div>
          </div>
          
          <button
            onClick={() => router.push("/admin/quizzes/create")}
            className="flex items-center gap-2 bg-slate-900 hover:bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-xl shadow-slate-200 active:scale-95"
          >
            <Plus size={20} strokeWidth={3} />
            <span>Create New Quiz</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard icon={<Film className="text-blue-600" />} label="Total Quizzes" value={quizzes.length} />
          <StatCard icon={<Users className="text-indigo-600" />} label="Active Batches" value={batches.length} />
          <StatCard icon={<BarChart3 className="text-emerald-600" />} label="Avg. Questions" value={quizzes.length ? Math.round(quizzes.reduce((a, b) => a + (b.total_questions || 0), 0) / quizzes.length) : 0} />
        </div>

        {/* CONTROLS */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search by name or course..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {message.text && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
              {message.type === "success" ? <CheckCircle2 size={16} /> : <X size={16} />}
              {message.text}
            </motion.div>
          )}
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Quiz Info</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Taxonomy</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Assignments</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredQuizzes.length === 0 ? (
                <tr><td colSpan={4} className="py-24 text-center text-slate-400 font-medium">No quizzes found</td></tr>
              ) : (
                filteredQuizzes.map((q) => (
                  <tr key={q.id} className="group hover:bg-blue-50/30 transition-colors">
                    <td className="px-8 py-6">
                      <div className="font-bold text-slate-900 text-lg">{q.name}</div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-2 font-medium">
                        <Clock size={12} /> {q.total_questions} Questions • {q.time_minutes} Mins
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase mb-1">
                        {q.course_slug}
                      </span>
                      <div className="text-sm text-slate-500 font-medium">{q.module_id}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-wrap gap-1">
                        {q.batch_ids?.length ? q.batch_ids.map((bid, i) => (
                          <span key={i} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg font-bold border border-blue-100">{bid}</span>
                        )) : <span className="text-xs text-slate-400">Universal Access</span>}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ActionButton icon={<ExternalLink size={18}/>} color="blue" onClick={() => window.open(`/admin/quizzes/preview?id=${q.id}`)} />
                        <ActionButton icon={<Pencil size={18}/>} color="indigo" onClick={() => router.push(`/admin/quizzes/edit?id=${q.id}`)} />
                        <ActionButton 
                          icon={<Trash2 size={18}/>} 
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
      </main>
    </div>
  );
}

/* ============== SUB-COMPONENTS =============== */

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-5">
      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">{icon}</div>
      <div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</div>
        <div className="text-3xl font-black text-slate-900">{value}</div>
      </div>
    </div>
  );
}

function ActionButton({ icon, color, onClick, disabled }: { icon: React.ReactNode; color: string; onClick: () => void; disabled?: boolean }) {
  const colors: any = {
    blue: "hover:text-blue-600 hover:bg-blue-50",
    indigo: "hover:text-indigo-600 hover:bg-indigo-50",
    rose: "hover:text-rose-600 hover:bg-rose-50",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-2.5 rounded-xl transition-all ${disabled ? "text-slate-200 cursor-not-allowed" : `text-slate-400 ${colors[color]}`}`}
    >
      {icon}
    </button>
  );
}