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
    <div className="relative md:pt-14 md:pb-16 p-2 sm:px-6 lg:px-10 bg-[#1c398e] border-b border-slate-100">
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 shadow-xl">
          
          {/* MAIN FLEX */}
          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 sm:gap-8">

            {/* LEFT SECTION */}
            <div className="flex items-start sm:items-center gap-4 sm:gap-6 w-full xl:w-auto">
              
              {/* AVATAR */}
              <div className="relative group cursor-pointer shrink-0">
                <div className="absolute -inset-2 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />

                <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-blue-950 rounded-2xl border border-blue-400/30 flex items-center justify-center overflow-hidden">
                  <User size={28} className="sm:hidden text-blue-200/80" />
                  <User size={36} className="hidden sm:block text-blue-200/80" />
                  <div
                    className={`absolute bottom-0 inset-x-0 h-1 ${
                      isPaid ? "bg-cyan-400" : "bg-blue-400"
                    }`}
                  />
                </div>

                <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3">
                  {isPaid ? (
                    <div className="bg-cyan-500 p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-lg">
                      <ShieldCheck size={14} className="sm:hidden text-white" />
                      <ShieldCheck size={16} className="hidden sm:block text-white" />
                    </div>
                  ) : (
                    <div className="bg-blue-600 p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-lg">
                      <Crown size={14} className="sm:hidden text-white" />
                      <Crown size={16} className="hidden sm:block text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* TEXT */}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
                    {studentName || "Student"}
                  </h1>

                  <div
                    className={`px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-tight border ${
                      isPaid
                        ? "border-cyan-400/50 text-gray-800 bg-cyan-400/10"
                        : "border-blue-400/50 text-blue-300 bg-blue-400/10"
                    }`}
                  >
                    {isPaid ? "Enrolled" : "Trial"}
                  </div>
                </div>

                <p className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700">
                  <Compass size={14} className="text-cyan-400" />
                  Course:
                  <span className="text-gray-900 font-semibold">
                    {course?.name ?? "General Course"}
                  </span>
                </p>
              </div>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-2 sm:flex gap-3 sm:gap-4 w-full xl:w-auto">
              
              <div className="bg-[#1c398e] rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center gap-3 w-full sm:min-w-[140px]">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-600/20 flex items-center justify-center">
                  <BookOpen size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-white uppercase">
                    Modules
                  </p>
                  <p className="text-lg sm:text-xl font-black text-white">
                    {totalModules}
                  </p>
                </div>
              </div>

              <div className="bg-[#1c398e] rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center gap-3 w-full sm:min-w-[140px]">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-cyan-600/20 flex items-center justify-center">
                  <Activity size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-white uppercase">
                    Active
                  </p>
                  <p className="text-lg sm:text-xl font-black text-white">
                    {activeModules?.length || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* BUTTON */}
            <div className="w-full xl:w-auto">
              <button
                onClick={onLogout}
                className="w-full xl:w-auto flex items-center justify-center gap-2 sm:gap-3 px-5 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl sm:rounded-2xl text-sm font-black transition-all duration-300 shadow-lg active:scale-95"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}