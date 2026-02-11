// components/CourseModules.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ChevronDown,
  ChevronUp,
  Play,
  BookOpen,
  Video,
  Lock,
  CheckCircle2,
} from "lucide-react";
import Modal from "@/components/Modal";
import BookingApp from "@/components/MentorsBooking";

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

type ProgressEntry = {
  positionSeconds: number;
  completed: boolean;
};

type Props = {
  course: Course | null;
  allowedModules?: string[];
  progress?: Record<string, number[]>; // existing server-side completion structure (by module)
  onPlayVideo: (
    videoUrl: string,
    title?: string,
    moduleId?: string,
    videoIndex?: number,
    options?: { resumeSeconds?: number; autoplay?: boolean }
  ) => void;
  onReportPlayerProgress?: (globalIndex: number, positionSeconds: number, completed?: boolean) => void;
};

/* ===== CONSTANTS ===== */
const FREE_PREVIEW_COUNT = 5;
const GUEST_PROGRESS_KEY = (courseId: string) => `guest_progress_${courseId || "unknown_course"}`;

/* ===========================
   Helper: flatten videos -> global indexing
   Accepts Course | null to avoid TS null issues
   =========================== */
function flattenCourseVideos(course: Course | null) {
  const out: Array<{
    moduleIndex: number;
    subIndex: number;
    videoIndex: number;
    moduleId?: string;
    submoduleId?: string;
    videoId?: string;
    title?: string;
    url?: string;
    key: string;
  }> = [];

  if (!course?.modules) return out;

  course.modules.forEach((m, mi) => {
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
          videoId: v.id,
          key,
        });
      });
    });
  });

  return out;
}

/* ===========================
   Component
   =========================== */
