"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BookingApp from "@/components/MentorsMeetForm";
import {
  ChevronDown,
  ChevronUp,
  Play,
  BookOpen,
  Video,
  Lock,
  CheckCircle2,
  FileText,
} from "lucide-react";
import Modal from "@/components/Modal";
import { MdDisplaySettings } from "react-icons/md";

/* ===== TYPES ===== */
export type VideoItem = {
  id?: string;
  title?: string;
  url?: string;
  videoId?: string;
  thumb?: string;
  duration?: number;
  visible?: boolean;
};

export type Submodule = {
  submoduleId?: string;
  title?: string;
  description?: string;
  videos?: VideoItem[];
  quizzes?: any[];
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

/* =========================
   Progress types and helpers
   ========================= */
type ProgressEntry = {
  positionSeconds: number;
  completed: boolean;
};

type Props = {
  course: Course | null;
  allowedModules?: string[];
  progress?: Record<string, number[]>;
  onPlayVideo: (
    videoUrl: string,
    title?: string,
    moduleId?: string,
    videoIndex?: number,
    options?: { resumeSeconds?: number; autoplay?: boolean }
  ) => void;
  onReportPlayerProgress?: (globalIndex: number, positionSeconds: number, completed?: boolean) => void;
  onOpenQuiz?: (quiz: any) => void;
};

const FREE_PREVIEW_COUNT = 5;
const GUEST_PROGRESS_KEY = (courseId: string) => `guest_progress_${courseId || "unknown_course"}`;

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
          videoId: (v.id ?? v.videoId) as string | undefined,
          key,
        });
      });
    });
  });

  console.log("[flattenCourseVideos] Total flat videos:", out.length, out.map((v, i) => `[${i}] "${v.title}" key=${v.key}`));
  return out;
}

/* =========================
   QUIZ types
   ========================= */
export type QuizQuestion = {
  id?: string;
  text?: string;
  type?: string;
  options?: Array<{ id?: string; text?: string }>;
  correctOption?: string | number;
  correctAnswer?: string;
  answer?: string | number;
};

export type Quiz = {
  id: string;
  name?: string;
  submodule_id?: string;
  course_slug?: string;
  time_minutes?: number;
  questions: QuizQuestion[];
};

/* =========================
   Helpers
   ========================= */
function safeJSONParse(value: any, fallback: any = null) {
  try {
    if (value === null || value === undefined || value === "") return fallback;
    if (typeof value === "string") return JSON.parse(value);
    return value;
  } catch {
    return fallback;
  }
}

/* =========================
   Component
   ========================= */
