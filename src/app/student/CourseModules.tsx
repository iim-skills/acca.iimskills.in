"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BookingApp from "@/components/MentorsMeetForm";
import {
  ChevronDown,
  ChevronUp,
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
  id?: string; title?: string; url?: string; videoId?: string;
  thumb?: string; duration?: number; visible?: boolean;
};
export type Submodule = {
  submoduleId?: string; title?: string; description?: string;
  videos?: VideoItem[]; quizzes?: any[]; items?: any[];
};
export type Module = {
  moduleId?: string; slug?: string; name?: string;
  description?: string; submodules?: Submodule[];
};
export type Course = {
  courseId?: string; slug?: string; name?: string;
  description?: string; modules?: Module[];
};

type ProgressEntry = { positionSeconds: number; completed: boolean };

type Props = {
  course: Course | null;
  allowedModules?: string[];
  progress?: Record<string, number[]>;
  onPlayVideo: (
    videoUrl: string, title?: string, moduleId?: string,
    videoIndex?: number, options?: { resumeSeconds?: number; autoplay?: boolean }
  ) => void;
  onReportPlayerProgress?: (globalIndex: number, positionSeconds: number, completed?: boolean) => void;
  onOpenQuiz?: (quiz: any) => void;
};

export type QuizQuestion = {
  id?: string; text?: string; type?: string;
  options?: Array<{ id?: string; text?: string }>;
  correctOption?: string | number; correctAnswer?: string; answer?: string | number;
};
export type Quiz = {
  id: string; name?: string; submodule_id?: string; course_slug?: string;
  time_minutes?: number; questions: QuizQuestion[];
  /** admin-provided 1-based order (may be null/undefined) */
  order?: number | null;
};

type OrderedVideoItem = { type: "video"; vIndex: number; v: VideoItem; key: string; gi?: number; };
type OrderedQuizItem  = { type: "quiz";  q: Quiz; prevVideoGi: number; };
type OrderedSubItem   = OrderedVideoItem | OrderedQuizItem;

const FREE_PREVIEW_COUNT = 5;
/* localStorage — only for guests (no email) */
const GUEST_PROGRESS_KEY = (cid: string) => `guest_progress_${cid || "unknown_course"}`;
const QUIZ_PROGRESS_KEY  = (cid: string) => `quiz_progress_${cid || "unknown_course"}`;

/* ─────────────────────────────────────────────────────────────────
  buildOrderedSubItems
  - normalises order (strings -> numbers)
  - treats missing/null/invalid order as "append to end"
  - supports multiple quizzes after same video
───────────────────────────────────────────────────────────────── */
function buildOrderedSubItems(
  videos: VideoItem[],
  quizzes: Quiz[],
  mkp: string,
  si: number,
  giMap: Map<string, number>
): OrderedSubItem[] {

  const result: OrderedSubItem[] = [];
  let lastVideoGi = -1;
  const videosLen = videos.length;

  // parse admin order into a usable number:
  // - if order is null/undefined/invalid/<=0 → we treat it as "append to end" (videosLen + 1)
  // - otherwise floor(order)
  const parseOrder = (o: any) => {
    if (o == null) return videosLen + 1;
    const n = Number(o);
    if (!Number.isFinite(n) || n <= 0) return videosLen + 1;
    return Math.floor(n);
  };

  // preserve original quizzes array order while adding parsedOrder
  const normalized = quizzes.map(q => ({ q, parsedOrder: parseOrder((q as any).order) }));

  for (let vi = 0; vi < videos.length; vi++) {
    const key = `${mkp}-sub-${si}-vid-${vi}`;
    const gi  = giMap.get(key) ?? -1;
    lastVideoGi = gi;

    result.push({
      type: "video",
      vIndex: vi,
      v: videos[vi],
      key,
      gi
    });

    // place any quizzes whose parsedOrder === vi + 1 (1-based)
    normalized
      .filter(nq => nq.parsedOrder === vi + 1)
      .forEach(nq => result.push({ type: "quiz", q: nq.q, prevVideoGi: gi }));
  }

  // append quizzes whose parsedOrder > videosLen (explicitly placed after last video or missing)
  normalized
    .filter(nq => nq.parsedOrder > videosLen)
    .forEach(nq => result.push({ type: "quiz", q: nq.q, prevVideoGi: lastVideoGi }));

  return result;
}

function flattenCourseVideos(course: Course | null) {
  const out: Array<{
    moduleIndex: number; subIndex: number; videoIndex: number;
    moduleId?: string; submoduleId?: string; videoId?: string;
    title?: string; url?: string; key: string;
  }> = [];
  if (!course?.modules) return out;
  course.modules.forEach((m, mi) => {
    m.submodules?.forEach((s, si) => {
      // prefer sub.videos (legacy). If not present, look for sub.items video entries.
      const videoItems: any[] = Array.isArray(s.videos)
        ? s.videos
        : (Array.isArray((s as any).items) ? (s as any).items.filter((it:any)=>it?.type==="video") : []);

      videoItems.forEach((v: any, vi: number) => {
        const mkp = m.moduleId ?? `module-${mi}`;
        // adapt shape if this came from items (different property names)
        const idVal = v.id ?? v.videoId ?? v.sessionId;
        const title = v.title ?? v.videoTitle ?? v.name;
        const url   = v.url ?? v.s3_url ?? v.secure_url ?? null;
        out.push({
          moduleIndex: mi, subIndex: si, videoIndex: vi,
          moduleId: m.moduleId, submoduleId: s.submoduleId,
          title, url,
          videoId: idVal as string | undefined,
          key: `${mkp}-sub-${si}-vid-${vi}`,
        });
      });
    });
  });
  return out;
}

