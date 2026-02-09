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
   * Progress map keyed by moduleId -> array of completed video indexes (local to that module)
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

/* ===== CONSTANTS ===== */
const FREE_PREVIEW_COUNT = 5;
const GUEST_PROGRESS_KEY = (courseId?: string) => `guest_progress_${courseId ?? "unknown_course"}`;

/* ===== HELPERS ===== */
function flattenCourseVideos(course: Course) {
  // returns array of { moduleIndex, subIndex, videoIndex, moduleId, submoduleId, title, url, key }
  const out: Array<{
    moduleIndex: number;
    subIndex: number;
    videoIndex: number;
    moduleId?: string;
    submoduleId?: string;
    title?: string;
    url?: string;
    key: string;
  }> = [];

  course.modules?.forEach((m, mi) => {
    m.submodules?.forEach((s, si) => {
      s.videos?.forEach((v, vi) => {
        const moduleKeyPart = m.moduleId ?? `module-${mi}`;
        const key = `${moduleKeyPart}-sub-${si}-vid-${vi}`;
        out.push({
          moduleIndex: mi,
          subIndex: si,
          videoIndex: vi,
          moduleId: m.moduleId,
          submoduleId: s.submoduleId,
          title: v.title,
          url: v.url,
          key,
        });
      });
    });
  });

  return out;
}

