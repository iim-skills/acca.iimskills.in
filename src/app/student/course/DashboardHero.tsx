import React from "react";
import { 
  ChevronRight, 
  LogOut, 
  LayoutGrid, 
  ShieldCheck, 
  Layers, 
  Activity 
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
  student_type?: string;
  course: CourseFile | null;
  activeModules: string[];
};

/**
 * DashboardHero Component - Slate & Cyan Edition
 * A professional, enterprise-grade color scheme.
 */
export default function DashboardHero({
  studentName,
  student_type,
  course,
  activeModules,
}: Props) {

  const handleLogout = () => {
    try {
      console.log("Logout clicked");
      localStorage.removeItem("user");
      localStorage.removeItem("course_user_key");
      window.location.href = "/"; 
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const normalizedType = (student_type || "free").toLowerCase().trim();
  const isPaid = normalizedType === "paid";
  const totalModules = course?.modules?.length ?? 0;
  const firstInitial = studentName?.charAt(0).toUpperCase() || "S";

  return (
    /* --- NEW COLOR SCHEME: DEEP SLATE BASE --- */
    <div className="relative w-full overflow-hidden bg-[#0F172A] border-b border-slate-800 font-sans selection:bg-cyan-500/30 md:pb-22">
      
      {/* --- BACKGROUND DESIGN: CLEAN & PROFESSIONAL --- */}
      <div className="absolute inset-0 z-0">
        {/* Soft Radial Center Light */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(51,65,85,0.4)_0%,transparent_70%)]" />
        
        {/* Very Subtle Slate Grid */}
        <div 
          className="absolute inset-0 opacity-[0.05]" 
          style={{ 
            backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)', 
            backgroundSize: '50px 50px' 
          }} 
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 lg:px-10 py-4 sm:py-6 md:py-10 lg:py-10">

  {/* NAV / BREADCRUMBS - Slate Theme */}
  <nav className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8 md:mb-10 lg:mb-12 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em]">
    <a
      href="/student"
      className="flex items-center gap-1.5 sm:gap-2 text-slate-400 hover:text-cyan-400 transition-colors no-underline"
    >
      <LayoutGrid size={13} className="sm:hidden" />
      <LayoutGrid size={14} className="hidden sm:block" />
      <span>Dashboard</span>
    </a>
    <ChevronRight size={12} className="text-slate-600 shrink-0" />
    <span className="text-cyan-400 flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-cyan-500/5 rounded-md border border-cyan-500/20 whitespace-nowrap">
      <span className="w-1 h-1 bg-cyan-400 rounded-full" />
      LMS
    </span>
  </nav>

  {/* HERO MAIN CONTAINER */}
  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 sm:gap-6 md:gap-8 lg:gap-10">

    {/* LEFT SECTION: PROFILE & COURSE */}
    <div className="flex items-center gap-3.5 sm:gap-6 lg:gap-8 min-w-0 w-full lg:w-auto">
      {/* Avatar - Slate/Cyan Look */}
      <div className="relative shrink-0">
        <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-20 lg:h-20 rounded-xl sm:rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl sm:text-2xl md:text-3xl lg:text-3xl font-black text-white shadow-xl">
          <span className="text-slate-200">
            {firstInitial}
          </span>
        </div>
        {isPaid && (
          <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 p-1 sm:p-1.5 bg-cyan-600 text-white rounded-md sm:rounded-lg shadow-lg ring-2 sm:ring-4 ring-[#0F172A]">
            <ShieldCheck size={12} className="sm:hidden" />
            <ShieldCheck size={14} className="hidden sm:block" />
          </div>
        )}
      </div>

      <div className="min-w-0 space-y-1 md:space-y-1.5">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <h1 className="text-base sm:text-xl md:text-3xl lg:text-3xl font-bold tracking-tight text-slate-50 truncate max-w-full">
            {studentName || "Student"}
          </h1>
          <span className={`text-[9px] sm:text-[10px] font-black px-2 sm:px-2.5 py-0.5 sm:py-1 rounded border transition-all whitespace-nowrap ${
            isPaid
              ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
              : "bg-slate-700/50 text-slate-400 border-slate-600"
          }`}>
            {isPaid ? "PRO ACCESS" : "STANDARD"}
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-400 min-w-0">
          <div className="w-4 h-[1px] bg-cyan-500/40 shrink-0"></div>
          <p className="text-xs sm:text-sm font-medium tracking-wide truncate">
            {course?.name ?? "Course Library"}
          </p>
        </div>
      </div>
    </div>

    {/* RIGHT SECTION: STATS & LOGOUT */}
    <div className="flex flex-wrap items-center justify-between sm:justify-start gap-3 sm:gap-6 md:gap-8 lg:gap-10 w-full lg:w-auto">

      {/* STATS CARDS - Clean Slate Style */}
      <div className="flex items-center gap-0.5 sm:gap-4 bg-slate-800/40 p-1 sm:p-1.5 rounded-xl border border-slate-700/50">
        <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-6 py-2 sm:py-3 border-r border-slate-700/50">
          <div className="p-2 sm:p-2.5 bg-slate-700 text-slate-300 rounded-lg">
            <Layers size={15} className="sm:hidden" />
            <Layers size={18} className="hidden sm:block" />
          </div>
          <div>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Modules</p>
            <p className="text-base sm:text-xl font-bold text-slate-100 leading-tight">{totalModules}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-6 py-2 sm:py-3">
          <div className="p-2 sm:p-2.5 bg-cyan-500/10 text-cyan-400 rounded-lg">
            <Activity size={15} className="sm:hidden" />
            <Activity size={18} className="hidden sm:block" />
          </div>
          <div>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Progress</p>
            <p className="text-base sm:text-xl font-bold text-slate-100 leading-tight">{activeModules?.length || 0}</p>
          </div>
        </div>
      </div>

      {/* LOGOUT BUTTON */}
      <button
        onClick={handleLogout}
        className="group flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-2.5 text-slate-400 hover:text-rose-400 font-bold text-[11px] sm:text-xs uppercase tracking-widest transition-all rounded-lg hover:bg-rose-500/5 shrink-0"
      >
        <LogOut size={15} className="opacity-50 group-hover:opacity-100 transition-opacity sm:hidden" />
        <LogOut size={16} className="opacity-50 group-hover:opacity-100 transition-opacity hidden sm:block" />
        Logout
      </button>
    </div>

  </div>
</div>
    </div>
  );
}