"use client";

import React, { useMemo, useRef } from "react";
import { 
  Film, 
  ChevronRight, 
  Target, 
  User, 
  Layers, 
  Play, 
  CheckCircle2, 
  Info,
  X,
  Maximize2,
  Trophy,
  Activity
} from "lucide-react";

/* ================= TYPES ================= */

type VideoItem = { id?: string; title?: string; url?: string };
type Submodule = { submoduleId?: string; title?: string; description?: string; videos?: VideoItem[]; thumbnail?: string };
type Module = { moduleId?: string; slug?: string; name?: string; description?: string; moduleVideo?: string; submodules?: Submodule[] };
type CourseFile = { courseId?: string; slug?: string; name?: string; description?: string; modules?: Module[] };

type StudentAPIResp = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  modules?: string[] | string;
  progress?: Record<string, number[]>;
  courseTitle?: string;
  batch_id?: string | number;
};

type Props = {
  course: CourseFile | null;
  student: StudentAPIResp;
  activeModuleId: string | null;
  activeVideoUrl: string | null;
  activeSubmoduleTitle: string | null;
  activeQuiz: any | null;
  onCloseQuiz: () => void;
  onPlayVideo: (url: string | null, title?: string, moduleId?: string) => void;
  QuizPanel: React.ComponentType<any>;
};

/* ================= COMPONENT ================= */

export default function App({
  course,
  student,
  activeModuleId,
  activeVideoUrl,
  activeSubmoduleTitle,
  activeQuiz,
  onCloseQuiz,
  onPlayVideo,
  QuizPanel,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  /* ================= PROGRESS CALCULATION ================= */

  const progressPercent = useMemo(() => {
    const modules = course?.modules ?? [];
    if (!modules.length) return 0;

    const modulePercents = modules.map((module) => {
      const totalVideos = module.submodules?.reduce((acc, s) => acc + (s.videos?.length ?? 0), 0) ?? 0;
      const completed = student.progress?.[String(module.moduleId)]?.length ?? 0;
      if (totalVideos === 0) return 0;
      return Math.min(100, Math.round((completed / totalVideos) * 100));
    });

    const sum = modulePercents.reduce((a, b) => a + b, 0);
    return Math.round(sum / modulePercents.length);
  }, [course, student.progress]);

  const activeModule = course?.modules?.find((m) => m.moduleId === activeModuleId);

  /* ================= RENDER ================= */

  return (
    <div className="bg-[#f8fafc] min-h-screen p-4 font-sans text-slate-800 animate-in fade-in duration-300">
      <div className="max-w-4xl mx-auto space-y-4">
        
        {/* COMPACT HEADER & PROGRESS */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <h2 className="text-base font-bold tracking-tight text-slate-900">Learning Dashboard</h2>
              <p className="text-slate-500 text-[11px]">Continue your learning journey</p>
            </div>
            <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
              <Activity className="text-indigo-600" size={14} />
              <span className="text-[11px] font-bold text-indigo-700">{progressPercent}% Done</span>
            </div>
          </div>

          <div className="relative w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-indigo-600 rounded-full transition-all duration-700 ease-out" 
              style={{ width: `${progressPercent}%` }} 
            />
          </div>
        </div>

        {/* MINIMAL CONTENT AREA */}
        <div className="relative">
          <div
            className={`
              transition-all duration-300 rounded-xl overflow-hidden border border-slate-200
              ${activeQuiz 
                ? "bg-white p-4" 
                : "bg-black aspect-video flex items-center justify-center shadow-lg"
              }
            `}
          >
            {activeQuiz ? (
              <div className="w-full">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-amber-500" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Assessment</h3>
                      <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Knowledge Check</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const qid = activeQuiz?.id;
                        if (qid && typeof window !== "undefined") {
                          window.open(`/student/quiz/${qid}`, "_blank");
                        }
                      }}
                      className="hidden sm:flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                    >
                      <Maximize2 size={12} /> Fullscreen
                    </button>
                    <button
                      onClick={onCloseQuiz}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-all"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <div className="w-full text-sm">
                  <QuizPanel quiz={activeQuiz} onClose={onCloseQuiz} />
                </div>
              </div>
            ) : activeVideoUrl ? (
              <div className="w-full h-full relative">
                {(activeVideoUrl as string).match(/\.(mp4|webm|ogg)$/i) ? (
                  <video ref={videoRef} controls className="w-full h-full bg-black">
                    <source src={activeVideoUrl} />
                  </video>
                ) : (
                  <iframe
                    src={activeVideoUrl}
                    className="w-full h-full"
                    allowFullScreen
                    title={activeSubmoduleTitle ?? "Embedded video"}
                  />
                )}
                <div className="absolute top-4 left-4 pointer-events-none">
                   <div className="px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded border border-white/10 flex items-center gap-1.5">
                     <span className="w-1 h-1 rounded-full bg-indigo-400" />
                     <span className="text-[9px] font-bold text-white uppercase tracking-widest">Active Lesson</span>
                   </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-8">
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700 text-slate-500">
                  <Play size={20} className="ml-0.5" />
                </div>
                <h3 className="text-white text-sm font-bold">Ready to learn?</h3>
                <p className="text-slate-500 text-[11px] mt-1">Select a module or quiz to begin your session.</p>
              </div>
            )}
          </div>
        </div>

        {/* MINIMAL INFO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* MODULE SUMMARY */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Layers size={14} className="text-indigo-600" />
              <h3 className="font-bold text-sm text-slate-900 tracking-tight">
                {activeModule?.name ?? "Module Summary"}
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal font-medium flex-1">
              {activeModule?.description ?? "Select a curriculum module to view details and objectives."}
            </p>
            {activeSubmoduleTitle && (
              <div className="mt-4 pt-3 border-t border-slate-50 flex items-center gap-2">
                <Play size={10} className="text-indigo-600" fill="currentColor" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Current:</span>
                <span className="text-[11px] font-bold text-slate-700 truncate">{activeSubmoduleTitle}</span>
              </div>
            )}
          </div>

          {/* COMPACT DETAILS */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-slate-400">
                <User size={14} />
                <span className="text-[9px] font-bold uppercase tracking-widest">Student Info</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <label className="block text-[9px] text-slate-400 font-bold uppercase">Name</label>
                  <p className="text-[11px] font-bold text-slate-800">{student.name}</p>
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 font-bold uppercase">Batch</label>
                  <p className="text-[11px] font-bold text-slate-800">#{student.batch_id ?? "N/A"}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-[9px] text-slate-400 font-bold uppercase">Email</label>
                  <p className="text-[11px] font-bold text-slate-800 truncate">{student.email}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Info size={14} className="text-indigo-400" />
                  <span className="text-[10px] font-bold uppercase tracking-tight">Stats</span>
                </div>
                <span className="text-[8px] font-bold text-indigo-400 bg-white/5 px-1.5 py-0.5 rounded">Live</span>
              </div>
              
              <div className="space-y-1.5 text-[10px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Modules</span>
                  <span className="font-bold">{course?.modules?.length ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Lessons</span>
                  <span className="font-bold">
                    {course?.modules?.flatMap((m) => m.submodules ?? [])?.flatMap((s) => s.videos ?? [])?.length ?? 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}