/* ===== COMPONENT ===== */
export default function CourseModules({
  course,
  allowedModules = [],
  progress = {},
  onPlayVideo,
}: Props): React.ReactElement {
  const [openModuleId, setOpenModuleId] = useState<string | null>(null);
  const [openSubKey, setOpenSubKey] = useState<string | null>(null);
  const [activeVideoKey, setActiveVideoKey] = useState<string | null>(null);

  // guestProgress stores global video indexes (numbers) the guest has "completed" in localStorage
  const [guestProgress, setGuestProgress] = useState<Set<number>>(new Set());

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

    // load guest progress from localStorage for this course
    if (course?.courseId) {
      try {
        const raw = localStorage.getItem(GUEST_PROGRESS_KEY(course.courseId));
        if (raw) {
          const arr = JSON.parse(raw) as number[];
          setGuestProgress(new Set(arr || []));
        } else {
          setGuestProgress(new Set());
        }
      } catch (e) {
        console.warn("Could not load guest progress from localStorage", e);
        setGuestProgress(new Set());
      }
    } else {
      setGuestProgress(new Set());
    }
  }, [course]);

  const allowedSet = useMemo(() => new Set(allowedModules || []), [allowedModules]);

  // isPaidUser: show Book button only for paid users
  const isPaidUser = Boolean(allowedModules && allowedModules.length > 0);

  if (!course || !course.modules?.length) {
    console.warn("⚠️ No course or no modules — will render fallback UI", course);
    return (
      <div className="p-6 text-center border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm">
        No course curriculum available.
      </div>
    );
  }

  // flatten to a single list so we can compute "first 5 videos of the course" easily
  const flatVideos = useMemo(() => flattenCourseVideos(course), [course]);

  // map: videoKey -> globalIndex
  const videoKeyToGlobalIndex = useMemo(() => {
    const map = new Map<string, number>();
    flatVideos.forEach((v, idx) => map.set(v.key, idx));
    return map;
  }, [flatVideos]);

  // Build completedSet from:
  // - progress prop (moduleId -> video indexes (local to that module))
  // - guestProgress (already global indices)
  const completedSet = useMemo(() => {
    const s = new Set<number>();

    // from progress prop (server / logged-in progress)
    if (course.modules) {
      course.modules.forEach((m) => {
        const moduleId = m.moduleId;
        const completedForModule = moduleId ? progress?.[moduleId] ?? [] : [];
        if (moduleId && Array.isArray(completedForModule)) {
          // get videos in this module in order
          const moduleVideos = flatVideos.filter((fv) => fv.moduleId === moduleId);
          moduleVideos.forEach((fv, localIdx) => {
            if (completedForModule.includes(localIdx)) {
              const gIdx = videoKeyToGlobalIndex.get(fv.key);
              if (typeof gIdx === "number") s.add(gIdx);
            }
          });
        }
      });
    }

    // guest progress (global indices)
    guestProgress.forEach((g) => s.add(g));

    return s;
  }, [progress, flatVideos, videoKeyToGlobalIndex, guestProgress, course.modules]);

  // number of completed videos (unique)
  const completedCount = completedSet.size;

  // helper: is a given global index part of the free preview
  const isVideoFreePreview = (globalIndex: number) => globalIndex >= 0 && globalIndex < FREE_PREVIEW_COUNT;

  // helper: are ALL videos before globalIndex completed?
  const areAllPreviousCompleted = (globalIndex: number) => {
    if (globalIndex <= 0) return true;
    for (let i = 0; i < globalIndex; i++) {
      if (!completedSet.has(i)) return false;
    }
    return true;
  };

  // utility: check if all videos of a module are completed according to completedSet
  const isModuleCompletedByCompletedSet = (module: Module) => {
    if (!module.submodules?.length) return true;
    for (const [si, s] of module.submodules.entries()) {
      for (let vi = 0; vi < (s.videos?.length ?? 0); vi++) {
        const flat = flatVideos.find(
          (fv) => fv.moduleId === module.moduleId && fv.subIndex === si && fv.videoIndex === vi
        );
        if (!flat) return false;
        const gIdx = videoKeyToGlobalIndex.get(flat.key);
        if (typeof gIdx !== "number" || !completedSet.has(gIdx)) return false;
      }
    }
    return true;
  };

  // Build unlockedModules set:
  // - seed with allowedSet (paid modules)
  // - then iterate modules in order: if previous module is unlocked and previous module is completed, unlock next
  const unlockedModulesSet = useMemo(() => {
    const s = new Set<string>();
    const modules = course.modules ?? [];

    // mark allowed modules first
    modules.forEach((m) => {
      if (m.moduleId && allowedSet.has(m.moduleId)) s.add(m.moduleId);
    });

    // iterate in order and chain unlocks
    for (let i = 0; i < modules.length; i++) {
      const m = modules[i];
      const mid = m.moduleId ?? `module-${i}`;

      if (s.has(mid)) continue;
      if (i === 0) continue; // do not auto-unlock module 0

      const prev = modules[i - 1];
      const prevId = prev.moduleId ?? `module-${i - 1}`;

      if (s.has(prevId) && isModuleCompletedByCompletedSet(prev)) {
        s.add(mid);
      }
    }

    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.modules, allowedSet, completedSet, flatVideos]);

  // Save guestProgress to localStorage whenever it changes
  useEffect(() => {
    try {
      if (course?.courseId) {
        const arr = Array.from(guestProgress.values());
        localStorage.setItem(GUEST_PROGRESS_KEY(course.courseId), JSON.stringify(arr));
      }
    } catch (e) {
      console.warn("Could not save guest progress to localStorage", e);
    }
  }, [guestProgress, course?.courseId]);

  // Handler to mark a globalIndex completed for guest users
  const markGuestCompleted = (gIndex: number) => {
    setGuestProgress((prev) => {
      if (prev.has(gIndex)) return prev;
      const next = new Set(prev);
      next.add(gIndex);
      return next;
    });
  };

  // Book a meet handler (replace with your modal or navigation)
  const handleBookMeet = () => {
    console.log("🗓 Book a meet clicked");
    window.open("https://your-site.example.com/book-meet", "_blank");
  };

  // Join full course handler for free users
  const handleJoinFullCourse = () => {
    console.log("🛒 Join Full course clicked");
    window.location.href = "https://your-site.example.com/join-full-course";
  };

  // New: only show CTAs after first video completed
  const hasCompletedFirstVideo = completedSet.has(0);

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
          const moduleKey = module.moduleId ?? `module-${moduleIndex}`;
          const isOpen = openModuleId === moduleKey;

          // module unlocked either because it's in allowedModules OR because it was unlocked via completion chain above
          const moduleUnlocked = Boolean(
            (module.moduleId && (unlockedModulesSet.has(module.moduleId) || allowedSet.has(module.moduleId))) ||
              (!module.moduleId && unlockedModulesSet.has(moduleKey))
          );

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
                    {!moduleUnlocked && (
                      <div className="text-xs text-red-500 mt-1">🔒 Locked — contact admin to unlock</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {moduleUnlocked ? (
                    <button
                      type="button"
                      onClick={() => {
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

              {/* Submodules list (visible when module open and unlocked) */}
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
                                if (!moduleUnlocked) {
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
                                <h4 className={`text-sm font-medium ${subIsOpen ? "text-indigo-900" : "text-gray-700"}`}>{sub.title}</h4>
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
                                  // find global flat entry
                                  const flat = flatVideos.find(
                                    (fv) => fv.moduleIndex === moduleIndex && fv.subIndex === subIndex && fv.videoIndex === vIdx
                                  );
                                  const videoKey = flat?.key ?? `${moduleKey}-sub-${subIndex}-vid-${vIdx}`;
                                  const globalIndex = videoKeyToGlobalIndex.get(videoKey) ?? -1;
                                  const isVideoActive = activeVideoKey === videoKey;

                                  // check completion and sequential rules
                                  const alreadyCompleted = globalIndex >= 0 && completedSet.has(globalIndex);
                                  const previousAllCompleted = areAllPreviousCompleted(globalIndex);
                                  const freePreview = isVideoFreePreview(globalIndex);

                                  // canPlay: either replay already completed OR previous videos all completed AND (module unlocked OR free preview)
                                  const canPlay = alreadyCompleted || (previousAllCompleted && (moduleUnlocked || freePreview));

                                  return (
                                    <div
                                      key={videoKey}
                                      className={`flex items-center justify-between gap-3 p-2 rounded-md transition ${
                                        isVideoActive ? "bg-indigo-100/60" : "hover:bg-gray-50"
                                      }`}
                                    >
                                      <div className="flex-1 text-left">
                                        <div className={`text-sm font-medium ${isVideoActive ? "text-indigo-900" : "text-gray-800"}`}>{v.title}</div>
                                        {isVideoActive && v.url && <div className="text-xs text-gray-500 mt-1">Playing: {v.title}</div>}
                                        {!canPlay && moduleUnlocked && (
                                          <div className="text-xs text-rose-600 mt-1">Complete previous video to unlock this</div>
                                        )}
                                        {!canPlay && !moduleUnlocked && freePreview && (
                                          <div className="text-xs text-rose-600 mt-1">Complete previous video to unlock this preview</div>
                                        )}
                                        {alreadyCompleted && <div className="text-xs text-green-600 mt-1">Completed</div>}
                                      </div>

                                      <div className="flex items-center gap-2">
                                        {v.url ? (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (!canPlay) {
                                                console.log("Attempt to play video before allowed:", {
                                                  moduleId: module.moduleId,
                                                  videoIndex: vIdx,
                                                  globalIndex,
                                                });
                                                return;
                                              }

                                              console.log(`▶ Play clicked: module=${moduleKey} sub=${subKey} video=${videoKey}`, {
                                                moduleId: module.moduleId,
                                                moduleName: module.name,
                                                submoduleId: sub.submoduleId,
                                                submoduleTitle: sub.title,
                                                videoId: v.id,
                                                videoTitle: v.title,
                                                videoUrl: v.url,
                                                videoIndex: vIdx,
                                                globalIndex,
                                                freePreview,
                                                moduleUnlocked,
                                                alreadyCompleted,
                                              });

                                              setActiveVideoKey(videoKey);
                                              onPlayVideo(v.url!, v.title, module.moduleId || undefined, vIdx);

                                              // If it's a preview (module locked & within FREE_PREVIEW_COUNT) mark guest completion
                                              if (!moduleUnlocked && freePreview && globalIndex >= 0) {
                                                // mark guest completion immediately (or replace with onVideoComplete hook if desired)
                                                markGuestCompleted(globalIndex);
                                              }
                                            }}
                                            className={`text-[11px] font-semibold ${
                                              canPlay ? "text-indigo-600 hover:text-indigo-800" : "text-gray-300 cursor-not-allowed"
                                            } uppercase tracking-wider`}
                                            disabled={!canPlay}
                                          >
                                            Play
                                          </button>
                                        ) : (
                                          <span className="text-xs text-gray-300">No URL</span>
                                        )}
                                      </div>

                                      {/* Render CTA directly under the 5th video (global index FREE_PREVIEW_COUNT-1)
                                          Now: CTA only rendered if first video is completed (hasCompletedFirstVideo) */}
                                      {globalIndex === FREE_PREVIEW_COUNT - 1 && hasCompletedFirstVideo && (
                                        <div className="w-full mt-3">
                                          {isPaidUser ? (
                                            <div className="flex items-center gap-3">
                                              <button
                                                onClick={handleBookMeet}
                                                disabled={completedCount < FREE_PREVIEW_COUNT}
                                                className={`px-3 py-2 rounded-md text-sm font-semibold ${
                                                  completedCount >= FREE_PREVIEW_COUNT
                                                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                }`}
                                              >
                                                Book A meet with mentors
                                              </button>
                                              <span className="text-xs text-gray-400">({completedCount}/{FREE_PREVIEW_COUNT} completed)</span>
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-3">
                                              <button
                                                onClick={handleJoinFullCourse}
                                                className="px-3 py-2 rounded-md text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600"
                                              >
                                                Join Full course
                                              </button>
                                              <span className="text-xs text-gray-400">Unlock the full course and mentoring</span>
                                            </div>
                                          )}
                                        </div>
                                      )}
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
