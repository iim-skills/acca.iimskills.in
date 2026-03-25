"use client";

import React from "react";
import { BookOpen, LogOut, Zap, CheckCircle2 } from "lucide-react";

/* ================= TYPES ================= */

type Module = {
  moduleId?: string;
  name?: string;
};

type CourseFile = {
  name?: string;
  modules?: Module[];
};

type Props = {
  studentName: string;
  Type?: string; // "paid" or "free"
  course: CourseFile | null;
  activeModules: string[];
  onLogout: () => void;
};

export default function DashboardHero({
  studentName,
  Type,
  course,
  activeModules,
  onLogout,
}: Props) {
  const isPaid = (Type || "free").toLowerCase().trim() === "paid";
  const totalModules = course?.modules?.length ?? 12;

  const firstInitial = studentName?.charAt(0).toUpperCase() || "S";

  return (
    <div className="w-full md:pt-10 md:pb-12 p-2 sm:px-6 lg:px-10 bg-[#0F172A]">
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="rounded-3xl p-6 sm:p-8 lg:p-10 flex flex-col md:flex-row items-center justify-between gap-8 bg-[#111C33] border border-white/10 shadow-2xl">
          
          {/* LEFT SECTION: AVATAR + STUDENT INFO */}
          <div className="flex items-center gap-6 grow">
            
            {/* AVATAR/INITIAL */}
            <div className="relative shrink-0">
              <div className="absolute -inset-1.5 bg-gradient-to-tr from-[#6366f1] to-[#38bdf8] rounded-3xl opacity-30 blur-sm" />
              <div className="relative w-20 h-20 bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] rounded-3xl border border-indigo-400/30 flex items-center justify-center overflow-hidden shadow-lg">
                <span className="text-white text-5xl font-extrabold tracking-tighter">
                  {firstInitial}
                </span>
              </div>
            </div>

            {/* NAME, STATUS, & COURSE */}
            <div className="space-y-2 flex-grow">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-extrabold text-white leading-none">
                  {studentName || "Student"}
                </h1>
                <span
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                    isPaid
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-400/20"
                      : "bg-sky-500/15 text-sky-300 border border-sky-400/20"
                  }`}
                >
                  {isPaid ? "FULL ACCESS" : "TRIAL ACCESS"}
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-300 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl max-w-md">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span className="text-slate-100 font-bold flex-grow">
                  Course: {course?.name ?? "General Learning Track"}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT SECTION: STATS + LOGOUT */}
          <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
            
            {/* STATS AREA */}
            <div className="grid grid-cols-2 gap-4 w-full sm:w-auto">
              <StatCard
                icon={<BookOpen size={20} className="text-white" />}
                label={totalModules.toString()}
                sub="Modules"
                bgColor="bg-gradient-to-br from-[#16a34a] to-[#22c55e]"
              />

              <StatCard
                icon={<Zap size={20} className="text-white" />}
                label={activeModules?.length.toString() || "0"}
                sub="Active"
                bgColor="bg-gradient-to-br from-[#7c3aed] to-[#8b5cf6]"
              />
            </div>

            {/* LOGOUT BUTTON */}
            <button
              onClick={onLogout}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-[#ff4b71] to-[#ff42a3] hover:from-[#e14264] hover:to-[#e13b8f] text-white rounded-2xl text-base font-bold transition-all duration-300 shadow-md shadow-pink-900/20 active:scale-[0.97]"
            >
              <LogOut size={18} />
              Logout Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= StatCard Component ================= */

function StatCard({
  icon,
  label,
  sub,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  bgColor: string;
}) {
  return (
    <div className={`p-4 ${bgColor} rounded-2xl flex items-center gap-4 w-full min-w-[140px] shadow-lg shadow-black/10`}>
      <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0 backdrop-blur-sm">
        {icon}
      </div>
      <div>
        <p className="text-4xl font-extrabold text-white leading-none tracking-tight">
          {label}
        </p>
        <p className="text-[11px] font-bold text-white uppercase opacity-80 tracking-widest mt-1">
          {sub}
        </p>
      </div>
    </div>
  );
}