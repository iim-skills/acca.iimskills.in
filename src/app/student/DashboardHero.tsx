"use client";

import React from "react";
import { 
  BookOpen, 
  Layers, 
  LogOut, 
  User, 
  ShieldCheck, 
  Crown,
  ChevronRight
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
  studentType?: "free" | "paid";
  course: CourseFile | null;
  activeModules: string[];
  onLogout: () => void;
};

/* ================= COMPONENT ================= */

export default function DashboardHero({
  studentName,
  studentType,
  course,
  activeModules,
  onLogout,
}: Props) {
  const totalModules = course?.modules?.length ?? 0;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-500 to-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100 p-6 lg:p-8 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/10 rounded-full -ml-10 -mb-10 blur-2xl pointer-events-none" />

      <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        
        {/* LEFT SECTION: User Profile & Course */}
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center shadow-inner">
              <User size={28} className="text-white/90" />
            </div>
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-indigo-600 flex items-center justify-center ${
              studentType === "paid" ? "bg-emerald-400" : "bg-amber-400"
            }`}>
              {studentType === "paid" ? (
                <ShieldCheck size={10} className="text-emerald-900" />
              ) : (
                <Crown size={10} className="text-amber-900" />
              )}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight">{studentName}</h1>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${
                studentType === "paid" 
                  ? "bg-emerald-400/20 text-emerald-200 border border-emerald-400/30" 
                  : "bg-amber-400/20 text-amber-200 border border-amber-400/30"
              }`}>
                {studentType === "paid" ? "Premium" : "Standard"}
              </span>
            </div>
            <p className="text-[11px] font-bold text-indigo-100/70 uppercase tracking-widest flex items-center gap-1.5">
              Current Enrollment <ChevronRight size={10} />
            </p>
            <p className="text-sm font-semibold text-white">
              {course?.name ?? "Assigned Course"}
            </p>
          </div>
        </div>

        {/* CENTER SECTION: Stats Grid */}
        <div className="flex items-center gap-4 sm:gap-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center border border-white/10">
              <BookOpen size={18} className="text-indigo-200" />
            </div>
            <div>
              <p className="text-lg font-black leading-none">{totalModules}</p>
              <p className="text-[10px] text-indigo-100/60 font-bold uppercase tracking-wider mt-1">Total Modules</p>
            </div>
          </div>

          <div className="w-px h-8 bg-white/10 hidden sm:block" />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center border border-white/10">
              <Layers size={18} className="text-indigo-200" />
            </div>
            <div>
              <p className="text-lg font-black leading-none">{activeModules.length}</p>
              <p className="text-[10px] text-indigo-100/60 font-bold uppercase tracking-wider mt-1">Active Now</p>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION: Actions */}
        <div className="flex items-center lg:ml-auto">
          <button
            onClick={onLogout}
            className="group flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-xs font-bold transition-all border border-white/10 active:scale-95 shadow-lg"
          >
            <LogOut size={16} className="text-indigo-200 transition-transform group-hover:-translate-x-0.5" />
            Logout
          </button>
        </div>

      </div>
    </div>
  );
}