"use client";

import React, { useState } from "react";
import { 
  ChevronDown, 
  ChevronUp, 
  Play, 
  BookOpen, 
  Clock, 
  Video, 
  FileText,
  Lock,
  CheckCircle2,
  MonitorPlay
} from "lucide-react";

/* ===== TYPES ===== */
export type Submodule = {
  submoduleId?: string;
  title?: string;
  description?: string;
  video?: string;
};

export type Module = {
  moduleId?: string;
  slug?: string;
  name?: string;
  description?: string;
  submodules?: Submodule[];
};

export type Course = {
  courseId?: string;
  slug?: string;
  name?: string;
  description?: string;
  modules?: Module[];
};

type Props = {
  course: Course | null;
  onPlayVideo: (videoUrl: string, title?: string) => void;
};

/* ===== COMPONENT ===== */
export default function CourseModules({
  course,
  onPlayVideo,
}: Props): React.ReactElement {
  const [openModuleId, setOpenModuleId] = useState<string | null>(null);
  const [activePointKey, setActivePointKey] = useState<string | null>(null);

  if (!course || !course.modules?.length) {
    return (
      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
        <BookOpen className="mx-auto text-slate-300 mb-4" size={48} />
        <p className="text-slate-500 font-medium tracking-tight">
          No course curriculum details found.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Course Header Section */}
      <div className="bg-white rounded-[2.5rem] p-3 md:p-4 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
          <GraduationCapDecoration size={120} />
        </div>
        
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest border border-indigo-100">
            <MonitorPlay size={12} />
            Course Curriculum
          </div>
          <h2 className="text-3xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight">
            {course.name}
          </h2>
          <p className="text-slate-500 text-[14px] leading-relaxed max-w-2xl font-medium">
            {course.description}
          </p>
          
          <div className="flex flex-wrap gap-6 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <BookOpen className="text-indigo-600" size={18} />
              {course.modules.length} Modules
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <Video className="text-indigo-600" size={18} />
              Full HD Lectures
            </div>
             
          </div>
        </div>
      </div>

      {/* Modules List */}
      <div className="space-y-4">
        {course.modules.map((module, moduleIndex) => {
          const moduleKey = module.moduleId ?? `${moduleIndex}`;
          const isOpen = openModuleId === moduleKey;
          const moduleNumber = (moduleIndex + 1).toString().padStart(2, '0');

          return (
            <div
              key={moduleKey}
              className={`group transition-all duration-500 rounded-[2rem] overflow-hidden border-2 ${
                isOpen 
                  ? "bg-white border-indigo-600 shadow-2xl shadow-indigo-500/10 ring-4 ring-indigo-500/5" 
                  : "bg-slate-50/50 border-slate-100 hover:border-slate-300 hover:bg-white"
              }`}
            >
              {/* MODULE HEADER */}
              <button
                type="button"
                onClick={() => setOpenModuleId(isOpen ? null : moduleKey)}
                className="w-full flex items-center justify-between px-6 py-6 transition-all"
              >
                <div className="flex items-center gap-6 text-left">
                  <div className={`hidden sm:flex h-12 w-12 rounded-2xl items-center justify-center font-black text-lg transition-all ${
                    isOpen ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 rotate-3" : "bg-slate-200 text-slate-500 group-hover:bg-slate-300"
                  }`}>
                    {moduleNumber}
                  </div>
                  <div>
                    <h3 className={`font-black text-lg tracking-tight transition-colors ${
                      isOpen ? "text-indigo-900" : "text-slate-800"
                    }`}>
                      {module.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {module.submodules?.length || 0} Lessons
                      </span>
                      {module.description && (
                        <>
                          <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                          <span className="text-xs font-medium text-slate-400 line-clamp-1">
                            {module.description}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className={`p-2 rounded-xl transition-all ${
                  isOpen ? "bg-indigo-50 text-indigo-600" : "bg-slate-200 text-slate-400 group-hover:text-slate-600"
                }`}>
                  {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>

              {/* MODULE CONTENT (Accordian Body) */}
              <div className={`transition-all duration-500 overflow-hidden ${
                isOpen ? "max-h-[2000px] border-t border-slate-100" : "max-h-0"
              }`}>
                <div className="p-4 sm:p-6 space-y-3 bg-white/50 backdrop-blur-sm">
                  {module.submodules?.map((sub, subIndex) => {
                    const pointKey = `${moduleKey}-${subIndex}`;
                    const isActive = activePointKey === pointKey;
                    const subNumber = `${moduleIndex + 1}.${subIndex + 1}`;

                    return (
                      <div
                        key={pointKey}
                        className={`group/sub relative transition-all duration-300 rounded-2xl border-2 ${
                          isActive 
                            ? "bg-indigo-50 border-indigo-200 shadow-sm" 
                            : "bg-white border-slate-50 hover:border-slate-200 hover:shadow-md"
                        }`}
                      >
                        {/* SUBMODULE INTERACTIVE ROW */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
                          <button
                            type="button"
                            onClick={() => setActivePointKey(isActive ? null : pointKey)}
                            className="flex-1 text-left flex items-start gap-4"
                          >
                            <div className={`mt-0.5 p-2 rounded-lg transition-all ${
                              isActive ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "bg-slate-100 text-slate-400 group-hover/sub:bg-slate-200"
                            }`}>
                              {isActive ? <MonitorPlay size={18} /> : <Play size={18} />}
                            </div>
                            
                            <div className="space-y-1">
                              <h4 className={`font-bold text-sm tracking-tight transition-colors ${
                                isActive ? "text-indigo-900" : "text-slate-700 group-hover/sub:text-indigo-600"
                              }`}>
                                <span className="text-[10px] text-slate-400 mr-2 uppercase tracking-widest">{subNumber}</span>
                                {sub.title}
                              </h4>
                              <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xl">
                                {sub.description}
                              </p>
                            </div>
                          </button>

                          {/* ACTION BUTTONS */}
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {sub.video && (
                              <button
                                type="button"
                                onClick={() => onPlayVideo(sub.video!, sub.title)}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                                  isActive 
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700" 
                                    : "bg-slate-100 text-slate-500 hover:bg-slate-900 hover:text-white"
                                }`}
                              >
                                <Play size={12} fill="currentColor" />
                                Watch
                              </button>
                            )}
                            <div className="p-2 text-slate-300">
                              <CheckCircle2 size={18} />
                            </div>
                          </div>
                        </div>

                        {/* EXPANDED DETAILS (If needed) */}
                        {isActive && (
                           <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                              <div className="h-px bg-indigo-100 mb-4" />
                              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">
                                <span className="flex items-center gap-1.5"><Clock size={12} /> 12:45 Duration</span>
                                <span className="flex items-center gap-1.5"><FileText size={12} /> Resource Pack</span>
                              </div>
                           </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {(!module.submodules || module.submodules.length === 0) && (
                    <div className="py-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                      <Lock className="mx-auto text-slate-300 mb-2" size={24} />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Modules are currently locked</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Decorative Icon Component
function GraduationCapDecoration({ size }: { size: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}