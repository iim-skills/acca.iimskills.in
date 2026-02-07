"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Play,
  BookOpen,
  Video,
  Lock,
  CheckCircle2,
} from "lucide-react";

/* ===== TYPES ===== */
export type VideoItem = {
  id?: string;
  title?: string;
  url?: string;
};

export type Submodule = {
  submoduleId?: string;
  title?: string;
  description?: string;
  videos?: VideoItem[];
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
  /**
   * List of moduleId strings that the student has access to.
   * e.g. ["MOD_CBL_001","MOD_SBR_001"]
   */
  allowedModules?: string[];
  /**
   * Progress map keyed by moduleId -> array of completed video indexes
   * e.g. { "MOD_CBL_001": [0,1], "MOD_SBR_001": [0] }
   */
  progress?: Record<string, number[]>;
  /**
   * onPlayVideo receives full context:
   * (videoUrl, title?, moduleId?, videoIndex?)
   */
  onPlayVideo: (
    videoUrl: string,
    title?: string,
    moduleId?: string,
    videoIndex?: number
  ) => void;
};

function isModuleCompleted(
  moduleId: string,
  module: Module,
  progress: Record<string, number[]>
): boolean {
  if (!module.submodules?.length) return true;

  const totalVideos =
    module.submodules.reduce(
      (sum, s) => sum + (s.videos?.length ?? 0),
      0
    );

  const completed = progress[moduleId]?.length ?? 0;

  return completed >= totalVideos;
}

function isPreviousModuleCompleted(
  course: Course,
  moduleIndex: number,
  progress: Record<string, number[]>
): boolean {
  if (moduleIndex === 0) return true; // first module always allowed

  const prevModule = course.modules?.[moduleIndex - 1];
  if (!prevModule?.moduleId) return true;

  return isModuleCompleted(prevModule.moduleId, prevModule, progress);
}

