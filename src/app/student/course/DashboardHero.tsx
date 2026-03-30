"use client";

import React from "react";
import Link from "next/link"; // Change to "next/link" if using Next.js
import { ChevronRight, LogOut, BookOpen, Zap, ShieldCheck, LayoutGrid } from "lucide-react";

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
  const isPaid = (Type || "free").toLowerCase().trim() === "paid";
  const totalModules = course?.modules?.length ?? 0;
  const firstInitial = studentName?.charAt(0).toUpperCase() || "S";

  return (
    <div className="w-full bg-[#0B0F1A] text-slate-200 font-sans selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* TOP NAVIGATION / BREADCRUMB */}
        <nav className="flex items-center gap-2 mb-10 text-sm font-medium">
          <Link 
            href="/student" 
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-400 transition-colors"
          >
            <LayoutGrid size={16} />
            <span>Dashboard</span>
          </Link>
          <ChevronRight size={14} className="text-slate-700" />
          <span className="text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">LMS</span>
        </nav>

        {/* HERO CONTENT */}
        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-white/5">
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* AVATAR - Minimalist Circle */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-3xl font-bold text-white shadow-[0_0_40px_rgba(79,70,229,0.2)]">
                {firstInitial}
              </div>
              {isPaid && (
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 p-1 rounded-full border-4 border-[#0B0F1A]">
                  <ShieldCheck size={12} className="text-white" />
                </div>
              )}
            </div>

            {/* IDENTITY */}
            <div className="text-center md:text-left space-y-2">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <h1 className="text-4xl font-semibold tracking-tight text-white">
                  {studentName || "Student"}
                </h1>
                <span className={`text-[10px] tracking-widest font-black px-2 py-1 rounded border ${
                  isPaid ? "border-emerald-500/20 text-emerald-400" : "border-slate-700 text-slate-500"
                }`}>
                  {isPaid ? "PREMIUM" : "FREE TRIAL"}
                </span>
              </div>
              <p className="text-slate-400 flex items-center justify-center md:justify-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                {course?.name ?? "General Course Path"}
              </p>
            </div>
          </div>

          {/* STATS & ACTIONS */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            
            {/* COMPACT STATS */}
            <div className="flex items-center gap-8 px-6 py-3 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
              <div className="text-center">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Modules</p>
                <div className="flex items-center gap-2 justify-center">
                  <BookOpen size={14} className="text-indigo-400" />
                  <span className="text-xl font-mono text-white tracking-tighter">{totalModules}</span>
                </div>
              </div>
              <div className="w-[1px] h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Active</p>
                <div className="flex items-center gap-2 justify-center">
                  <Zap size={14} className="text-amber-400" />
                  <span className="text-xl font-mono text-white tracking-tighter">{activeModules?.length || 0}</span>
                </div>
              </div>
            </div>

            {/* LOGOUT BUTTON - Low profile */}
            <button 
              onClick={onLogout}
              className="group flex items-center gap-2 text-slate-500 hover:text-red-400 transition-all font-medium text-sm"
            >
              <div className="p-2 rounded-lg bg-slate-900 group-hover:bg-red-500/10 transition-colors">
                <LogOut size={16} />
              </div>
              Sign Out
            </button>
          </div>
        </div>

        {/* SUBTLE DECORATION */}
        <div className="absolute top-0 right-0 w-1/3 h-64 bg-indigo-600/5 blur-[120px] pointer-events-none" />
      </div>
    </div>
  );
}