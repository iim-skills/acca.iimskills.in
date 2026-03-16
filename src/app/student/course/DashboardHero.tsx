// components/DashboardHero.tsx
"use client";

import React from "react";
import {
  BookOpen,
  LogOut,
  User,
  ShieldCheck,
  Crown,
  Activity,
  Compass,
} from "lucide-react";

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
  Type?: string;
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
  const studentType = (Type || "free").toLowerCase().trim();
  const isPaid = studentType === "paid";
  const totalModules = course?.modules?.length ?? 0;

  return (
    <div className="relative overflow-hidden bg-[#020617] p-px mb-8 shadow-2xl shadow-blue-900/20">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-900 to-slate-950" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/20 rounded-full blur-[100px] -ml-20 -mb-20" />

      <div className="relative z-10 bg-slate-950/40 backdrop-blur-2xl p-6 lg:p-10 border border-white/10">
        <div className="flex flex-col w-full lg:w-9/10 mx-auto xl:flex-row items-start xl:items-center justify-between gap-10">
          <div className="flex items-center gap-6">
            <div className="relative group cursor-pointer">
              <div className="absolute -inset-2 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />

              <div className="relative w-20 h-20 bg-blue-950 rounded-2xl border border-blue-400/30 flex items-center justify-center overflow-hidden">
                <User size={36} className="text-blue-200/80" />
                <div className={`absolute bottom-0 inset-x-0 h-1 ${isPaid ? "bg-cyan-400" : "bg-blue-400"}`} />
              </div>

              <div className="absolute -top-3 -right-3">
                {isPaid ? (
                  <div className="bg-cyan-500 p-2 rounded-xl shadow-lg shadow-cyan-900/40">
                    <ShieldCheck size={16} className="text-white" />
                  </div>
                ) : (
                  <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-900/40">
                    <Crown size={16} className="text-white" />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-white tracking-tight italic">
                  {studentName || "Student"}
                </h1>

                <div
                  className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter border ${
                    isPaid
                      ? "border-cyan-400/50 text-cyan-300 bg-cyan-400/10"
                      : "border-blue-400/50 text-blue-300 bg-blue-400/10"
                  }`}
                >
                  {isPaid ? "Enrolled Student" : "Trial Student"}
                </div>
              </div>

              <p className="flex items-center gap-2 text-sm font-medium text-blue-200/60">
                <Compass size={14} className="text-cyan-400" />
                Learning Path:
                <span className="text-white">{course?.name ?? "General Course"}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 lg:gap-6">
            <div className="bg-blue-900/20 border border-blue-400/20 rounded-2xl p-4 min-w-[140px] flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-400/30">
                <BookOpen size={20} className="text-cyan-300" />
              </div>
              <div>
                <p className="text-xs font-bold text-blue-300/50 uppercase tracking-widest">Modules</p>
                <p className="text-xl font-black text-white leading-none">{totalModules}</p>
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-400/20 rounded-2xl p-4 min-w-[140px] flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-cyan-600/20 flex items-center justify-center border border-cyan-400/30">
                <Activity size={20} className="text-cyan-300" />
              </div>
              <div>
                <p className="text-xs font-bold text-blue-300/50 uppercase tracking-widest">Active</p>
                <p className="text-xl font-black text-white leading-none">{activeModules?.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="shrink-0 lg:ml-auto w-full lg:w-auto">
            <button
              onClick={onLogout}
              className="w-full lg:w-auto group flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-2xl text-sm font-black transition-all duration-300 shadow-xl shadow-blue-900/40 active:scale-95"
            >
              <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}