/* ═══════════════════════════════════════════════
  COMPONENT
═══════════════════════════════════════════════ */
export default function CourseModules({
  course, allowedModules = [], progress = {},
  onPlayVideo, onReportPlayerProgress, onOpenQuiz,
}: Props): React.ReactElement {

  const [openModuleId,   setOpenModuleId]   = useState<string | null>(null);
  const [openSubKey,     setOpenSubKey]     = useState<string | null>(null);
  const [activeVideoKey, setActiveVideoKey] = useState<string | null>(null);
  const [meetModalOpen,  setMeetModalOpen]  = useState(false);
  const [isFreeLoggedIn, setIsFreeLoggedIn] = useState(false);

  const [isEmailUser] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const u = JSON.parse(raw);
        return Boolean(u?.email);
      }
      return false;
    } catch { return false; }
  });

  const [guestProgress,      setGuestProgress]      = useState<Set<number>>(new Set());
  const [serverProgress,     setServerProgress]     = useState<Map<number, ProgressEntry>>(new Map());
  const [completedQuizzes,   setCompletedQuizzes]   = useState<Set<string>>(new Set());
  const [quizzesBySubmodule, setQuizzesBySubmodule] = useState<Record<string, Quiz[]>>({});
  const [mergedMap,          setMergedMap]           = useState<Map<string, any>>(new Map());

  const serverProgressRef   = useRef<Map<number, ProgressEntry>>(new Map());
  const completedSetRef     = useRef<Set<number>>(new Set());
  const completedQuizzesRef = useRef<Set<string>>(new Set());
  const activeVideoKeyRef   = useRef<string | null>(null);
  const saveTimersRef       = useRef<Record<number, number | null>>({});
  const pendingNextVideoRef = useRef<number | null>(null);

  useEffect(() => { serverProgressRef.current   = serverProgress;   }, [serverProgress]);
  useEffect(() => { activeVideoKeyRef.current   = activeVideoKey;   }, [activeVideoKey]);
  useEffect(() => { completedQuizzesRef.current = completedQuizzes; }, [completedQuizzes]);

  const router   = useRouter();
  const courseId = course?.courseId ?? "";

  const flatVideos = useMemo(() => flattenCourseVideos(course), [course]);
  const videoKeyToGlobalIndex = useMemo(() => {
    const m = new Map<string, number>();
    flatVideos.forEach((v, i) => m.set(v.key, i));
    return m;
  }, [flatVideos]);

  // DEBUG: surface overall course + flattened info
  useEffect(() => {
    console.debug("[CURRICULUM_DEBUG] course payload:", course);
    console.debug("[CURRICULUM_DEBUG] flatVideos:", flatVideos);
    console.debug("[CURRICULUM_DEBUG] videoKeyToGlobalIndex:", Array.from(videoKeyToGlobalIndex.entries()));
  }, [course, flatVideos, videoKeyToGlobalIndex]);

  /* getUserKey: returns email for logged-in users, UUID for guests */
  const getUserKey = (): string => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.email) return u.email;
      }
      let k = localStorage.getItem("course_user_key");
      if (!k) { k = crypto.randomUUID(); localStorage.setItem("course_user_key", k); }
      return k;
    } catch { return "guest-" + Date.now(); }
  };

  const getMergedForKey = (key: string) => { try { return mergedMap.get(key); } catch { return undefined; } };

  /* ── completedSet ── */
  const completedSet = useMemo(() => {
    const s = new Set<number>();
    // From parent prop (server-side pre-loaded progress)
    course?.modules?.forEach((m) => {
      const mid  = m.moduleId;
      const done = mid ? (progress?.[mid] ?? []) : [];
      if (mid && Array.isArray(done)) {
        flatVideos.filter(fv => fv.moduleId === mid).forEach((fv, li) => {
          if (done.includes(li)) {
            const gi = videoKeyToGlobalIndex.get(fv.key);
            if (typeof gi === "number") s.add(gi);
          }
        });
      }
    });
    // From DB (fetched on mount)
    serverProgress.forEach((e, i) => { if (e.completed) s.add(i); });
    if (!isEmailUser) {
      guestProgress.forEach(g => s.add(g));
    }
    return s;
  }, [progress, flatVideos, videoKeyToGlobalIndex, guestProgress, course?.modules, serverProgress, isEmailUser]);

  useEffect(() => { completedSetRef.current = completedSet; }, [completedSet]);

  /* ── login type (for upgrade button) ── */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.loginType === "guest" || u?.role === "guest" || u?.loginType === "free") {
          setIsFreeLoggedIn(true); return;
        }
      }
      if (localStorage.getItem("course_user_key") && !allowedModules?.length) {
        setIsFreeLoggedIn(true); return;
      }
      setIsFreeLoggedIn(false);
    } catch { setIsFreeLoggedIn(false); }
  }, [allowedModules.join?.(",")]);

  /* ── auto-open first module for free users ── */
  useEffect(() => {
    if (!course?.modules?.length || !isFreeLoggedIn) return;
    const first = course.modules[0];
    const fk = first.moduleId ?? "module-0";
    setOpenModuleId(fk);
    if (first.submodules?.length) setOpenSubKey(`${fk}-sub-0`);
  }, [course, isFreeLoggedIn]);

  /* ── guest video progress (localStorage — skipped for email users) ── */
  useEffect(() => {
    if (isEmailUser) return;
    if (!courseId) { setGuestProgress(new Set()); return; }
    try {
      const raw = localStorage.getItem(GUEST_PROGRESS_KEY(courseId));
      setGuestProgress(raw ? new Set(JSON.parse(raw) as number[]) : new Set());
    } catch { setGuestProgress(new Set()); }
  }, [courseId, isEmailUser]);

  /* ── guest quiz progress (localStorage — skipped for email users) ── */
  useEffect(() => {
    if (isEmailUser) return;
    if (!courseId) return;
    try {
      const raw = localStorage.getItem(QUIZ_PROGRESS_KEY(courseId));
      if (raw) {
        const parsed = new Set(JSON.parse(raw) as string[]);
        setCompletedQuizzes(parsed);
        completedQuizzesRef.current = parsed;
      }
    } catch {}
  }, [courseId, isEmailUser]);

  /* ── server progress load — videos + quiz completions from DB ── */
  useEffect(() => {
    if (!courseId) return;
    let mounted = true;
    (async () => {
      try {
        const uk  = getUserKey();
        const res = await fetch(
          `/api/course_progress?courseId=${encodeURIComponent(courseId)}&userKey=${encodeURIComponent(uk)}`
        );
        if (!res.ok || !mounted) return;
        const data   = await res.json() as any[];
        const flat   = flattenCourseVideos(course);
        const vidMap = new Map<string, number>();
        flat.forEach((fv, i) => { if (fv.videoId) vidMap.set(String(fv.videoId), i); });

        const videoMap    = new Map<number, ProgressEntry>();
        const quizFromDB  = new Set<string>();

        data.forEach((d) => {
          if (typeof d.videoId === "string" && d.videoId.startsWith("quiz_")) {
            if (d.completed) quizFromDB.add(d.videoId.slice(5));
            return;
          }

          let gi = -1;
          if (typeof d.globalIndex  === "number") gi = d.globalIndex;
          else if (typeof d.global_index === "number") gi = d.global_index;
          else if (typeof d.videoId === "string" && d.videoId.startsWith("idx_"))
            gi = parseInt(d.videoId.replace("idx_", ""), 10);
          else {
            const vid = d.videoId ?? d.video_public_id ?? d.video_publicid;
            if (vid) gi = vidMap.get(String(vid)) ?? flat.findIndex(fv => String(fv.videoId) === String(vid));
          }
          if (gi >= 0) {
            videoMap.set(gi, {
              positionSeconds: Number(d.positionSeconds ?? d.position_seconds ?? 0),
              completed: Boolean(d.completed),
            });
          }
        });

        if (mounted) {
          setServerProgress(videoMap);
          if (quizFromDB.size > 0) {
            setCompletedQuizzes(prev => {
              const merged = new Set([...prev, ...quizFromDB]);
              completedQuizzesRef.current = merged;
              return merged;
            });
          }
        }
      } catch (err) {
        console.debug("[CURRICULUM_DEBUG] course_progress fetch error:", err);
      }
    })();
    return () => { mounted = false; };
  }, [courseId, course]);

  /* ── mergedMap ── */
  useEffect(() => {
    const m = new Map<string, any>();
    course?.modules?.forEach((mod, mi) => {
      const mkp = mod.moduleId ?? `module-${mi}`;
      mod.submodules?.forEach((s, si) => {
        // prefer s.videos (legacy). If not present, look for s.items video entries.
        const videoItems: any[] = Array.isArray(s.videos)
          ? s.videos
          : (Array.isArray((s as any).items) ? (s as any).items.filter((it:any)=>it?.type==="video") : []);

        videoItems.forEach((v, vi) => {
          const key = `${mkp}-sub-${si}-vid-${vi}`;
          const idVal = v.id ?? v.videoId ?? v.sessionId;
          const url = v.url ?? v.s3_url ?? v.secure_url ?? null;
          m.set(key, {
            url,
            videoId: idVal ?? null,
            thumb: v.thumb ?? null,
            duration: typeof v.duration === "number" ? v.duration : undefined,
            visible: Boolean(url),
          });
        });
      });
    });
    setMergedMap(m);
  }, [course]);

  /* ── quizzesBySubmodule ──
    keep order as number | null (we'll decide placement in buildOrderedSubItems)
  ── */
  useEffect(() => {
    const map: Record<string, Quiz[]> = {};
    course?.modules?.forEach((m) => {
      m.submodules?.forEach((s) => {
        const subId = String(s.submoduleId ?? "");
        // prefer s.quizzes (legacy), otherwise read quizzes from s.items
        const rawQs: any[] = Array.isArray(s.quizzes)
          ? s.quizzes
          : (Array.isArray((s as any).items) ? (s as any).items.filter((it:any)=>it?.type==="quiz") : []);

        if (!rawQs.length) return;

        map[subId] = rawQs.map((q: any) => {
          const rawOrder = q.order ?? q.sortOrder ?? q.position ?? q.quiz_order ?? null;
          const normOrder = rawOrder == null ? null : (() => {
            const n = Number(rawOrder);
            return Number.isFinite(n) ? Math.floor(n) : null;
          })();

          return {
            id:           String(q.quizId ?? q.id ?? q.quizRefId ?? Math.random()),
            name:         q.name ?? q.quizTitle ?? q.title ?? "Quiz",
            submodule_id: subId,
            course_slug:  course?.slug ?? "",
            time_minutes: q.quiz?.time_minutes ?? q.time_minutes,
            questions:    q.quiz?.questions ?? q.questions ?? [],
            order:        normOrder, // number | null
          } as Quiz;
        });
      });
    });
    setQuizzesBySubmodule(map);
  }, [course]);

  /* ══════════════════════════════════════════════════════════════════
    videoToNextQuizzes: gi → Quiz[] that must be completed before the
    NEXT video after that gi is allowed to play.

    FIX: When a submodule uses sub.items[], we walk the items in their
    DB-stored order (the same order the admin set) to correctly assign
    which quiz gates which video. Previously this used buildOrderedSubItems
    with the `order` field, but quiz items in items[] never have an explicit
    `order` field, causing ALL quizzes to be placed after the last video
    and therefore never blocking any intermediate video.
  ══════════════════════════════════════════════════════════════════ */
  const videoToNextQuizzes = useMemo(() => {
    const map = new Map<number, Quiz[]>();

    course?.modules?.forEach((m, mi) => {
      const mkp = m.moduleId ?? `module-${mi}`;

      m.submodules?.forEach((s, si) => {

        /* ── PATH A: sub.items[] exists — walk in DB order ──
           This is the critical fix. Items are already in the correct
           sequence as the admin arranged them. We track the last video
           gi seen, so any quiz item immediately following a video gets
           assigned to that video's gi as a gate for the next video.
        ── */
        if (Array.isArray((s as any).items) && (s as any).items.length > 0) {
          let lastVideoGi = -1;
          let videoCounter = 0;

          (s as any).items.forEach((it: any) => {
            if (it.type === "video") {
              const key = `${mkp}-sub-${si}-vid-${videoCounter}`;
              const gi  = videoKeyToGlobalIndex.get(key) ?? -1;
              lastVideoGi = gi;
              videoCounter++;

            } else if (it.type === "quiz") {
              // Only gate if there is a preceding video in this submodule
              if (lastVideoGi < 0) return;

              const qid = String(it.quizId ?? it.id ?? it.quizRefId ?? Math.random());
              const q: Quiz = {
                id:           qid,
                name:         it.name ?? it.quizTitle ?? "Quiz",
                submodule_id: String(s.submoduleId ?? ""),
                course_slug:  course?.slug ?? "",
                time_minutes: it.quiz?.time_minutes ?? it.time_minutes,
                questions:    it.quiz?.questions ?? it.questions ?? [],
                order:        it.order ?? null,
              };

              const arr = map.get(lastVideoGi) ?? [];
              arr.push(q);
              map.set(lastVideoGi, arr);
            }
          });

          return; // done with this submodule
        }

        /* ── PATH B: legacy sub.videos + sub.quizzes (or quizzesBySubmodule)
           Fall back to buildOrderedSubItems which respects the `order` field.
        ── */
        const videos  = Array.isArray(s.videos) ? s.videos : [];
        const quizzes = quizzesBySubmodule[String(s.submoduleId ?? "")] ?? [];
        const items   = buildOrderedSubItems(videos, quizzes, mkp, si, videoKeyToGlobalIndex);

        items.forEach(item => {
          if (item.type === "quiz" && item.prevVideoGi >= 0) {
            const arr = map.get(item.prevVideoGi) ?? [];
            arr.push(item.q);
            map.set(item.prevVideoGi, arr);
          }
        });
      });
    });

    return map;
  }, [course, quizzesBySubmodule, videoKeyToGlobalIndex]);

  /* ── allowed / unlocked modules ── */
  const allowedSet = useMemo(() => new Set(allowedModules ?? []), [allowedModules]);

  const isModuleCompleted = (module: Module) => {
    if (!module.submodules?.length) return true;
    return module.submodules.every((s, si) =>
      (s.videos ?? []).every((_, vi) => {
        const fv = flatVideos.find(f => f.moduleId === module.moduleId && f.subIndex === si && f.videoIndex === vi);
        if (!fv) return false;
        const gi = videoKeyToGlobalIndex.get(fv.key);
        return typeof gi === "number" && completedSet.has(gi);
      })
    );
  };

  const unlockedModulesSet = useMemo(() => {
    const s    = new Set<string>();
    const mods = course?.modules ?? [];
    mods.forEach(m => { if (m.moduleId && allowedSet.has(m.moduleId)) s.add(m.moduleId); });
    for (let i = 0; i < mods.length; i++) {
      const m   = mods[i];
      const mid = m.moduleId ?? `module-${i}`;
      if (s.has(mid) || i === 0) continue;
      const prev = mods[i - 1];
      const pid  = prev.moduleId ?? `module-${i - 1}`;
      if (s.has(pid) && isModuleCompleted(prev)) s.add(mid);
    }
    return s;
  }, [course?.modules, allowedSet, completedSet, flatVideos]);

  /* ── markGuestCompleted (guests only — email users skip) ── */
  const markGuestCompleted = (gi: number) => {
    if (isEmailUser) return; // DB handles it
    setGuestProgress(prev => {
      if (prev.has(gi)) return prev;
      const n = new Set(prev);
      n.add(gi);
      try {
        if (courseId) localStorage.setItem(GUEST_PROGRESS_KEY(courseId), JSON.stringify([...n]));
      } catch {}
      return n;
    });
  };

  /* ── saveToServer (debounced 1.2 s) ── */
  const saveToServer = (globalIndex: number, positionSeconds: number, completed = false) => {
    if (!courseId) { if (completed) markGuestCompleted(globalIndex); return; }
    if (saveTimersRef.current[globalIndex]) window.clearTimeout(saveTimersRef.current[globalIndex]!);
    saveTimersRef.current[globalIndex] = window.setTimeout(async () => {
      try {
        const fv   = flatVideos[globalIndex];
        const merg = getMergedForKey(fv?.key ?? "");
        const dur  = typeof merg?.duration === "number" && merg.duration > 0 ? Math.floor(merg.duration) : 0;
        const payload: any = {
          userKey: getUserKey(), courseId,
          positionSeconds: Math.floor(Math.max(0, positionSeconds)),
          duration: dur, completed,
          videoId: fv?.videoId ?? `idx_${globalIndex}`,
        };
        const res = await fetch("/api/course_progress", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setServerProgress(prev => {
            const n = new Map(prev);
            n.set(globalIndex, { positionSeconds: Math.floor(Math.max(0, positionSeconds)), completed });
            return n;
          });
        }
      } catch {} finally { saveTimersRef.current[globalIndex] = null; }
    }, 1200);
  };

  const saveQuizToServer = (quizId: string) => {
    if (!courseId) return;
    fetch("/api/course_progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userKey: getUserKey(), courseId,
        videoId: `quiz_${quizId}`,
        positionSeconds: 0, duration: 0, completed: true,
      }),
    }).catch(() => {});
  };

  const reportProgress = onReportPlayerProgress ?? saveToServer;

  const getResume = (gi: number) => {
    const e = serverProgressRef.current.get(gi);
    return e?.positionSeconds && e.positionSeconds > 1 ? e.positionSeconds : undefined;
  };

  /* ── playGlobalIndex ── */
  const playGlobalIndex = (globalIndex: number, autoplay = false) => {
    const fv = flatVideos[globalIndex];
    if (!fv) return;
    const merg = getMergedForKey(fv.key);
    const url  = merg?.url ?? fv.url;
    if (!url) return;
    const mod  = course?.modules?.[fv.moduleIndex];
    (window as any).currentVideoIndex         = globalIndex;
    (window as any).currentVideoResumeSeconds = getResume(globalIndex) ?? 0;
    setActiveVideoKey(fv.key);
    activeVideoKeyRef.current = fv.key;
    onPlayVideo(url, fv.title, mod?.moduleId ?? "", fv.videoIndex, {
      resumeSeconds: getResume(globalIndex), autoplay,
    });
  };

  const computePendingNextVideo = (afterGlobalIndex: number, liveCompleted: Set<number>) => {
    let ni = -1;
    for (let i = afterGlobalIndex + 1; i < flatVideos.length; i++) {
      if (!liveCompleted.has(i)) { ni = i; break; }
    }
    pendingNextVideoRef.current = ni >= 0 ? ni : null;
  };

  /* ── handleVideoCompleted ── */
  const [pendingNextIndex, setPendingNextIndex] = useState<number | null>(null);

  const handleVideoCompleted = (globalIndex: number) => {
    const live = new Set<number>(completedSetRef.current);
    live.add(globalIndex);
    markGuestCompleted(globalIndex);

    const fv = flatVideos[globalIndex];
    if (!fv) return;

    const merg = getMergedForKey(fv.key);
    const dur = merg?.duration ? Math.floor(merg.duration) : 0;

    const pos =
      dur > 0
        ? dur
        : serverProgressRef.current.get(globalIndex)?.positionSeconds ?? 0;

    reportProgress(globalIndex, pos, true);

    /* =====================================
       CHECK IF QUIZ EXISTS AFTER THIS VIDEO
    ====================================== */

    const nextQuizzes = videoToNextQuizzes.get(globalIndex) ?? [];

    if (nextQuizzes.length > 0) {
      const allCompleted = nextQuizzes.every((q) =>
        completedQuizzesRef.current.has(q.id)
      );

      /* 🚫 QUIZ NOT COMPLETED → STOP AUTO PLAY
         and trigger existing pending / UI flow for quiz
      */
      if (!allCompleted) {
        console.log("Quiz required before next video");
        computePendingNextVideo(globalIndex, live); // keep existing behaviour
        setPendingNextIndex(null); // no automatic next-video activation
        return;
      }
    }

    /* =====================================
       ENABLE (BUT DO NOT AUTOPLAY) NEXT ITEM
    ====================================== */

    let nextIdx = -1;
    for (let i = globalIndex + 1; i < flatVideos.length; i++) {
      if (!live.has(i)) {
        nextIdx = i;
        break;
      }
    }

    if (nextIdx === -1) {
      // no next item
      setPendingNextIndex(null);
      return;
    }

    const nfv = flatVideos[nextIdx];
    const nmod = course?.modules?.[nfv.moduleIndex];
    const nmKey = nmod?.moduleId ?? `module-${nfv.moduleIndex}`;

    // check previous-module completion
    let prevModDone = nfv.moduleIndex === 0;
    if (!prevModDone) {
      const prevVids = flatVideos.filter(
        (v) => v.moduleIndex === nfv.moduleIndex - 1
      );
      prevModDone =
        prevVids.length === 0 ||
        prevVids.every((v) => {
          const gi = videoKeyToGlobalIndex.get(v.key);
          return typeof gi === "number" && live.has(gi);
        });
    }

    const nextAllowed = Boolean(
      (nmod?.moduleId &&
        (unlockedModulesSet.has(nmod.moduleId) ||
          allowedSet.has(nmod.moduleId))) ||
      (!nmod?.moduleId && unlockedModulesSet.has(nmKey))
    );

    // Instead of autoplaying, open the module/sub and *mark the next item as pending*
    if (nextAllowed || prevModDone || nextIdx < FREE_PREVIEW_COUNT) {
      setOpenModuleId(nmKey);
      setOpenSubKey(`${nmKey}-sub-${nfv.subIndex}`);

      // **Enable the next item but do not auto-play it**.
      // UI should render a Play/Open button when pendingNextIndex === nextIdx
      setPendingNextIndex(nextIdx);

    } else {
      // next item is not allowed — clear any pending flag
      setPendingNextIndex(null);
    }
  };

  /* ── event: video completed ── */
  useEffect(() => {
    const h = (e: Event) => {
      const ce = e as CustomEvent<{ globalIndex: number }>;
      if (typeof ce.detail?.globalIndex === "number") handleVideoCompleted(ce.detail.globalIndex);
    };
    window.addEventListener("lms_video_completed", h as EventListener);
    return () => window.removeEventListener("lms_video_completed", h as EventListener);
  });

  /* ── event: mid-video progress save (every ~10 s from RightSidePanel) ── */
  useEffect(() => {
    const h = (e: Event) => {
      const ce = e as CustomEvent<{ globalIndex: number; positionSeconds: number }>;
      const { globalIndex, positionSeconds } = ce.detail ?? {};
      if (typeof globalIndex === "number" && typeof positionSeconds === "number")
        saveToServer(globalIndex, positionSeconds, false);
    };
    window.addEventListener("lms_save_progress", h as EventListener);
    return () => window.removeEventListener("lms_save_progress", h as EventListener);
  }, [courseId]);

  /* ─────────────────────────────────────────────────────────────────
    event: quiz submitted
    • Email users → save to DB (quiz_ key) + update state
    • Guest users → save to localStorage + update state
  ───────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const h = (e: Event) => {
      const ce  = e as CustomEvent<{ quizId?: string }>;
      const qid = ce.detail?.quizId;
      if (!qid) return;

      setCompletedQuizzes(prev => {
        const n = new Set(prev);
        n.add(qid);
        if (!isEmailUser) {
          try { localStorage.setItem(QUIZ_PROGRESS_KEY(courseId), JSON.stringify([...n])); } catch {}
        }
        completedQuizzesRef.current = n;
        return n;
      });

      if (isEmailUser) saveQuizToServer(qid);
    };
    window.addEventListener("lms_quiz_submitted", h as EventListener);
    return () => window.removeEventListener("lms_quiz_submitted", h as EventListener);
  }, [courseId, isEmailUser]);

  /* ── event: quiz advanced ── */
  useEffect(() => {
    const h = () => {
      const ni = pendingNextVideoRef.current;
      if (ni !== null && ni >= 0) {
        pendingNextVideoRef.current = null;
        const nfv = flatVideos[ni];
        if (nfv) {
          const nmk = nfv.moduleId ?? `module-${nfv.moduleIndex}`;
          setOpenModuleId(nmk);
          setOpenSubKey(`${nmk}-sub-${nfv.subIndex}`);
        }
        setTimeout(() => playGlobalIndex(ni, true), 300);
      }
    };
    window.addEventListener("lms_quiz_advance", h as EventListener);
    return () => window.removeEventListener("lms_quiz_advance", h as EventListener);
  }, [flatVideos]);

  /* ── save on tab close ── */
  useEffect(() => {
    const h = () => {
      const key = activeVideoKeyRef.current; if (!key) return;
      const gi  = videoKeyToGlobalIndex.get(key); if (typeof gi !== "number") return;
      const e   = serverProgressRef.current.get(gi);
      const merg = getMergedForKey(flatVideos[gi]?.key ?? "");
      const dur  = merg?.duration ? Math.floor(merg.duration) : 0;
      const pos  = dur > 0 ? dur : (e?.positionSeconds ?? 0);
      const fv   = flatVideos[gi];
      const payload: any = {
        userKey: getUserKey(), courseId,
        positionSeconds: Math.floor(Math.max(0, pos)),
        duration: dur, completed: Boolean(dur > 0 && pos >= dur),
        videoId: fv?.videoId ?? `idx_${gi}`,
      };
      try {
        if (navigator.sendBeacon)
          navigator.sendBeacon("/api/course_progress",
            new Blob([JSON.stringify(payload)], { type: "application/json" }));
      } catch {}
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [courseId, flatVideos, videoKeyToGlobalIndex]);

  /* ════════════════════════════════════════════════
    RENDER
  ════════════════════════════════════════════════ */
  if (!course?.modules?.length) {
    return (
      <div className="p-6 text-center border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm">
        No course curriculum available.
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">

      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-white border-indigo-100 shadow-md ring-1 ring-indigo-50">
        <h2 className="text-2xl font-black text-slate-900 leading-tight mb-2">{course.name}</h2>
        <p className="text-xs text-gray-500 mt-1">{course.description}</p>
        <div className="flex flex-col gap-4 mt-3">
          <div className="flex flex-row gap-4 items-center">
            <span className="text-[14px] font-medium text-gray-500 flex items-center gap-1">
              <BookOpen size={14} className="text-blue-400" /> {course.modules.length} Modules
            </span>
            <span className="text-[14px] font-medium text-gray-500 flex items-center gap-1">
              <Video size={14} className="text-blue-400" /> Video Lessons
            </span>
          </div>
          {Boolean(allowedModules?.length) && (
            <button onClick={() => setMeetModalOpen(true)} type="button"
              className="w-full mt-6 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2">
              Book A meet with mentors
            </button>
          )}
          {isFreeLoggedIn && !allowedModules?.length && (
            <div className="ml-auto">
              <button onClick={() => router.push("/enroll")} type="button"
                className="px-3 py-2 bg-amber-500 text-white text-sm font-semibold rounded-md hover:bg-amber-600 focus:outline-none">
                Upgrade your Access
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modules */}
      <div className="space-y-2">
        {course.modules.map((module, moduleIndex) => {
          const moduleKey      = module.moduleId ?? `module-${moduleIndex}`;
          const isOpen         = openModuleId === moduleKey;
          const moduleUnlocked = isFreeLoggedIn
            ? moduleIndex === 0
            : Boolean(
                (module.moduleId && (unlockedModulesSet.has(module.moduleId) || allowedSet.has(module.moduleId))) ||
                (!module.moduleId && unlockedModulesSet.has(moduleKey))
              );

          return (
            <div key={moduleKey}
              className={`transition-all duration-300 rounded-2xl border ${isOpen
                ? "bg-white border-indigo-100 shadow-md ring-1 ring-indigo-50"
                : "bg-white border-slate-100 hover:border-slate-200"}`}>

              {/* module toggle */}
              <div
                onClick={() => {
                  if (!moduleUnlocked) return;
                  if (isOpen) { setOpenModuleId(null); setOpenSubKey(null); setActiveVideoKey(null); }
                  else        { setOpenModuleId(moduleKey); setOpenSubKey(null); setActiveVideoKey(null); }
                }}
                className={`w-full flex items-center justify-between px-4 py-3 cursor-pointer transition-colors
                  ${isOpen ? "bg-gray-50" : "hover:bg-gray-50"}
                  ${!moduleUnlocked ? "cursor-not-allowed opacity-70" : ""}`}>
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm bg-indigo-600 text-white shadow-lg shadow-indigo-100">
                    {(moduleIndex + 1).toString().padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{module.name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                      {module.submodules?.length || 0} lessons
                    </p>
                    {!moduleUnlocked && <p className="text-xs text-red-500 mt-1">🔒 Locked — contact admin to unlock</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {moduleUnlocked
                    ? isOpen
                      ? <ChevronUp   size={16} className="text-gray-400" />
                      : <ChevronDown size={16} className="text-gray-400" />
                    : <div className="group/lock relative p-1">
                        <Lock size={18} className="text-gray-400" />
                        <div className="hidden group-hover/lock:block absolute -top-10 right-0 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          Upgrade to Access
                        </div>
                      </div>
                  }
                </div>
              </div>

              {/* submodules */}
              {isOpen && (
                <div className="border-t border-gray-100 divide-y divide-gray-50">
                  {module.submodules?.length ? (
                    module.submodules.map((sub, subIndex) => {
                      const moduleKeyPart = module.moduleId ?? `module-${moduleIndex}`;
                      const subKey        = `${moduleKey}-sub-${subIndex}`;
                      const subIsOpen     = openSubKey === subKey;

                      // DEBUG: log the submodule payload (will show items or videos/quizzes)
                      console.debug("[CURRICULUM_DEBUG] module:", moduleKeyPart, "subIndex:", subIndex, "sub:", sub);

                      // derive videos / quizzes, supporting `items[]`
                      const videos: VideoItem[] = Array.isArray(sub.videos)
                        ? sub.videos
                        : (Array.isArray((sub as any).items)
                            ? (sub as any).items.filter((it:any)=>it?.type==="video").map((it:any) => ({
                                id: it.sessionId ?? it.videoId ?? it.id,
                                title: it.videoTitle ?? it.name,
                                url: it.url ?? it.s3_url ?? it.secure_url ?? null,
                                thumb: it.thumb ?? undefined,
                                duration: typeof it.duration === "number" ? it.duration : undefined,
                              }))
                            : []);

                      // DEBUG: show derived videos and raw items
                      if (Array.isArray((sub as any).items)) {
                        console.debug("[CURRICULUM_DEBUG] sub.items:", (sub as any).items);
                      }
                      console.debug("[CURRICULUM_DEBUG] derived videos:", videos);

                      const quizzes: Quiz[] = (quizzesBySubmodule[String(sub.submoduleId ?? "")] ?? [])
                        .slice();

                      // If there are no quizzes in quizzesBySubmodule, but sub.items contains quiz items, use those
                      if ((!quizzes || quizzes.length === 0) && Array.isArray((sub as any).items)) {
                        const qItems = (sub as any).items.filter((it:any)=>it?.type==="quiz");
                        if (qItems.length) {
                          const mapped = qItems.map((q:any) => {
                            const rawOrder = q.order ?? q.sortOrder ?? q.position ?? q.quiz_order ?? null;
                            const normOrder = rawOrder == null ? null : (() => {
                              const n = Number(rawOrder);
                              return Number.isFinite(n) ? Math.floor(n) : null;
                            })();
                            return {
                              id: String(q.quizId ?? q.id ?? q.quizRefId ?? Math.random()),
                              name: q.name ?? q.quizTitle ?? q.title ?? "Quiz",
                              submodule_id: String(sub.submoduleId ?? ""),
                              course_slug: course?.slug ?? "",
                              time_minutes: q.quiz?.time_minutes ?? q.time_minutes,
                              questions: q.quiz?.questions ?? q.questions ?? [],
                              order: normOrder,
                            } as Quiz;
                          });
                          (quizzes as any) = mapped;
                          console.debug("[CURRICULUM_DEBUG] derived quizzes from items:", mapped);
                        }
                      }

                      /* ---------------------------
                         Build orderedItems:
                         - If sub.items exists: use its order (DB order)
                           • compute gi for videos via videoKeyToGlobalIndex
                           • compute prevVideoGi for quizzes as the last seen video gi
                         - Otherwise, fall back to buildOrderedSubItems
                         --------------------------- */
                      const orderedItems: OrderedSubItem[] = Array.isArray(sub.items)
  ? (() => {

      const arr: OrderedSubItem[] = [];

      let lastVideoGi = -1;

      /* IMPORTANT:
         count videos separately from items
         because global video index uses video order only
      */
      let videoCounter = 0;

      (sub.items as any[]).forEach((it: any) => {

        /* ================= VIDEO ================= */

        if (it.type === "video") {

          const vIndex = videoCounter;

          const key = `${moduleKeyPart}-sub-${subIndex}-vid-${vIndex}`;

          const gi = videoKeyToGlobalIndex.get(key) ?? -1;

          lastVideoGi = gi;

          arr.push({
            type: "video",
            vIndex,
            v: {
              id: it.videoId ?? it.sessionId ?? it.id,
              title: it.videoTitle ?? it.name,
              url:
                getMergedForKey(key)?.url ??
                it.url ??
                it.s3_url ??
                null,
              thumb: getMergedForKey(key)?.thumb ?? it.thumb,
              duration:
                getMergedForKey(key)?.duration ??
                (typeof it.duration === "number" ? it.duration : undefined),
            },
            key,
            gi,
          } as OrderedVideoItem);

          videoCounter++;
        }

        /* ================= QUIZ ================= */

        else if (it.type === "quiz") {

          const qid = String(it.quizId ?? it.id ?? it.quizRefId ?? Math.random());

          const q: Quiz = {
            id: qid,
            name: it.name ?? it.quizTitle ?? "Quiz",
            submodule_id: String(sub.submoduleId ?? ""),
            course_slug: course?.slug ?? "",
            time_minutes: it.quiz?.time_minutes ?? it.time_minutes,
            questions: it.quiz?.questions ?? it.questions ?? [],
            order: it.order ?? null,
          };

          arr.push({
            type: "quiz",
            q,
            prevVideoGi: lastVideoGi,
          } as OrderedQuizItem);
        }

        else {
          console.debug(
            "[CURRICULUM_DEBUG] unknown sub.item type skipped:",
            it
          );
        }
      });

      return arr;

    })()
  : buildOrderedSubItems(
      videos,
      quizzes,
      moduleKeyPart,
      subIndex,
      videoKeyToGlobalIndex
    );

                      console.debug("[CURRICULUM_DEBUG] orderedItems:", orderedItems);

                      return (
                        <div key={subKey}
                          className={`p-3 transition-colors ${subIsOpen ? "bg-blue-50/20" : "hover:bg-gray-50"}`}>

                          {/* SUBMODULE TOGGLE */}
                          <button type="button"
                            onClick={() => { if (!moduleUnlocked) return; setOpenSubKey(subIsOpen ? null : subKey); }}
                            className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-colors ${subIsOpen ? "bg-blue-100" : "hover:bg-slate-50"}`}>
                            <div className="space-y-0.5 text-left">
                              <h4 className={`text-xs font-bold ${subIsOpen ? "text-indigo-900" : "text-gray-700"}`}>
                                {sub.title}
                              </h4>
                              <p className="text-[10px] text-gray-400">{sub.description}</p>
                            </div>
                            <CheckCircle2 size={14} className={subIsOpen ? "text-indigo-400" : "text-gray-200"} />
                          </button>

                          {subIsOpen && (
                            <div className="mt-3 space-y-2">
                              {orderedItems.length > 0 ? (
                                orderedItems.map((item, itemIndex) => {

                                  /* ─── VIDEO ITEM ─── */
                                  if (item.type === "video") {
                                    const vidItem = item as OrderedVideoItem;
                                    const { v: vv, key: videoKey, gi: globalIndex } = vidItem;
                                    const merged    = getMergedForKey(videoKey);
                                    const urlToPlay = merged?.url ?? vv.url;
                                    const visible   = Boolean(urlToPlay);
                                    const done      = typeof globalIndex === "number" && globalIndex >= 0 ? completedSet.has(globalIndex) : false;

                                    // compute previous video gi within same sub (look for previous index)
                                    const prevIdx = vidItem.vIndex - 1;
                                    const prevKey = `${moduleKeyPart}-sub-${subIndex}-vid-${prevIdx}`;
                                    const prevGiLocal = videoKeyToGlobalIndex.get(prevKey) ?? -1;
                                    const prevGlobalDone = prevGiLocal >= 0 ? completedSet.has(prevGiLocal) : true; // if unknown prevGi treat as passed

                                    // quizzes placed after previous video in DB (if previous video mapped)
                                    const quizBetweenArr = prevGiLocal >= 0 ? (videoToNextQuizzes.get(prevGiLocal) ?? []) : [];
                                    const quizGatePassed = quizBetweenArr.length === 0 || quizBetweenArr.every(q => completedQuizzes.has(q.id));
                                    const isFirst        = typeof globalIndex === "number" && globalIndex === 0;

                                    const unlocked       = Boolean(
                                      moduleUnlocked && (isFirst || done || (prevGlobalDone && quizGatePassed))
                                    );

                                    return (
                                      <div key={videoKey}
                                        className={`flex items-center gap-3 p-2 rounded-md transition ${activeVideoKey === videoKey ? "" : "hover:bg-gray-50"}`}>
                                        <div className="flex w-full items-center gap-2">
                                          {urlToPlay ? (
                                            <button type="button"
                                              disabled={!visible || !unlocked}
                                              onClick={() => {
                                                if (!visible || !unlocked) return;
                                                if (typeof globalIndex === "number" && globalIndex >= 0) {
                                                  playGlobalIndex(globalIndex);
                                                } else {
                                                  // No global index mapping available — play directly
                                                  onPlayVideo(urlToPlay, vv.title, module.moduleId ?? "", vidItem.vIndex, { resumeSeconds: undefined, autoplay: true });
                                                  setActiveVideoKey(videoKey);
                                                }
                                              }}
                                              className={`w-full flex justify-between items-center gap-3 p-3 rounded-xl border transition-all bg-white
                                                ${unlocked
                                                  ? "border-slate-100 hover:border-indigo-100 text-slate-600 hover:text-indigo-600 cursor-pointer"
                                                  : "border-slate-100 opacity-50 cursor-not-allowed"}`}>
                                              <div className="flex items-center gap-3">
                                                <MdDisplaySettings size={16} className="text-indigo-600" />
                                                <p className="text-xs font-semibold flex items-center gap-2">
                                                  {vv.title}
                                                  {done && (
                                                    <span className="inline-flex items-center ml-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 border border-emerald-100">
                                                      <CheckCircle2 size={12} className="text-emerald-500" />
                                                      <span className="ml-1 text-emerald-700">Completed</span>
                                                    </span>
                                                  )}
                                                </p>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                {!unlocked
                                                  ? <span className="text-[11px] px-2 py-1 rounded bg-gray-50 border text-gray-400 flex items-center gap-1">
                                                      <Lock size={12} /> Locked
                                                    </span>
                                                  : <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded">
                                                      {done ? "Replay" : "Play"}
                                                    </span>
                                                }
                                              </div>
                                            </button>
                                          ) : (
                                            <span className="text-xs text-gray-300">No URL</span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  }

                                  /* ─── QUIZ ITEM ─── */
                                  const qItem = item as OrderedQuizItem;
                                  const { q, prevVideoGi } = qItem;
                                  const quizDone     = completedQuizzes.has(q.id);
                                  const quizUnlocked = prevVideoGi >= 0 ? completedSet.has(prevVideoGi) : true;

                                  return (
                                    <div key={q.id}
                                      className={`flex items-center gap-3 p-3 rounded-xl border border-dashed transition-all
                                        ${quizUnlocked
                                          ? "border-amber-200 bg-amber-50/30 hover:bg-amber-50 cursor-pointer"
                                          : "border-gray-200 bg-gray-50/30 opacity-60 cursor-not-allowed"}`}>
                                      <button
                                        disabled={!quizUnlocked}
                                        onClick={() => {
                                          if (!quizUnlocked || !onOpenQuiz) return;
                                          if (prevVideoGi >= 0)
                                            computePendingNextVideo(prevVideoGi, completedSetRef.current);
                                          onOpenQuiz(q);
                                        }}
                                        className="flex w-full items-center justify-between p-1">
                                        <div className="flex items-center gap-3">
                                          <FileText size={16}
                                            className={quizDone ? "text-emerald-500" : quizUnlocked ? "text-indigo-600" : "text-gray-400"}
                                          />
                                          <div className="text-left">
                                            <p className="text-xs font-semibold">{q.name}</p>
                                            {quizDone
                                              ? <p className="text-[10px] text-emerald-600 flex items-center gap-1 mt-0.5">
                                                  <CheckCircle2 size={10} /> Completed
                                                </p>
                                              : !quizUnlocked &&
                                                <p className="text-[10px] text-gray-400 mt-0.5">
                                                  Watch the previous video first
                                                </p>
                                            }
                                          </div>
                                        </div>
                                        <span className={`px-3 py-1 text-[10px] font-bold rounded ${
                                          quizDone       ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                          : quizUnlocked ? "bg-indigo-600 text-white"
                                          : "bg-gray-100 text-gray-400"}`}>
                                          {quizDone ? "RETAKE" : quizUnlocked ? "TAKE QUIZ" : "LOCKED"}
                                        </span>
                                      </button>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-sm text-gray-400 italic p-2">No content available.</div>
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