/* ===== COMPONENT ===== */
export default function CourseModules({
  course,
  allowedModules = [],
  progress = {},
  onPlayVideo,
}: Props): React.ReactElement {
  const [openModuleId, setOpenModuleId] = useState<string | null>(null);
  const [openSubKey, setOpenSubKey] = useState<string | null>(null); // which submodule is expanded to show videos
  const [activeVideoKey, setActiveVideoKey] = useState<string | null>(null); // which video is selected

  useEffect(() => {
    console.log("📘 CourseModules mounted");
    return () => {
      console.log("📘 CourseModules unmounted");
    };
  }, []);

  useEffect(() => {
    console.log("📘 CourseModules prop `course` changed:", course);
    if (!course) {
      console.warn("⚠️ CourseModules received null course");
    } else if (!Array.isArray(course.modules) || course.modules.length === 0) {
      console.warn("⚠️ CourseModules: course.modules is empty or not an array", course?.modules);
    } else {
      console.log(`ℹ️ CourseModules: ${course.modules.length} modules available`);
    }
  }, [course]);

  // derive a fast lookup set for allowed modules
  const allowedSet = useMemo(() => new Set(allowedModules || []), [allowedModules]);

  if (!course || !course.modules?.length) {
    console.warn("⚠️ No course or no modules — will render fallback UI", course);
    return (
      <div className="p-6 text-center border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm">
        No course curriculum available.
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">{course.name}</h2>
        <p className="text-xs text-gray-500 mt-1">{course.description}</p>
        <div className="flex gap-4 mt-3">
          <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
            <BookOpen size={14} /> {course.modules.length} Modules
          </span>
          <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
            <Video size={14} /> Video Lessons
          </span>
        </div>
      </div>

      {/* Modules */}
      <div className="space-y-2">
        {course.modules.map((module, moduleIndex) => {
          const moduleKey = module.moduleId ?? `${moduleIndex}`;
          const isOpen = openModuleId === moduleKey;

          // Use moduleId as single source-of-truth for allowedModules
          const moduleId = module.moduleId ?? "";
          const isAllowed = Boolean(moduleId && allowedSet.has(moduleId));

          return (
            <div key={moduleKey} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              {/* Module header */}
              <div
                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                  isOpen ? "bg-gray-50" : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-4">
                    {(moduleIndex + 1).toString().padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">{module.name}</h3>
                    <p className="text-[10px] text-gray-400">{module.submodules?.length || 0} lessons</p>
                    {!isAllowed && (
                      <div className="text-xs text-red-500 mt-1">🔒 Locked — contact admin to unlock</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isAllowed ? (
                    <button
                      type="button"
                      onClick={() => {
                        // toggle open only if allowed
                        if (isOpen) {
                          console.log(`🔽 Closing module ${moduleKey} (${module.name})`);
                          setOpenModuleId(null);
                          setOpenSubKey(null);
                          setActiveVideoKey(null);
                        } else {
                          console.log(`🔼 Opening module ${moduleKey} (${module.name})`);
                          setOpenModuleId(moduleKey);
                          setOpenSubKey(null);
                          setActiveVideoKey(null);
                        }
                      }}
                      aria-expanded={isOpen}
                      className="p-1"
                    >
                      {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </button>
                  ) : (
                    <div className="group relative p-1">
                      <Lock size={18} className="text-gray-400" />
                      <div className="hidden group-hover:block absolute -top-10 right-0 bg-black text-white text-xs px-2 py-1 rounded">
                        Contact admin to unlock
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submodules list (visible when module open and allowed) */}
              {isOpen && (
                <div className="border-t border-gray-100 divide-y divide-gray-50">
                  {module.submodules && module.submodules.length > 0 ? (
                    module.submodules.map((sub, subIndex) => {
                      const subKey = `${moduleKey}-sub-${subIndex}`;
                      const subIsOpen = openSubKey === subKey;

                      return (
                        <div key={subKey} className={`p-3 transition-colors ${subIsOpen ? "bg-indigo-50/20" : "hover:bg-gray-50"}`}>
                          <div className="flex items-start justify-between gap-4">
                            {/* Title + description (click to expand submodule to show videos) */}
                            <button
                              type="button"
                              onClick={() => {
                                if (!isAllowed) {
                                  console.log(`Attempt to open locked submodule ${subKey} (${sub.title})`);
                                  return;
                                }
                                if (subIsOpen) {
                                  console.log(`🔽 Closing submodule ${subKey} (${sub.title})`);
                                  setOpenSubKey(null);
                                  setActiveVideoKey(null);
                                } else {
                                  console.log(`🔼 Opening submodule ${subKey} (${sub.title})`);
                                  setOpenSubKey(subKey);
                                  setActiveVideoKey(null);
                                }
                              }}
                              className="flex-1 text-left flex items-start gap-3"
                            >
                              <Play size={14} className={`mt-0.5 ${subIsOpen ? "text-indigo-600" : "text-gray-300"}`} />
                              <div className="space-y-0.5">
                                <h4 className={`text-sm font-medium ${subIsOpen ? "text-indigo-900" : "text-gray-700"}`}>
                                  {sub.title}
                                </h4>
                                <p className="text-[10px] text-gray-400">{sub.description}</p>
                              </div>
                            </button>

                            {/* Right side: if videos exist show count, else lock */}
                            <div className="flex items-center gap-3">
                              {sub.videos && sub.videos.length > 0 ? (
                                <div className="text-[11px] text-gray-500">{sub.videos.length} videos</div>
                              ) : (
                                <div className="text-xs text-gray-300">No videos</div>
                              )}
                              <CheckCircle2 size={14} className={subIsOpen ? "text-indigo-400" : "text-gray-200"} />
                            </div>
                          </div>

                          {/* Videos list (only visible after clicking the submodule) */}
                          {subIsOpen && (
                            <div className="mt-3 space-y-2">
                              {sub.videos && sub.videos.length > 0 ? (
                                sub.videos.map((v, vIdx) => {
                                  const videoKey = `${subKey}-vid-${vIdx}`;
                                  const isVideoActive = activeVideoKey === videoKey;

                                  // sequential-play logic:
                                  // - video already completed -> allow (replay)
                                  // - videoIndex === 0 -> allow
                                  // - otherwise allow only if previous index completed
                                  const completed = moduleId ? (progress?.[moduleId] ?? []) : [];
                                  const alreadyCompleted = completed.includes(vIdx);
                                  const prevCompleted = vIdx === 0 ? true : completed.includes(vIdx - 1);
                                  const canPlay = alreadyCompleted || prevCompleted;

                                  return (
                                    <div
                                      key={videoKey}
                                      className={`flex items-center justify-between gap-3 p-2 rounded-md transition ${
                                        isVideoActive ? "bg-indigo-100/60" : "hover:bg-gray-50"
                                      } ${!isAllowed ? "opacity-50 pointer-events-none" : ""}`}
                                    >
                                      <div className="flex-1 text-left">
                                        <div className={`text-sm font-medium ${isVideoActive ? "text-indigo-900" : "text-gray-800"}`}>
                                          {v.title}
                                        </div>
                                        {isVideoActive && v.url && <div className="text-xs text-gray-500 mt-1">Playing: {v.title}</div>}
                                        {!canPlay && isAllowed && (
                                          <div className="text-xs text-rose-600 mt-1">Complete previous video to unlock this</div>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-2">
                                        {v.url ? (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (!isAllowed) {
                                                console.log("Attempt to play video on locked module:", moduleId);
                                                return;
                                              }
                                              if (!canPlay) {
                                                console.log("Attempt to play video before previous completed:", {
                                                  moduleId,
                                                  videoIndex: vIdx,
                                                });
                                                return;
                                              }

                                              console.log(`▶ Play clicked: module=${moduleKey} sub=${subKey} video=${videoKey}`, {
                                                moduleId,
                                                moduleName: module.name,
                                                submoduleId: sub.submoduleId,
                                                submoduleTitle: sub.title,
                                                videoId: v.id,
                                                videoTitle: v.title,
                                                videoUrl: v.url,
                                                videoIndex: vIdx,
                                              });

                                              setActiveVideoKey(videoKey);
                                              onPlayVideo(v.url!, v.title, moduleId || undefined, vIdx);
                                            }}
                                            className={`text-[11px] font-semibold ${
                                              canPlay ? "text-indigo-600 hover:text-indigo-800" : "text-gray-300 cursor-not-allowed"
                                            } uppercase tracking-wider`}
                                            disabled={!canPlay || !isAllowed}
                                          >
                                            Play
                                          </button>
                                        ) : (
                                          <span className="text-xs text-gray-300">No URL</span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-sm text-gray-400 italic p-2">No videos available for this point.</div>
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
    </div>
  );
}
