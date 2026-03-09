// src/components/ModuleTabs.tsx
"use client";

import React from "react";
import { ChevronDown, ChevronUp, Play, BookOpen, Video, Lock, CheckCircle2, FileText } from "lucide-react";
import { MdDisplaySettings } from "react-icons/md";
import type { Course, Module } from "../../../types/types";

type Props = {
  course: Course;
  openModuleId: string | null;
  openSubKey: string | null;
  setOpenModuleId: (v: string | null) => void;
  setOpenSubKey: (v: string | null) => void;
  activeVideoKey: string | null;
  setActiveVideoKey: (v: string | null) => void;
  flatVideos: Array<any>;
  videoKeyToGlobalIndex: Map<string, number>;
  getMergedForKey: (key: string) => any;
  completedSet: Set<number>;
  allowedModules: string[];
  isFreeLoggedIn: boolean;
  onPlayVideo: (url: string, title?: string, moduleId?: string, videoIndex?: number, options?: any) => void;
  onOpenQuiz?: (quiz: any) => void;
  isVideoFreePreview: (globalIndex: number) => boolean;
  markGuestCompleted: (globalIndex: number) => void;
};

export default function ModuleTabs({
  course,
  openModuleId,
  openSubKey,
  setOpenModuleId,
  setOpenSubKey,
  activeVideoKey,
  setActiveVideoKey,
  flatVideos,
  videoKeyToGlobalIndex,
  getMergedForKey,
  completedSet,
  allowedModules,
  isFreeLoggedIn,
  onPlayVideo,
  onOpenQuiz,
  isVideoFreePreview,
  markGuestCompleted,
}: Props) {
  const allowedSet = new Set(allowedModules || []);

  return (
    <div className="space-y-2">
      {course.modules?.map((module: Module, moduleIndex) => {
        const moduleKey = module.moduleId ?? `module-${moduleIndex}`;
        const isOpen = openModuleId === moduleKey;

        const moduleUnlocked = isFreeLoggedIn
          ? moduleIndex === 0
          : Boolean(
              (module.moduleId && (allowedSet.has(module.moduleId))) ||
                (!module.moduleId && false)
            );

        return (
          <div
            key={moduleKey}
            className={`group transition-all duration-300 rounded-2xl border ${isOpen ? "bg-white border-indigo-100 shadow-md ring-1 ring-indigo-50" : "bg-white border-slate-100 hover:border-slate-200"}`}
          >
            <div
              onClick={() => {
                if (!moduleUnlocked) return;
                if (isOpen) {
                  setOpenModuleId(null);
                  setOpenSubKey(null);
                  setActiveVideoKey(null);
                } else {
                  setOpenModuleId(moduleKey);
                  setOpenSubKey(null);
                  setActiveVideoKey(null);
                }
              }}
              className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors cursor-pointer ${isOpen ? "bg-gray-50" : "hover:bg-gray-50"} ${!moduleUnlocked ? "cursor-not-allowed opacity-70" : ""}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-colors bg-indigo-600 text-white shadow-lg shadow-indigo-100">
                  {(moduleIndex + 1).toString().padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-sm font-bold transition-colors text-slate-900">{module.name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{module.submodules?.length || 0} lessons</p>
                  {!moduleUnlocked && <div className="text-xs text-red-500 mt-1">🔒 Locked — contact admin to unlock</div>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {moduleUnlocked ? (isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />) : <div className="group relative p-1"><Lock size={18} className="text-gray-400" /><div className="hidden group-hover:block absolute -top-10 right-0 bg-black text-white text-xs px-2 py-1 rounded">Upgrade to Access</div></div>}
              </div>
            </div>

            {isOpen && (
              <div className="border-t border-gray-100 divide-y divide-gray-50">
                {module.submodules && module.submodules.length > 0 ? (
                  module.submodules.map((sub, subIndex) => {
                    const moduleKeyPart = module.moduleId ?? `module-${moduleIndex}`;
                    const originalVideos = sub.videos || [];
                    const quizzes = (sub as any).quizzes || [];
                    const subKey = `${moduleKey}-sub-${subIndex}`;
                    const subIsOpen = openSubKey === subKey;

                    return (
                      <div key={subKey} className={`p-3 transition-colors ${subIsOpen ? "bg-blue-50/20" : "hover:bg-gray-50"}`}>
                        <div className="flex items-start justify-between gap-4">
                          <button
                            type="button"
                            onClick={() => {
                              if (!moduleUnlocked) return;
                              if (subIsOpen) {
                                setOpenSubKey(null);
                                setActiveVideoKey(null);
                              } else {
                                setOpenSubKey(subKey);
                                setActiveVideoKey(null);
                              }
                            }}
                            className={`w-full cursor-pointer flex items-center justify-between p-3.5 rounded-xl transition-colors ${subIsOpen ? "bg-blue-100" : "hover:bg-slate-50"}`}
                          >
                            <div className="space-y-0.5">
                              <h4 className={`text-xs font-bold text-indigo-700 ${subIsOpen ? "text-indigo-900" : "text-gray-700"}`}>{sub.title}</h4>
                              <p className="text-[10px] text-gray-400">{sub.description}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <CheckCircle2 size={14} className={subIsOpen ? "text-indigo-400" : "text-gray-200"} />
                            </div>
                          </button>
                        </div>

                        {subIsOpen && (
                          <div className="mt-3 space-y-2">
                            {originalVideos.length > 0 ? (
                              originalVideos.map((vv, idx) => {
                                const videoKey = `${moduleKeyPart}-sub-${subIndex}-vid-${idx}`;
                                const globalIndex = videoKeyToGlobalIndex.get(videoKey) ?? -1;
                                const isVideoActive = activeVideoKey === videoKey;

                                const merged = getMergedForKey(videoKey);
                                const mergedUrl = merged?.url;

                                const alreadyCompleted = globalIndex >= 0 && completedSet.has(globalIndex);
                                const freePreview = isVideoFreePreview(globalIndex);
                                const visible = Boolean(mergedUrl ?? vv.url);
                                const urlToPlay = mergedUrl ?? vv.url;

                                // ✅ First video always active; each subsequent video needs previous completed
                                const isFirstVideo = globalIndex === 0;
                                const previousCompleted = globalIndex > 0 && completedSet.has(globalIndex - 1);

                                const unlocked = Boolean(moduleUnlocked && (isFirstVideo || previousCompleted || alreadyCompleted));

                                return (
                                  <React.Fragment key={videoKey}>
                                    <div className={`flex items-center justify-between gap-3 p-2 rounded-md transition ${isVideoActive ? "" : "hover:bg-gray-50"}`}>
                                      <div className="flex w-full items-center gap-2">
                                        {urlToPlay ? (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (!visible || !unlocked) {
                                                console.warn(`[ModuleTabs] Blocked: visible=${visible}, unlocked=${unlocked}`);
                                                return;
                                              }
                                              setActiveVideoKey(videoKey);
                                              const resume = undefined; // parent can provide resume in prop if needed
                                              onPlayVideo(urlToPlay, vv.title, module.moduleId ?? "", idx, { resumeSeconds: resume });
                                              if (!moduleUnlocked && freePreview && globalIndex >= 0) markGuestCompleted(globalIndex);
                                            }}
                                            className={`group/item w-full flex justify-between items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all bg-white border-slate-100 hover:border-indigo-100 text-slate-600 hover:text-indigo-600 ${!unlocked ? "opacity-70 cursor-not-allowed" : ""}`}
                                            disabled={!visible || !unlocked}
                                          >
                                            <div className="flex justify-between items-center gap-3">
                                              <MdDisplaySettings size={16} className="text-indigo-600" />
                                              <p className="text-xs font-semibold flex items-center gap-2">
                                                {vv.title}
                                                {alreadyCompleted && (
                                                  <span className="inline-flex items-center ml-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 border border-emerald-100">
                                                    <CheckCircle2 size={12} className="text-emerald-500" />
                                                    <span className="ml-1 text-emerald-700">Completed</span>
                                                  </span>
                                                )}
                                              </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              {!unlocked && (
                                                <span className="text-[11px] px-2 py-1 rounded bg-gray-50 border text-gray-400 flex items-center gap-1">
                                                  <Lock size={12} /> Locked
                                                </span>
                                              )}
                                              {unlocked && <p className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded">Play</p>}
                                            </div>
                                          </button>
                                        ) : (
                                          <span className="text-xs text-gray-300">No URL</span>
                                        )}
                                      </div>
                                    </div>

                                    {idx === 0 && quizzes.length > 0 && (
                                      <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-amber-200 bg-amber-50/30 hover:bg-amber-50 cursor-pointer transition-all group/quiz">
                                 {quizzes.map((q: any) => {
  const firstVideoIndex =
    videoKeyToGlobalIndex.get(`${moduleKeyPart}-sub-${subIndex}-vid-0`) ?? -1;

  const quizUnlocked = completedSet.has(firstVideoIndex);

  return (
    <div
      key={q.id}
      className={`flex w-full items-center justify-between p-2 rounded ${
        !quizUnlocked ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <FileText size={16} className="text-indigo-600" />
        <p className="text-xs font-semibold">{q.name}</p>
      </div>

      <button
        onClick={() => {
          if (!quizUnlocked) return;
          onOpenQuiz && onOpenQuiz(q);
        }}
        className={`px-3 py-1 text-[10px] font-bold rounded ${
          quizUnlocked
            ? "bg-indigo-600 text-white"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
        disabled={!quizUnlocked}
      >
        {quizUnlocked ? "TAKE QUIZ" : "LOCKED"}
      </button>
    </div>
  );
})}
                                      </div>
                                    )}
                                  </React.Fragment>
                                );
                              })
                            ) : (
                              <>
                                <div className="text-sm text-gray-400 italic p-2">No videos available.</div>
                                {quizzes.map((q: any) => (
                                  <button
                                    key={q.id}
                                    onClick={() => onOpenQuiz && onOpenQuiz(q)}
                                    className="block w-full text-left text-sm px-3 py-2 rounded-md bg-white border border-indigo-100 hover:bg-indigo-50 text-indigo-700 transition"
                                  >
                                    Take quiz: {q.name ?? "Quiz"}
                                  </button>
                                ))}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-gray-400">
                    <Lock size={16} className="mx-auto mb-1 opacity-50" />
                    <p className="text-[10px] uppercase font-bold tracking-widest">Contents Locked</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}