export default function CourseModules({
  course,
  allowedModules = [],
  progress = {},
  onPlayVideo,
  onReportPlayerProgress,
}: Props): React.ReactElement {
  const [openModuleId, setOpenModuleId] = useState<string | null>(null);
  const [openSubKey, setOpenSubKey] = useState<string | null>(null);
  const [activeVideoKey, setActiveVideoKey] = useState<string | null>(null);

  const [guestProgress, setGuestProgress] = useState<Set<number>>(new Set());
  const [meetModalOpen, setMeetModalOpen] = useState(false);

  // serverProgress: map globalIndex -> ProgressEntry
  const [serverProgress, setServerProgress] = useState<Map<number, ProgressEntry>>(new Map());
  const saveTimersRef = useRef<Record<number, number | null>>({});

  // detect free-login user (client-only)
  const [isFreeLoggedIn, setIsFreeLoggedIn] = useState<boolean>(false);

  const router = useRouter();

const handleJoinFullCourse = () => {
  router.push("/enroll"); // 👈 your enroll page route
};


  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const u = JSON.parse(raw);
        // we consider loginType 'guest' as free login (from your free login implementation)
        if (u?.loginType === "guest" || u?.role === "guest" || u?.loginType === "free") {
          setIsFreeLoggedIn(true);
          return;
        }
      }
      // fallback: if course_user_key exists and not a paid allowedModules array, treat as free
      const ck = localStorage.getItem("course_user_key");
      if (ck && (!allowedModules || allowedModules.length === 0)) {
        setIsFreeLoggedIn(true);
        return;
      }
      setIsFreeLoggedIn(false);
    } catch {
      setIsFreeLoggedIn(false);
    }
    // only run on mount and when allowedModules changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedModules.join?.(",")]);

  // normalize courseId to a guaranteed string
  const courseId = course?.courseId ?? "";

  const getUserKey = (): string => {
    try {
      let userKey = localStorage.getItem("course_user_key");
      if (!userKey) {
        userKey = crypto.randomUUID();
        localStorage.setItem("course_user_key", userKey);
        console.log("[CourseModules] created userKey:", userKey);
      }
      return userKey!;
    } catch {
      return "guest-" + Date.now();
    }
  };

  // Auto-open first module + first submodule for free users
  useEffect(() => {
    if (!course?.modules?.length) return;
    if (!isFreeLoggedIn) return;

    const firstModule = course.modules[0];
    const firstModuleKey = firstModule.moduleId ?? `module-0`;

    setOpenModuleId(firstModuleKey);
    if (firstModule.submodules?.length) {
      setOpenSubKey(`${firstModuleKey}-sub-0`);
    } else {
      setOpenSubKey(null);
    }
  }, [course, isFreeLoggedIn]);

  // fetch saved progress for guest userKey (GET supports video_id + legacy)
  useEffect(() => {
    if (!courseId) return;
    let mounted = true;
    (async () => {
      try {
        const userKey = getUserKey();
        console.log("[CourseModules] fetching server progress for", { courseId, userKey });
        const res = await fetch(`/api/course_progress?courseId=${encodeURIComponent(courseId)}&userKey=${encodeURIComponent(userKey)}`);
        if (!res.ok) {
          console.warn("[CourseModules] fetch progress returned not ok:", res.status, await res.text());
          return;
        }
        const data = (await res.json()) as Array<any>;
        console.log("[CourseModules] fetched progress:", data);
        if (!mounted) return;

        // Build a map from videoId -> globalIndex for mapping server responses that return video_id
        const flat = flattenCourseVideos(course);
        const videoIdToGlobalIndex = new Map<string, number>();
        flat.forEach((fv, idx) => {
          if (fv.videoId) videoIdToGlobalIndex.set(fv.videoId, idx);
        });

        const map = new Map<number, ProgressEntry>();
        data.forEach((d) => {
          // support both legacy (global_index / globalIndex) and new (video_id / videoId) shapes
          let gIdx = -1;
          if (typeof d.globalIndex === "number") {
            gIdx = d.globalIndex;
          } else if (typeof d.global_index === "number") {
            gIdx = d.global_index;
          } else if (d.videoId || d.video_id) {
            const vid = d.videoId ?? d.video_id;
            const maybe = videoIdToGlobalIndex.get(vid);
            if (typeof maybe === "number") gIdx = maybe;
            else {
              // fallback: try to find by matching string id on flat array
              const findIdx = flat.findIndex((fv) => fv.videoId === vid);
              if (findIdx >= 0) gIdx = findIdx;
            }
          }

          if (gIdx >= 0) {
            map.set(gIdx, { positionSeconds: Number(d.positionSeconds ?? d.position_seconds ?? 0), completed: Boolean(d.completed) });
          }
        });
        setServerProgress(map);
      } catch (err) {
        console.error("[CourseModules] error fetching progress:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [courseId, course]);

  useEffect(() => {
    if (!courseId) {
      setGuestProgress(new Set());
      return;
    }
    try {
      const raw = localStorage.getItem(GUEST_PROGRESS_KEY(courseId));
      if (raw) setGuestProgress(new Set(JSON.parse(raw) as number[] || []));
      else setGuestProgress(new Set());
    } catch {
      setGuestProgress(new Set());
    }
  }, [courseId]);

  // listen for global custom event dispatched when the native player completes a video
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        // typed as CustomEvent
        const ce = e as CustomEvent<{ globalIndex: number }>;
        if (typeof ce.detail?.globalIndex === "number") {
          console.log("[CourseModules] received lms_video_completed event", ce.detail.globalIndex);
          handleVideoCompleted(ce.detail.globalIndex);
        }
      } catch (err) {
        // ignore
      }
    };
    window.addEventListener("lms_video_completed", handler as EventListener);
    return () => window.removeEventListener("lms_video_completed", handler as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverProgress, guestProgress, course]);

  const allowedSet = useMemo(() => new Set(allowedModules || []), [allowedModules]);
  const isPaidUser = Boolean(allowedModules && allowedModules.length > 0);

  if (!course || !course.modules?.length) {
    return (
      <div className="p-6 text-center border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm">
        No course curriculum available.
      </div>
    );
  }

  const flatVideos = useMemo(() => flattenCourseVideos(course), [course]);
  const globalIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    flatVideos.forEach((v, idx) => {
      const id = `${v.moduleId}__${v.submoduleId}__${v.videoId}`;
      map.set(id, idx);
    });
    return map;
  }, [flatVideos]);

  const videoKeyToGlobalIndex = useMemo(() => {
    const map = new Map<string, number>();
    flatVideos.forEach((v, idx) => map.set(v.key, idx));
    return map;
  }, [flatVideos]);

  // completed set is combined from serverProgress, guestProgress and existing `progress` (server by module)
  const completedSet = useMemo(() => {
    const s = new Set<number>();

    if (course.modules) {
      course.modules.forEach((m) => {
        const moduleId = m.moduleId;
        const completedForModule = moduleId ? progress?.[moduleId] ?? [] : [];
        if (moduleId && Array.isArray(completedForModule)) {
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

    serverProgress.forEach((entry, idx) => {
      if (entry.completed) s.add(idx);
    });

    guestProgress.forEach((g) => s.add(g));
    return s;
  }, [progress, flatVideos, videoKeyToGlobalIndex, guestProgress, course.modules, serverProgress]);

  const completedCount = completedSet.size;
  const isVideoFreePreview = (globalIndex: number) => globalIndex >= 0 && globalIndex < FREE_PREVIEW_COUNT;
  const areAllPreviousCompleted = (globalIndex: number) => {
    if (globalIndex <= 0) return true;
    for (let i = 0; i < globalIndex; i++) {
      if (!completedSet.has(i)) return false;
    }
    return true;
  };

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

  const unlockedModulesSet = useMemo(() => {
    const s = new Set<string>();
    const modules = course.modules ?? [];

    modules.forEach((m) => {
      if (m.moduleId && allowedSet.has(m.moduleId)) s.add(m.moduleId);
    });

    for (let i = 0; i < modules.length; i++) {
      const m = modules[i];
      const mid = m.moduleId ?? `module-${i}`;
      if (s.has(mid)) continue;
      if (i === 0) continue;
      const prev = modules[i - 1];
      const prevId = prev.moduleId ?? `module-${i - 1}`;
      if (s.has(prevId) && isModuleCompletedByCompletedSet(prev)) s.add(mid);
    }
    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.modules, allowedSet, completedSet, flatVideos]);

  useEffect(() => {
    try {
      if (courseId) {
        const arr = Array.from(guestProgress.values());
        localStorage.setItem(GUEST_PROGRESS_KEY(courseId), JSON.stringify(arr));
      }
    } catch {
      // ignore
    }
  }, [guestProgress, courseId]);

  const markGuestCompleted = (gIndex: number) => {
    setGuestProgress((prev) => {
      if (prev.has(gIndex)) return prev;
      const next = new Set(prev);
      next.add(gIndex);
      return next;
    });
  };

  // Internal save: used when parent doesn't supply onReportPlayerProgress
  const saveProgressToServerInternal = async (globalIndex: number, positionSeconds: number, completed = false) => {
    if (!courseId) {
      if (completed) markGuestCompleted(globalIndex);
      return;
    }

    if (saveTimersRef.current[globalIndex]) {
      window.clearTimeout(saveTimersRef.current[globalIndex]!);
    }

    saveTimersRef.current[globalIndex] = window.setTimeout(async () => {
      try {
        const userKey = getUserKey();
        // determine videoId for this globalIndex (if available)
        const fv = flatVideos[globalIndex];
        const videoId = fv?.videoId;

        const payload: any = {
          userKey,
          courseId,
          positionSeconds: Math.floor(Math.max(0, positionSeconds)),
          completed,
        };

        if (videoId) {
          // prefer new videoId flow
          payload.videoId = videoId;
        } else {
          // fallback to legacy globalIndex
          payload.globalIndex = globalIndex;
        }

        console.log("[CourseModules] internal save: starting", { globalIndex, positionSeconds, completed, courseId, userKey, payload });
        const res = await fetch("/api/course_progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          console.warn("[CourseModules] internal save server error", await res.text());
        } else {
          console.log("[CourseModules] internal save success", { globalIndex });
        }

        setServerProgress((prev) => {
          const next = new Map(prev);
          next.set(globalIndex, { positionSeconds, completed });
          return next;
        });
      } catch (err) {
        console.error("[CourseModules] internal save error:", err);
      } finally {
        saveTimersRef.current[globalIndex] = null;
      }
    }, 1200);
  };

  // use parent's handler if provided; otherwise use internal
  const reportProgress = onReportPlayerProgress ?? saveProgressToServerInternal;

  const getResumeSecondsForGlobalIndex = (globalIndex: number): number | undefined => {
    const s = serverProgress.get(globalIndex);
    if (s?.positionSeconds && s.positionSeconds > 1) return s.positionSeconds;
    return undefined;
  };

  const handleBookMeet = () => {
    setMeetModalOpen(true);
  };

   

  const hasCompletedFirstVideo = completedSet.has(0);

  // Play by global index (uses resume if available)
  const playGlobalIndex = (globalIndex: number, autoplay = false) => {
    const fv = flatVideos[globalIndex];
    if (!fv || !fv.url) {
      console.warn("[CourseModules] playGlobalIndex: missing url", { globalIndex, fv });
      return;
    }
    const module = course.modules?.[fv.moduleIndex];
    const moduleIdSafe = module?.moduleId ?? "";
    const resume = getResumeSecondsForGlobalIndex(globalIndex);
    console.log("[CourseModules] playGlobalIndex -> onPlayVideo", { globalIndex, url: fv.url, resume, autoplay });
    setActiveVideoKey(fv.key);
    onPlayVideo(fv.url!, fv.title, moduleIdSafe, fv.videoIndex, { resumeSeconds: resume, autoplay });
  };

  // called either from our custom event listener or internally
  const handleVideoCompleted = (globalIndex: number) => {
    console.log("[CourseModules] handleVideoCompleted for", globalIndex);
    markGuestCompleted(globalIndex);

    const resumeForSave = serverProgress.get(globalIndex)?.positionSeconds ?? 0;
    console.log("[CourseModules] saving completed true", { globalIndex, resumeForSave });
    reportProgress(globalIndex, resumeForSave, true);

    // ⭐ find next UNCOMPLETED video instead of next index
    let nextIndex = -1;
    for (let i = globalIndex + 1; i < flatVideos.length; i++) {
      if (!completedSet.has(i)) {
        nextIndex = i;
        break;
      }
    }

    if (nextIndex !== -1 && nextIndex < flatVideos.length) {
      const nextFlat = flatVideos[nextIndex];
      const nextModuleIdx = nextFlat.moduleIndex;
      const nextModule = course.modules?.[nextModuleIdx];
      const nextModuleKey = nextModule?.moduleId ?? `module-${nextModuleIdx}`;
      const nextModuleUnlocked = Boolean(
        (nextModule?.moduleId && (unlockedModulesSet.has(nextModule.moduleId) || allowedSet.has(nextModule.moduleId))) ||
          (!nextModule?.moduleId && unlockedModulesSet.has(nextModuleKey))
      );

      console.log("[CourseModules] nextIndex check", { nextIndex, nextModuleUnlocked });
      if (nextModuleUnlocked || isVideoFreePreview(nextIndex)) {
        setTimeout(() => {
          console.log("[CourseModules] autoplaying nextIndex", nextIndex);
          playGlobalIndex(nextIndex, true);
        }, 300);
      } else {
        console.log("[CourseModules] nextIndex not unlocked", nextIndex);
      }
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">{course.name}</h2>
        <p className="text-xs text-gray-500 mt-1">{course.description}</p>

        <div className="flex items-center gap-4 mt-3">
          <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
            <BookOpen size={14} /> {course.modules.length} Modules
          </span>
          <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
            <Video size={14} /> Video Lessons
          </span>

          {/* If paid user show Book Meet as before */}
          {isPaidUser && (
            <div className="ml-auto">
              <button
                onClick={handleBookMeet}
                type="button"
                className="px-3 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                Book A meet with mentors
              </button>
            </div>
          )}

          {/* If user is free-logged in show upgrade button */}
          {isFreeLoggedIn && !isPaidUser && (
            <div className="ml-auto">
  <button
    onClick={handleJoinFullCourse}
    type="button"
    className="px-3 py-2 bg-amber-500 text-white text-sm font-semibold rounded-md hover:bg-amber-600 focus:outline-none"
  >
    Upgrade your Access
  </button>
</div>

          )}
        </div>
      </div>

      {/* Modules */}
      <div className="space-y-2">
        {course.modules.map((module, moduleIndex) => {
          const moduleKey = module.moduleId ?? `module-${moduleIndex}`;
          const isOpen = openModuleId === moduleKey;

          // ⭐ Module unlocked logic:
          // - If free logged in => only first module (index 0) unlocked
          // - Otherwise use existing allowed modules logic
          const moduleUnlocked = isFreeLoggedIn
            ? moduleIndex === 0 // only first module unlocked for free users
            : Boolean(
                (module.moduleId && (unlockedModulesSet.has(module.moduleId) || allowedSet.has(module.moduleId))) ||
                  (!module.moduleId && unlockedModulesSet.has(moduleKey))
              );

          return (
            <div key={moduleKey} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              {/* Module header */}
              <div
                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${isOpen ? "bg-gray-50" : "hover:bg-gray-50"}`}
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
                          setOpenModuleId(null);
                          setOpenSubKey(null);
                          setActiveVideoKey(null);
                        } else {
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
                        Upgrade to Access
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submodules list */}
              {isOpen && (
                <div className="border-t border-gray-100 divide-y divide-gray-50">
                  {module.submodules && module.submodules.length > 0 ? (
                    module.submodules.map((sub, subIndex) => {
                      const subKey = `${moduleKey}-sub-${subIndex}`;
                      const subIsOpen = openSubKey === subKey;

                      return (
                        <div key={subKey} className={`p-3 transition-colors ${subIsOpen ? "bg-indigo-50/20" : "hover:bg-gray-50"}`}>
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
                              className="flex-1 text-left flex items-start gap-3"
                            >
                              <Play size={14} className={`mt-0.5 ${subIsOpen ? "text-indigo-600" : "text-gray-300"}`} />
                              <div className="space-y-0.5">
                                <h4 className={`text-sm font-medium ${subIsOpen ? "text-indigo-900" : "text-gray-700"}`}>{sub.title}</h4>
                                <p className="text-[10px] text-gray-400">{sub.description}</p>
                              </div>
                            </button>

                            <div className="flex items-center gap-3">
                              {sub.videos && sub.videos.length > 0 ? (
                                <div className="text-[11px] text-gray-500">{sub.videos.length} videos</div>
                              ) : (
                                <div className="text-xs text-gray-300">No videos</div>
                              )}
                              <CheckCircle2 size={14} className={subIsOpen ? "text-indigo-400" : "text-gray-200"} />
                            </div>
                          </div>

                          {/* Videos list */}
                          {subIsOpen && (
                            <div className="mt-3 space-y-2">
                              {sub.videos && sub.videos.length > 0 ? (
                                sub.videos.map((v, vIdx) => {
                                  const flat = flatVideos.find(
                                    (fv) => fv.moduleIndex === moduleIndex && fv.subIndex === subIndex && fv.videoIndex === vIdx
                                  );
                                  const videoKey = flat?.key ?? `${moduleKey}-sub-${subIndex}-vid-${vIdx}`;
                                  const globalIndex = videoKeyToGlobalIndex.get(videoKey) ?? -1;
                                  const isVideoActive = activeVideoKey === videoKey;

                                  const alreadyCompleted = globalIndex >= 0 && completedSet.has(globalIndex);
                                  const previousAllCompleted = areAllPreviousCompleted(globalIndex);
                                  const freePreview = isVideoFreePreview(globalIndex);

                                  // allow playing if already completed OR previousAllCompleted AND (moduleUnlocked OR freePreview)
                                  const canPlay = alreadyCompleted || (previousAllCompleted && (moduleUnlocked || freePreview));

                                  return (
                                    <div
                                      key={videoKey}
                                      className={`flex items-center justify-between gap-3 p-2 rounded-md transition ${isVideoActive ? "bg-indigo-100/60" : "hover:bg-gray-50"}`}
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
                                              if (!canPlay) return;
                                              setActiveVideoKey(videoKey);

                                              // fetch resume seconds if available
                                              const resume = getResumeSecondsForGlobalIndex(globalIndex);
                                              const safeModuleId = module.moduleId ?? "";

                                              onPlayVideo(v.url!, v.title, safeModuleId, vIdx, { resumeSeconds: resume });
                                              if (!moduleUnlocked && freePreview && globalIndex >= 0) {
                                                markGuestCompleted(globalIndex);
                                              }
                                            }}
                                            className={`text-[11px] font-semibold ${canPlay ? "text-indigo-600 hover:text-indigo-800" : "text-gray-300 cursor-not-allowed"} uppercase tracking-wider`}
                                            disabled={!canPlay}
                                          >
                                            Play
                                          </button>
                                        ) : (
                                          <span className="text-xs text-gray-300">No URL</span>
                                        )}
                                      </div>

                                      {globalIndex === FREE_PREVIEW_COUNT - 1 && hasCompletedFirstVideo && (
                                        <div className="w-full mt-3">
                                          {isPaidUser ? (
                                            <div className="flex items-center gap-3">
                                              <button
                                                onClick={handleBookMeet}
                                                disabled={completedCount < FREE_PREVIEW_COUNT}
                                                className={`px-3 py-2 rounded-md text-sm font-semibold ${completedCount >= FREE_PREVIEW_COUNT ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                                              >
                                                Book A meet with mentors
                                              </button>
                                              <span className="text-xs text-gray-400">({completedCount}/{FREE_PREVIEW_COUNT} completed)</span>
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-3">
                                              <button onClick={handleJoinFullCourse} className="px-3 py-2 rounded-md text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600">
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

      {/* Modal for booking meet */}
      <Modal isOpen={meetModalOpen} onClose={() => setMeetModalOpen(false)}>
        <BookingApp onSuccess={() => setMeetModalOpen(false)} />
      </Modal>
    </div>
  );
}