export default function CourseModules({
  course,
  allowedModules = [],
  progress = {},
  onPlayVideo,
  onReportPlayerProgress,
  onOpenQuiz,
}: Props): React.ReactElement {
  const [openModuleId, setOpenModuleId] = useState<string | null>(null);
  const [openSubKey, setOpenSubKey] = useState<string | null>(null);
  const [activeVideoKey, setActiveVideoKey] = useState<string | null>(null);

  const [guestProgress, setGuestProgress] = useState<Set<number>>(new Set());
  const [meetModalOpen, setMeetModalOpen] = useState(false);

  const [serverProgress, setServerProgress] = useState<Map<number, ProgressEntry>>(new Map());
  const saveTimersRef = useRef<Record<number, number | null>>({});

  const [isFreeLoggedIn, setIsFreeLoggedIn] = useState<boolean>(false);

  const [quizzesBySubmodule, setQuizzesBySubmodule] = useState<Record<string, Quiz[]>>({});
  const [mergedMap, setMergedMap] = useState<Map<string, any>>(new Map());

  const router = useRouter();

  const handleJoinFullCourse = () => {
    router.push("/enroll");
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.loginType === "guest" || u?.role === "guest" || u?.loginType === "free") {
          setIsFreeLoggedIn(true);
          return;
        }
      }
      const ck = localStorage.getItem("course_user_key");
      if (ck && (!allowedModules || allowedModules.length === 0)) {
        setIsFreeLoggedIn(true);
        return;
      }
      setIsFreeLoggedIn(false);
    } catch {
      setIsFreeLoggedIn(false);
    }
  }, [allowedModules.join?.(",")]);

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

  /* =========================
      Fetch server progress
      ========================= */
  useEffect(() => {
    if (!courseId) return;
    let mounted = true;
    (async () => {
      try {
        const userKey = getUserKey();
        console.log("[CourseModules] 📡 Fetching server progress | courseId:", courseId, "| userKey:", userKey);
        const res = await fetch(`/api/course_progress?courseId=${encodeURIComponent(courseId)}&userKey=${encodeURIComponent(userKey)}`);
        if (!res.ok) {
          console.warn("[CourseModules] ❌ Server progress fetch failed, status:", res.status);
          return;
        }
        const data = (await res.json()) as Array<any>;
        console.log("[CourseModules] 📥 Raw server progress data:", data);
        if (!mounted) return;

        const flat = flattenCourseVideos(course);
        const videoIdToGlobalIndex = new Map<string, number>();
        flat.forEach((fv, idx) => {
          if (fv.videoId) videoIdToGlobalIndex.set(String(fv.videoId), idx);
        });

        const map = new Map<number, ProgressEntry>();
        data.forEach((d) => {
          let gIdx = -1;
          if (typeof d.globalIndex === "number") gIdx = d.globalIndex;
          else if (typeof d.global_index === "number") gIdx = d.global_index;
          else if (d.videoId || d.video_public_id || d.video_publicid) {
            const vid = d.videoId ?? d.video_public_id ?? d.video_publicid;
            const maybe = videoIdToGlobalIndex.get(String(vid));
            if (typeof maybe === "number") gIdx = maybe;
            else {
              const findIdx = flat.findIndex((fv) => String(fv.videoId) === String(vid));
              if (findIdx >= 0) gIdx = findIdx;
            }
          }

          if (gIdx >= 0) {
            map.set(gIdx, {
              positionSeconds: Number(d.positionSeconds ?? d.position_seconds ?? 0),
              completed: Boolean(d.completed),
            });
            console.log(`[CourseModules] ✅ Mapped serverProgress: globalIndex=${gIdx}, completed=${d.completed}, positionSeconds=${d.positionSeconds ?? d.position_seconds}`);
          } else {
            console.warn("[CourseModules] ⚠️ Could not resolve globalIndex for entry:", d);
          }
        });
        console.log("[CourseModules] Final serverProgress map:", Array.from(map.entries()));
        setServerProgress(map);
      } catch (err) {
        console.error("[CourseModules] ❌ Error fetching progress:", err);
      }
    })();
    return () => { mounted = false; };
  }, [courseId, course]);

  useEffect(() => {
    if (!courseId) {
      setGuestProgress(new Set());
      return;
    }
    try {
      const raw = localStorage.getItem(GUEST_PROGRESS_KEY(courseId));
      if (raw) {
        const parsed = JSON.parse(raw) as number[];
        console.log("[CourseModules] 💾 Loaded guestProgress from localStorage:", parsed);
        setGuestProgress(new Set(parsed || []));
      } else {
        console.log("[CourseModules] No guestProgress in localStorage for courseId:", courseId);
        setGuestProgress(new Set());
      }
    } catch {
      setGuestProgress(new Set());
    }
  }, [courseId]);

  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const ce = e as CustomEvent<{ globalIndex: number }>;
        console.log("[CourseModules] 🎬 lms_video_completed event fired! detail:", ce.detail);
        if (typeof ce.detail?.globalIndex === "number") {
          handleVideoCompleted(ce.detail.globalIndex);
        } else {
          console.warn("[CourseModules] ⚠️ lms_video_completed missing globalIndex in detail:", ce.detail);
        }
      } catch (err) {
        console.error("[CourseModules] ❌ Error in lms_video_completed handler:", err);
      }
    };
    window.addEventListener("lms_video_completed", handler as EventListener);
    return () => window.removeEventListener("lms_video_completed", handler as EventListener);
  }, [serverProgress, guestProgress, course]);

  const allowedSet = useMemo(() => new Set(allowedModules || []), [allowedModules]);

  if (!course || !course.modules?.length) {
    return (
      <div className="p-6 text-center border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm">
        No course curriculum available.
      </div>
    );
  }

  const flatVideos = useMemo(() => flattenCourseVideos(course), [course]);

  const videoKeyToGlobalIndex = useMemo(() => {
    const map = new Map<string, number>();
    flatVideos.forEach((v, idx) => map.set(v.key, idx));
    console.log("[CourseModules] videoKeyToGlobalIndex:", Array.from(map.entries()));
    return map;
  }, [flatVideos]);

  const activeVideoKeyRef = useRef<string | null>(activeVideoKey);
  useEffect(() => {
    activeVideoKeyRef.current = activeVideoKey;
  }, [activeVideoKey]);

  const serverProgressRef = useRef<Map<number, ProgressEntry>>(serverProgress);
  useEffect(() => {
    serverProgressRef.current = serverProgress;
  }, [serverProgress]);

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
              if (typeof gIdx === "number") {
                s.add(gIdx);
                console.log(`[completedSet] From prop progress: moduleId=${moduleId}, localIdx=${localIdx} → globalIdx=${gIdx}`);
              }
            }
          });
        }
      });
    }

    serverProgress.forEach((entry, idx) => {
      if (entry.completed) {
        s.add(idx);
        console.log(`[completedSet] From serverProgress: globalIdx=${idx}`);
      }
    });

    guestProgress.forEach((g) => {
      s.add(g);
      console.log(`[completedSet] From guestProgress: globalIdx=${g}`);
    });

    console.log("[completedSet] ✅ FINAL completedSet:", Array.from(s));
    return s;
  }, [progress, flatVideos, videoKeyToGlobalIndex, guestProgress, course.modules, serverProgress]);

  const isVideoFreePreview = (globalIndex: number) => globalIndex >= 0 && globalIndex < FREE_PREVIEW_COUNT;

  const firstUncompletedIndexInModule = useMemo(() => {
    const map = new Map<number, number | null>();
    const modules = course.modules ?? [];
    modules.forEach((m, moduleIdx) => {
      const vids = flatVideos.filter((fv) => fv.moduleIndex === moduleIdx);
      let firstNot = null;
      for (let i = 0; i < vids.length; i++) {
        const gIdx = flatVideos.findIndex((fv) => fv.key === vids[i].key);
        if (gIdx >= 0 && !completedSet.has(gIdx)) {
          firstNot = gIdx;
          break;
        }
      }
      map.set(moduleIdx, firstNot);
    });
    return map;
  }, [course.modules, flatVideos, completedSet]);

  const isQuizUnlockedForSubmodule = (moduleIdx: number, subIdx: number) => {
    const vids = flatVideos.filter((fv) => fv.moduleIndex === moduleIdx && fv.subIndex === subIdx);
    if (vids.length === 0) return false;
    const firstGlobal = flatVideos.findIndex((fv) => fv.key === vids[0].key);
    if (firstGlobal < 0) return false;
    return completedSet.has(firstGlobal);
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
    console.log("[CourseModules] unlockedModulesSet:", Array.from(s));
    return s;
  }, [course.modules, allowedSet, completedSet, flatVideos]);

  useEffect(() => {
    try {
      if (courseId) {
        const arr = Array.from(guestProgress.values());
        console.log("[CourseModules] 💾 Persisting guestProgress to localStorage:", arr);
        localStorage.setItem(GUEST_PROGRESS_KEY(courseId), JSON.stringify(arr));
      }
    } catch {}
  }, [guestProgress, courseId]);

  const markGuestCompleted = (gIndex: number) => {
    console.log("⭐ markGuestCompleted called:", gIndex);

    setGuestProgress((prev) => {
      console.log("guestProgress BEFORE:", Array.from(prev));

      if (prev.has(gIndex)) {
        console.log("Already completed:", gIndex);
        return prev;
      }

      const next = new Set(prev);
      next.add(gIndex);

      console.log("guestProgress AFTER:", Array.from(next));

      return next;
    });
  };

  /* =========================
      Build mergedMap
      ========================= */
  useEffect(() => {
    if (!course?.modules) {
      setMergedMap(new Map());
      return;
    }

    const newMap = new Map<string, any>();

    course.modules.forEach((m, mi) => {
      const moduleKeyPart = m.moduleId ?? `module-${mi}`;
      (m.submodules || []).forEach((s, si) => {
        (s.videos || []).forEach((v, vi) => {
          const key = `${moduleKeyPart}-sub-${si}-vid-${vi}`;
          newMap.set(key, {
            url: v.url ?? null,
            videoId: v.id ?? v.videoId ?? null,
            thumb: v.thumb ?? null,
            duration: typeof v.duration === "number" ? v.duration : undefined,
            visible: Boolean(v.url),
          });
        });
      });
    });

    console.log("[CourseModules] mergedMap keys:", Array.from(newMap.keys()));
    setMergedMap(newMap);
  }, [course]);

  const getMergedForKey = (key: string) => {
    try {
      return mergedMap.get(key);
    } catch {
      return undefined;
    }
  };

  /* =========================
      Build quizzesBySubmodule
      ========================= */
  useEffect(() => {
    const map: Record<string, Quiz[]> = {};
    if (!course?.modules) {
      setQuizzesBySubmodule({});
      return;
    }

    course.modules.forEach((m) => {
      (m.submodules || []).forEach((s) => {
        const subId = String(s.submoduleId ?? "");
        const subQuizzes = (s as any).quizzes || [];
        if (!subQuizzes || subQuizzes.length === 0) return;
        map[subId] = subQuizzes.map((q: any) => ({
          id: String(q.quizId ?? q.id ?? q.quizRefId ?? Math.random()),
          name: q.name ?? q.quizTitle ?? q.title ?? `Quiz ${q.quizId ?? q.id ?? ""}`,
          submodule_id: subId,
          course_slug: course.slug ?? "",
          time_minutes: q.quiz?.time_minutes ?? q.time_minutes ?? undefined,
          questions: q.quiz?.questions ?? q.questions ?? [],
        }));
      });
    });

    console.log("[CourseModules] quizzesBySubmodule keys:", Object.keys(map));
    setQuizzesBySubmodule(map);
  }, [course]);

  /* =========================
      Internal save+report logic
      ========================= */
  const saveProgressToServerInternal = async (globalIndex: number, positionSeconds: number, completed = false) => {
    console.log(`[CourseModules] 📡 saveProgress | globalIndex=${globalIndex} | positionSeconds=${positionSeconds} | completed=${completed}`);

    if (!courseId) {
      console.warn("[CourseModules] No courseId — guest only save");
      if (completed) markGuestCompleted(globalIndex);
      return;
    }

    if (saveTimersRef.current[globalIndex]) {
      window.clearTimeout(saveTimersRef.current[globalIndex]!);
    }

    saveTimersRef.current[globalIndex] = window.setTimeout(async () => {
      try {
        const userKey = getUserKey();
        const fv = flatVideos[globalIndex];
        const videoId = fv?.videoId;

        const merged = getMergedForKey(fv?.key ?? "");
        const durationVal = typeof merged?.duration === "number" && merged.duration > 0 ? Math.floor(merged.duration) : 0;

        const payload: any = {
          userKey,
          courseId,
          positionSeconds: Math.floor(Math.max(0, positionSeconds)),
          duration: durationVal,
          completed,
        };

        if (videoId) payload.videoId = videoId;
        else payload.globalIndex = globalIndex;

        console.log("[CourseModules] 📤 POST /api/course_progress payload:", payload);

        const res = await fetch("/api/course_progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          console.warn("[CourseModules] ❌ Server save failed:", res.status, await res.text());
        } else {
          console.log("[CourseModules] ✅ Server save OK for globalIndex:", globalIndex);
        }

        setServerProgress((prev) => {
          const next = new Map(prev);
          next.set(globalIndex, { positionSeconds: Math.floor(Math.max(0, positionSeconds)), completed });
          console.log("[CourseModules] 🔄 serverProgress updated:", Array.from(next.entries()));
          return next;
        });
      } catch (err) {
        console.error("[CourseModules] ❌ saveProgress error:", err);
      } finally {
        saveTimersRef.current[globalIndex] = null;
      }
    }, 1200);
  };

  const reportProgress = onReportPlayerProgress ?? saveProgressToServerInternal;

  const getResumeSecondsForGlobalIndex = (globalIndex: number): number | undefined => {
    const s = serverProgress.get(globalIndex);
    if (s?.positionSeconds && s.positionSeconds > 1) return s.positionSeconds;
    return undefined;
  };

  const handleBookMeet = () => setMeetModalOpen(true);

  /**
   * Updated handleVideoCompleted:
   * - Uses a virtualCompleted set (completedSet + current index) so we can choose the next video immediately
   * - Checks prev module completion based on that virtual set, so unlocking next module is deterministic
   */
  const handleVideoCompleted = (globalIndex: number) => {
    console.log("--------------------------------------------------");
    console.log("🎬 VIDEO COMPLETED EVENT");
    console.log("Completed globalIndex:", globalIndex);
    console.log("Current completedSet BEFORE:", Array.from(completedSet));

    // Immediately mark in guest progress (async state update)
    markGuestCompleted(globalIndex);

    const merged = getMergedForKey(flatVideos[globalIndex]?.key ?? "");
    const duration = merged?.duration ? Math.floor(merged.duration) : 0;
    const resumeForSave = duration > 0 ? duration : (serverProgress.get(globalIndex)?.positionSeconds ?? 0);

    console.log(`[CourseModules] Saving progress for globalIndex=${globalIndex}, resumeForSave=${resumeForSave}, duration=${duration}`);
    reportProgress(globalIndex, resumeForSave, true);

    console.log("[CourseModules] Total flat videos:", flatVideos.length);

    // Create a virtualCompleted set to avoid waiting for React state update
    const virtualCompleted = new Set<number>(completedSet);
    virtualCompleted.add(globalIndex);
    console.log("Virtual completedSet (after adding current):", Array.from(virtualCompleted));

    // FIND NEXT VIDEO using virtualCompleted
    let nextIndex = -1;
    for (let i = globalIndex + 1; i < flatVideos.length; i++) {
      const isCompleted = virtualCompleted.has(i);
      console.log(`Checking nextIndex candidate: ${i} | completed=${isCompleted}`);
      if (!isCompleted) {
        nextIndex = i;
        break;
      }
    }

    console.log("Next video index found:", nextIndex);

    if (nextIndex === -1) {
      console.log("⚠️ No next video found.");
      console.log("--------------------------------------------------");
      return;
    }

    const nextFlat = flatVideos[nextIndex];
    console.log("Next video details:", nextFlat);

    const nextModuleIdx = nextFlat.moduleIndex;
    const nextModule = course.modules?.[nextModuleIdx];
    const nextModuleKey = nextModule?.moduleId ?? `module-${nextModuleIdx}`;
    console.log("Next module:", nextModuleKey);

    // Check allowedSet/unlockedModulesSet as before
    const nextModuleAllowed = Boolean(
      (nextModule?.moduleId && (unlockedModulesSet.has(nextModule.moduleId) || allowedSet.has(nextModule.moduleId))) ||
        (!nextModule?.moduleId && unlockedModulesSet.has(nextModuleKey))
    );

    // Additionally, compute previous module completed status using virtualCompleted
    let prevModuleCompletedVirtual = false;
    if (nextModuleIdx === 0) {
      prevModuleCompletedVirtual = true;
    } else {
      const prevModule = course.modules?.[nextModuleIdx - 1];
      if (!prevModule) prevModuleCompletedVirtual = true;
      else {
        // iterate all videos in prevModule and ensure all present in virtualCompleted
        const prevModuleVideos = flatVideos.filter((fv) => fv.moduleIndex === nextModuleIdx - 1);
        if (prevModuleVideos.length === 0) prevModuleCompletedVirtual = true;
        else {
          prevModuleCompletedVirtual = prevModuleVideos.every((fv) => {
            const idx = videoKeyToGlobalIndex.get(fv.key);
            return typeof idx === "number" ? virtualCompleted.has(idx) : false;
          });
        }
      }
    }
    console.log("prevModuleCompletedVirtual:", prevModuleCompletedVirtual);

    const nextModuleUnlocked = nextModuleAllowed || prevModuleCompletedVirtual;

    console.log("[CourseModules] Next module unlocked (combined):", nextModuleUnlocked);
    console.log("Is free preview for next index:", isVideoFreePreview(nextIndex));

    if (nextModuleUnlocked || isVideoFreePreview(nextIndex)) {
      console.log("✅ Opening next video");
      setOpenModuleId(nextModuleKey);
      setOpenSubKey(`${nextModuleKey}-sub-${nextFlat.subIndex}`);

      setTimeout(() => {
        console.log("▶️ Auto playing next video:", nextIndex);
        playGlobalIndex(nextIndex, true);
      }, 400);
    } else {
      console.log("❌ Next video blocked by module lock");
    }

    console.log("--------------------------------------------------");
  };

  const playGlobalIndex = (globalIndex: number, autoplay = false) => {
    const fv = flatVideos[globalIndex];
    if (!fv) {
      console.warn("[CourseModules] playGlobalIndex: no fv for globalIndex:", globalIndex);
      return;
    }
    const merged = getMergedForKey(fv.key);
    const urlToPlay = merged?.url ?? fv.url;
    if (!urlToPlay) {
      console.warn("[CourseModules] playGlobalIndex: no url for globalIndex:", globalIndex);
      return;
    }
    const module = course.modules?.[fv.moduleIndex];
    const moduleIdSafe = module?.moduleId ?? "";
    const resume = getResumeSecondsForGlobalIndex(globalIndex);
    console.log(`[CourseModules] ▶️ playGlobalIndex: globalIndex=${globalIndex}, title="${fv.title}", resume=${resume}, autoplay=${autoplay}`);
    setActiveVideoKey(fv.key);
    onPlayVideo(urlToPlay, fv.title, moduleIdSafe, fv.videoIndex, { resumeSeconds: resume, autoplay });
  };

  /* =========================
      Save on unload
      ========================= */
  useEffect(() => {
    const handler = () => {
      const activeKey = activeVideoKeyRef.current;
      if (!activeKey) return;
      const gIndex = videoKeyToGlobalIndex.get(activeKey);
      if (typeof gIndex !== "number" || gIndex < 0) return;

      const lastEntry = serverProgressRef.current.get(gIndex);
      const lastPos = lastEntry?.positionSeconds ?? 0;
      const merged = getMergedForKey(flatVideos[gIndex]?.key ?? "");
      const duration = merged?.duration ? Math.floor(merged.duration) : 0;
      const resumeForSave = duration > 0 ? duration : lastPos;

      try {
        const payload: any = {
          userKey: getUserKey(),
          courseId,
          positionSeconds: Math.floor(Math.max(0, resumeForSave)),
          duration,
          completed: Boolean(duration > 0 && resumeForSave >= duration),
        };
        const fv = flatVideos[gIndex];
        if (fv?.videoId) payload.videoId = fv.videoId;
        else payload.globalIndex = gIndex;

        const url = "/api/course_progress";
        const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
        if (navigator && typeof navigator.sendBeacon === "function") {
          navigator.sendBeacon(url, blob);
        } else {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", url, false);
          xhr.setRequestHeader("Content-Type", "application/json");
          try { xhr.send(JSON.stringify(payload)); } catch {}
        }
      } catch {}
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [courseId, flatVideos, videoKeyToGlobalIndex]);

  /* =========================
      RENDER
      ========================= */
  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-white border-indigo-100 shadow-md ring-1 ring-indigo-50">
        <h2 className="text-2xl font-black text-slate-900 leading-tight mb-2">{course.name}</h2>
        <p className="text-xs text-gray-500 mt-1">{course.description}</p>

        <div className="flex flex-col justify-start gap-4 mt-3">
          <div className="flex flex-row gap-4 items-center">
            <span className="text-[14px] font-medium text-gray-500 flex items-center gap-1">
              <BookOpen size={14} className="text-blue-400" /> {course.modules.length} Modules
            </span>
            <span className="text-[14px] font-medium text-gray-500 flex items-center gap-1">
              <Video size={14} className="text-blue-400" /> Video Lessons
            </span>
          </div>
          {Boolean(allowedModules && allowedModules.length > 0) && (
            <div className="">
              <button
                onClick={handleBookMeet}
                type="button"
                className="w-full mt-6 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 group"
              >
                Book A meet with mentors
              </button>
            </div>
          )}
          {isFreeLoggedIn && (!allowedModules || allowedModules.length === 0) && (
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

          const moduleUnlocked = isFreeLoggedIn
            ? moduleIndex === 0
            : Boolean(
                (module.moduleId && (unlockedModulesSet.has(module.moduleId) || allowedSet.has(module.moduleId))) ||
                  (!module.moduleId && unlockedModulesSet.has(moduleKey))
              );

          return (
            <div
              key={moduleKey}
              className={`group transition-all duration-300 rounded-2xl border ${
                isOpen ? "bg-white border-indigo-100 shadow-md ring-1 ring-indigo-50" : "bg-white border-slate-100 hover:border-slate-200"
              }`}
            >
              {/* Module header */}
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
                  {moduleUnlocked
                    ? isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />
                    : <div className="group relative p-1">
                        <Lock size={18} className="text-gray-400" />
                        <div className="hidden group-hover:block absolute -top-10 right-0 bg-black text-white text-xs px-2 py-1 rounded">Upgrade to Access</div>
                      </div>
                  }
                </div>
              </div>

              {/* Submodules list */}
              {isOpen && (
                <div className="border-t border-gray-100 divide-y divide-gray-50">
                  {module.submodules && module.submodules.length > 0 ? (
                    module.submodules.map((sub, subIndex) => {
                      const moduleKeyPart = module.moduleId ?? `module-${moduleIndex}`;
                      const originalVideos = sub.videos || [];
                      const quizzes = quizzesBySubmodule[String(sub.submoduleId ?? "")] || [];
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

                          {/* Videos + Quizzes */}
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
                                  const previousCompleted =
  globalIndex > 0 && completedSet.has(globalIndex - 1);

const unlocked = Boolean(
  moduleUnlocked && (isFirstVideo || previousCompleted || alreadyCompleted)
);

                                  console.log(
                                    `[UNLOCK CHECK] "${vv.title}"`,
                                    {
                                      globalIndex,
                                      isFirstVideo,
                                      previousCompleted,
                                      alreadyCompleted,
                                      moduleUnlocked,
                                      unlocked,
                                      completedSet: Array.from(completedSet),
                                    }
                                  );

                                  console.log(
                                    `[RENDER] "${vv.title}" | gIdx=${globalIndex} | completed=${alreadyCompleted} | isFirst=${isFirstVideo} | prevCompleted=${previousCompleted} | unlocked=${unlocked} | completedSet=[${Array.from(completedSet).join(",")}]`
                                  );

                                  return (
                                    <React.Fragment key={videoKey}>
                                      <div className={`flex items-center justify-between gap-3 p-2 rounded-md transition ${isVideoActive ? "" : "hover:bg-gray-50"}`}>
                                        <div className="flex w-full items-center gap-2">
                                          {urlToPlay ? (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                console.log(`[CourseModules] 🖱️ Clicked "${vv.title}" | gIdx=${globalIndex} | unlocked=${unlocked} | visible=${visible}`);
                                                if (!visible || !unlocked) {
                                                  console.warn(`[CourseModules] ⛔ Blocked: visible=${visible}, unlocked=${unlocked}`);
                                                  return;
                                                }
                                                setActiveVideoKey(videoKey);
                                                const resume = getResumeSecondsForGlobalIndex(globalIndex);
                                                console.log(`[CourseModules] ▶️ onPlayVideo "${vv.title}" resume=${resume}`);
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
                                                {unlocked && (
                                                  <p className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded">Play</p>
                                                )}
                                              </div>
                                            </button>
                                          ) : (
                                            <span className="text-xs text-gray-300">No URL</span>
                                          )}
                                        </div>
                                      </div>

                                      {idx === 0 && quizzes.length > 0 && (
                                        <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-amber-200 bg-amber-50/30 hover:bg-amber-50 cursor-pointer transition-all group/quiz">
                                          {quizzes.map((q) => {
                                            const quizUnlocked = isQuizUnlockedForSubmodule(moduleIndex, subIndex);
                                            return (
                                              <button
                                                key={q.id}
                                                onClick={() => onOpenQuiz && onOpenQuiz(q)}
                                                disabled={!quizUnlocked}
                                                className={`flex w-full items-center justify-between p-2 rounded ${!quizUnlocked ? "opacity-60 cursor-not-allowed" : ""}`}
                                              >
                                                <div className="flex items-center gap-3">
                                                  <FileText size={16} className="text-indigo-600" />
                                                  <p className="text-xs font-semibold">{q.name}</p>
                                                </div>
                                                <div>
                                                  <button
                                                    onClick={() => onOpenQuiz && onOpenQuiz(q)}
                                                    className={`px-3 py-1 text-[10px] font-bold rounded ${quizUnlocked ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-400"}`}
                                                    disabled={!quizUnlocked}
                                                  >
                                                    {quizUnlocked ? "TAKE QUIZ" : "LOCKED"}
                                                  </button>
                                                </div>
                                              </button>
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
                                  {quizzes.map((q) => (
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

      <Modal isOpen={meetModalOpen} onClose={() => setMeetModalOpen(false)}>
        <BookingApp onSuccess={() => setMeetModalOpen(false)} />
      </Modal>
    </div>
  );
}