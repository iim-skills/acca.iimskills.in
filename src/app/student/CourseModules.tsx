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
} from "lucide-react";
import Modal from "@/components/Modal";

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

  // NEW: parent will open quiz (same as onPlayVideo pattern)
  onOpenQuiz?: (quiz: Quiz) => void;
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
  const [viewerBatchIds, setViewerBatchIds] = useState<string[]>([]);

  // QUIZ: quizzes mapping: submoduleId => Quiz[]
  const [quizzesBySubmodule, setQuizzesBySubmodule] = useState<Record<string, Quiz[]>>({});

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
     Determine viewer's batch ids
     ========================= */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const email =
          (JSON.parse(localStorage.getItem("user") || "{}")?.email) ||
          localStorage.getItem("course_user_key") ||
          "";

        const meRes = await fetch("/api/student/me", {
          headers: {
            "x-user-email": email,
          },
        });

        if (meRes.ok) {
          const me = await meRes.json();
          const batches = me?.batches || me?.batch_ids || me?.batchIds || [];
          if (mounted && Array.isArray(batches) && batches.length > 0) {
            setViewerBatchIds(batches.map((b: any) => String(b)));
            return;
          }
        }
      } catch {
        // ignore
      }

      try {
        const raw = localStorage.getItem("viewer_batches") || localStorage.getItem("student_batches");
        if (raw) {
          const arr = String(raw).split(",").map((s) => s.trim()).filter(Boolean);
          if (mounted) setViewerBatchIds(arr);
          return;
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  /* =========================
     Fetch server progress
     ========================= */
  useEffect(() => {
    if (!courseId) return;
    let mounted = true;
    (async () => {
      try {
        const userKey = getUserKey();
        const res = await fetch(`/api/course_progress?courseId=${encodeURIComponent(courseId)}&userKey=${encodeURIComponent(userKey)}`);
        if (!res.ok) {
          return;
        }
        const data = (await res.json()) as Array<any>;
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

  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const ce = e as CustomEvent<{ globalIndex: number }>;
        if (typeof ce.detail?.globalIndex === "number") {
          handleVideoCompleted(ce.detail.globalIndex);
        }
      } catch {}
    };
    window.addEventListener("lms_video_completed", handler as EventListener);
    return () => window.removeEventListener("lms_video_completed", handler as EventListener);
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

  const videoKeyToGlobalIndex = useMemo(() => {
    const map = new Map<string, number>();
    flatVideos.forEach((v, idx) => map.set(v.key, idx));
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
  }, [course.modules, allowedSet, completedSet, flatVideos]);

  useEffect(() => {
    try {
      if (courseId) {
        const arr = Array.from(guestProgress.values());
        localStorage.setItem(GUEST_PROGRESS_KEY(courseId), JSON.stringify(arr));
      }
    } catch {}
  }, [guestProgress, courseId]);

  const markGuestCompleted = (gIndex: number) => {
    setGuestProgress((prev) => {
      if (prev.has(gIndex)) return prev;
      const next = new Set(prev);
      next.add(gIndex);
      return next;
    });
  };

  /* =========================
     mergedMap logic (unchanged)
     ========================= */
  const [mergedMap, setMergedMap] = useState<Map<string, any>>(new Map());
  useEffect(() => {
    let mounted = true;
    const ac = new AbortController();

    (async () => {
      if (!course?.slug) return;
      try {
        const batchParam = viewerBatchIds.length ? `&batchIds=${encodeURIComponent(viewerBatchIds.join(","))}` : "";
        const url = `/api/admin/videos/visible?courseSlug=${encodeURIComponent(course.slug)}${batchParam}`;
        const res = await fetch(url, { signal: ac.signal });
        if (!res.ok) {
          console.info("[CourseModules] visible videos API not available or returned not ok:", res.status);
          return;
        }
        const visible = await res.json();
        if (!mounted || !Array.isArray(visible)) return;

        const byModule = new Map<string, any[]>();
        const byPublicId = new Map<string, any>();

        visible.forEach((v: any) => {
          const mod = String(v.module_id ?? v.module ?? v.module_slug ?? "");
          if (!byModule.has(mod)) byModule.set(mod, []);
          byModule.get(mod)!.push(v);
          if (v.s3_key) byPublicId.set(String(v.s3_key), v);
          if (v.public_id) byPublicId.set(String(v.public_id), v);
        });

        const flat = flattenCourseVideos(course);
        const newMap = new Map<string, any>();

        flat.forEach((fv) => {
          let matched: any = null;

          if (fv.videoId && byPublicId.has(String(fv.videoId))) {
            matched = byPublicId.get(String(fv.videoId));
          }

          if (!matched && fv.url && String(fv.url).includes("res.cloudinary.com")) {
            try {
              const parts = String(fv.url).split("/");
              const last = parts[parts.length - 1] || "";
              const publicId = last.split(".")[0];
              if (publicId && byPublicId.has(publicId)) matched = byPublicId.get(publicId);
            } catch {}
          }

          if (!matched) {
            const candidates = byModule.get(String(fv.moduleId ?? "")) || [];
            if (candidates.length) {
              matched = candidates.find((c: any) => {
                if (!c.name || !fv.title) return false;
                return String(c.name).trim().toLowerCase() === String(fv.title).trim().toLowerCase();
              });
            }
          }

          if (!matched) {
            const candidates = byModule.get(String(fv.moduleId ?? "")) || [];
            if (candidates.length > fv.videoIndex) matched = candidates[fv.videoIndex];
          }

          if (matched) {
            newMap.set(fv.key, {
              url: matched.s3_url ?? matched.secure_url ?? matched.url,
              videoId: matched.s3_key ?? matched.public_id ?? matched.id,
              thumb: matched.thumb ?? matched.thumb_url ?? matched.eager?.[0]?.secure_url ?? matched.thumbnail ?? matched.preview,
              duration: matched.duration ?? matched.video_duration ?? undefined,
              visible: true,
            });
          }
        });

        if (mounted) setMergedMap(newMap);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error("[CourseModules] error fetching visible videos:", err);
      }
    })();

    return () => {
      mounted = false;
      ac.abort();
    };
  }, [course?.slug, viewerBatchIds.join?.(",")]);

  const getMergedForKey = (key: string) => {
    try {
      return mergedMap.get(key);
    } catch {
      return undefined;
    }
  };

  /* =========================
     QUIZ: fetch quizzes for course and map to submodules
     - expects API: GET /api/admin/quizzes?courseSlug=...  (or ?submoduleId=...)
     ========================= */
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!course?.slug) return;
      try {
        const res = await fetch(`/api/admin/quizzes?courseSlug=${encodeURIComponent(course.slug)}`);
        if (!res.ok) {
          console.info("[CourseModules] quizzes API returned not ok:", res.status);
          return;
        }
        const items = await res.json(); // expecting array of rows from your quizzes table
        if (!mounted || !Array.isArray(items)) return;

        const map: Record<string, Quiz[]> = {};
        items.forEach((row: any) => {
          try {
            const subId = String(row.submodule_id ?? row.submodule ?? row.submoduleId ?? "");
            const questions = typeof row.questions === "string" ? JSON.parse(row.questions) : row.questions ?? [];
            const quiz: Quiz = {
              id: String(row.id ?? row.quiz_id ?? row._id ?? `${row.name ?? "quiz"}-${Math.random()}`),
              name: row.name ?? row.title ?? `Quiz ${row.id}`,
              submodule_id: subId,
              course_slug: row.course_slug ?? course.slug,
              time_minutes: Number(row.time_minutes ?? row.time_minutes ?? 0) || undefined,
              questions,
            };
            if (!map[subId]) map[subId] = [];
            map[subId].push(quiz);
          } catch (err) {
            console.warn("[CourseModules] skipping quiz parsing error", err, row);
          }
        });

        setQuizzesBySubmodule(map);
      } catch (err) {
        console.error("[CourseModules] error fetching quizzes:", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [course?.slug]);

  /* =========================
     internal save+report logic (preserved)
     ========================= */
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

        const res = await fetch("/api/course_progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          console.warn("[CourseModules] internal save server error", await res.text());
        }

        setServerProgress((prev) => {
          const next = new Map(prev);
          next.set(globalIndex, { positionSeconds: Math.floor(Math.max(0, positionSeconds)), completed });
          return next;
        });
      } catch (err) {
        console.error("[CourseModules] internal save error:", err);
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

  const hasCompletedFirstVideo = completedSet.has(0);

  const handleVideoCompleted = (globalIndex: number) => {
    markGuestCompleted(globalIndex);

    const merged = getMergedForKey(flatVideos[globalIndex]?.key ?? "");
    const duration = merged?.duration ? Math.floor(merged.duration) : 0;

    const resumeForSave = duration > 0 ? duration : (serverProgress.get(globalIndex)?.positionSeconds ?? 0);

    reportProgress(globalIndex, resumeForSave, true);

    // autoplay next uncompleted video
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

      if (nextModuleUnlocked || isVideoFreePreview(nextIndex)) {
        setTimeout(() => {
          playGlobalIndex(nextIndex, true);
        }, 300);
      }
    }
  };

  const playGlobalIndex = (globalIndex: number, autoplay = false) => {
    const fv = flatVideos[globalIndex];
    if (!fv) {
      console.warn("[CourseModules] playGlobalIndex: missing fv", { globalIndex });
      return;
    }
    const merged = getMergedForKey(fv.key);
    const urlToPlay = merged?.url ?? fv.url;
    if (!urlToPlay) {
      console.warn("[CourseModules] playGlobalIndex: missing url", { globalIndex, fv });
      return;
    }
    const module = course.modules?.[fv.moduleIndex];
    const moduleIdSafe = module?.moduleId ?? "";
    const resume = getResumeSecondsForGlobalIndex(globalIndex);
    setActiveVideoKey(fv.key);
    onPlayVideo(urlToPlay, fv.title, moduleIdSafe, fv.videoIndex, { resumeSeconds: resume, autoplay });
  };

  /* =========================
     Save on unload (preserved)
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
          duration: duration,
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
          try {
            xhr.send(JSON.stringify(payload));
          } catch (err) {}
        }
      } catch (err) {}
    };

    window.addEventListener("beforeunload", handler);
    return () => {
      window.removeEventListener("beforeunload", handler);
    };
  }, [courseId, flatVideos, videoKeyToGlobalIndex]);

  /* =========================
     RENDER
     - left column modules only (parent controls right)
     ========================= */
  return (
    <div className="w-full space-y-6">
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

          {Boolean(allowedModules && allowedModules.length > 0) && (
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
            <div key={moduleKey} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
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
                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors cursor-pointer ${
                  isOpen ? "bg-gray-50" : "hover:bg-gray-50"
                } ${!moduleUnlocked ? "cursor-not-allowed opacity-70" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-4">
                    {(moduleIndex + 1).toString().padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">{module.name}</h3>
                    <p className="text-[10px] text-gray-400">{module.submodules?.length || 0} lessons</p>

                    {!moduleUnlocked && <div className="text-xs text-red-500 mt-1">🔒 Locked — contact admin to unlock</div>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {moduleUnlocked ? (
                    isOpen ? (
                      <ChevronUp size={16} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={16} className="text-gray-400" />
                    )
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

                                  const merged = getMergedForKey(videoKey);
                                  const mergedUrl = merged?.url;
                                  const mergedThumb = merged?.thumb;
                                  const mergedVideoId = merged?.videoId;
                                  const mergedDuration = merged?.duration;

                                  const alreadyCompleted = globalIndex >= 0 && completedSet.has(globalIndex);
                                  const previousAllCompleted = areAllPreviousCompleted(globalIndex);
                                  const freePreview = isVideoFreePreview(globalIndex);

                                  const visibleByServer = merged?.visible ?? undefined;
                                  const visible = typeof visibleByServer === "boolean" ? visibleByServer : (alreadyCompleted || (previousAllCompleted && (moduleUnlocked || freePreview)));

                                  const progEntry = serverProgress.get(globalIndex);
                                  let progressPercent: number | null = null;
                                  if (progEntry && mergedDuration && mergedDuration > 2) {
                                    progressPercent = Math.min(100, Math.round((progEntry.positionSeconds / mergedDuration) * 100));
                                  } else if (progEntry && mergedDuration == null) {
                                    progressPercent = progEntry.completed ? 100 : Math.min(99, Math.round((progEntry.positionSeconds / Math.max(1, progEntry.positionSeconds + 1)) * 100));
                                  } else if (alreadyCompleted) {
                                    progressPercent = 100;
                                  }

                                  const urlToPlay = mergedUrl ?? v.url;

                                  return (
                                    <div
                                      key={videoKey}
                                      className={`flex items-center justify-between gap-3 p-2 rounded-md transition ${isVideoActive ? "bg-indigo-100/60" : "hover:bg-gray-50"}`}
                                    >
                                      <div className="flex items-center gap-3 flex-1 text-left">
                                        <div className="relative w-28 h-16 rounded overflow-hidden bg-gray-100 shrink-0">
                                          {mergedThumb ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={mergedThumb} alt={v.title} className="w-full h-full object-cover" />
                                          ) : null}

                                          {!visible && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-semibold">
                                              Locked
                                            </div>
                                          )}
                                        </div>

                                        <div className="flex-1">
                                          <div className={`text-sm font-medium ${isVideoActive ? "text-indigo-900" : "text-gray-800"}`}>{v.title}</div>

                                          {!visible && moduleUnlocked && (
                                            <div className="text-xs text-rose-600 mt-1">Complete previous video to unlock this</div>
                                          )}
                                          {!visible && !moduleUnlocked && freePreview && (
                                            <div className="text-xs text-rose-600 mt-1">Complete previous video to unlock this preview</div>
                                          )}
                                          {alreadyCompleted && <div className="text-xs text-green-600 mt-1">Completed</div>}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        {urlToPlay ? (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (!visible) return;
                                              setActiveVideoKey(videoKey);
                                              const resume = getResumeSecondsForGlobalIndex(globalIndex);
                                              const safeModuleId = module.moduleId ?? "";
                                              onPlayVideo(urlToPlay, v.title, safeModuleId, vIdx, { resumeSeconds: resume });
                                              if (!moduleUnlocked && freePreview && globalIndex >= 0) {
                                                markGuestCompleted(globalIndex);
                                              }
                                            }}
                                            className={`text-[11px] font-semibold ${visible ? "text-indigo-600 hover:text-indigo-800" : "text-gray-300 cursor-not-allowed"} uppercase tracking-wider`}
                                            disabled={!visible}
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

                              {/* QUIZ: show quiz link(s) for this submodule */}
                              <div className="mt-3">
                                {(() => {
                                  const subId = String(sub.submoduleId ?? "");
                                  const qz = quizzesBySubmodule[subId] ?? [];
                                  if (!qz || qz.length === 0) return null;
                                  return (
                                    <div className="pt-3 border-t">
                                      {qz.map((q) => (
                                        <button
                                          key={q.id}
                                          onClick={() => {
                                            // Delegate quiz opening to parent (page.tsx)
                                            if (onOpenQuiz) {
                                              onOpenQuiz(q);
                                            }
                                          }}
                                          className="text-sm px-3 py-2 rounded-md bg-white border hover:bg-indigo-50 text-indigo-700 mr-2"
                                          title={`Open quiz: ${q.name}`}
                                        >
                                          Take quiz: {q.name ?? "Quiz"}
                                        </button>
                                      ))}
                                    </div>
                                  );
                                })()}
                              </div>
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