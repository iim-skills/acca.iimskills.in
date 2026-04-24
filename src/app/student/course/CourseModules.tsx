"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BookingApp from "@/components/MentorsMeetForm";
import {
  ChevronDown,
  ChevronUp,
  Video,
  Lock,
  CheckCircle2,
  FileText,
  BookOpen,
  Tag,
  ExternalLink,
  RotateCcw,
  PlayIcon,
} from "lucide-react";
import Modal from "@/components/Modal";
import Link from "next/link";
 

import { MdDisplaySettings } from "react-icons/md";
import { Play } from "next/font/google";

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

export type PdfItem = {
  type: "pdf";
  pdfId?: string;
  name?: string;
  fileUrl?: string;
};

export type Submodule = {
  submoduleId?: string;
  title?: string;
  description?: string;
  videos?: VideoItem[];
  quizzes?: any[];
  items?: any[];
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

const gradients = [
  "from-indigo-500 to-purple-500",
  "from-pink-500 to-rose-500",
  "from-green-400 to-emerald-600",
  "from-blue-400 to-cyan-500",
  "from-orange-400 to-red-500",
  "from-violet-500 to-fuchsia-500",
];

const SUPER_UNLOCK_EMAIL = "parv@iimskills.com";



type ProgressEntry = { positionSeconds: number; completed: boolean };

type Props = {
  course: Course | null;
  allowedModules?: string[] | number[];
  progress?: Record<string, number[]>;
  onPlayVideo: (
    videoUrl: string,
    title?: string,
    moduleId?: string,
    videoIndex?: number,
    options?: {
      resumeSeconds?: number;
      autoplay?: boolean;
      allowSeek?: boolean;
    }
  ) => void;
  onReportPlayerProgress?: (
    globalIndex: number,
    positionSeconds: number,
    completed?: boolean
  ) => void;
  onOpenQuiz?: (quiz: any) => void;
};

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
  order?: number | null;
};

type OrderedVideoItem = {
  type: "video";
  vIndex: number;
  v: VideoItem;
  key: string;
  gi: number;
};

type OrderedQuizItem = {
  type: "quiz";
  q: Quiz;
  prevVideoGi: number;
};

type OrderedPdfItem = {
  type: "pdf";
  p: PdfItem;
  key: string;
};

type OrderedSubItem = OrderedVideoItem | OrderedQuizItem | OrderedPdfItem;

const FREE_PREVIEW_COUNT = 4;
const FREE_PREVIEW_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const FREE_PREVIEW_START_KEY = (cid: string) =>
  `free_preview_start_${cid || "unknown_course"}`;
const GUEST_PROGRESS_KEY = (cid: string) =>
  `guest_progress_${cid || "unknown_course"}`;
const QUIZ_PROGRESS_KEY = (cid: string) =>
  `quiz_progress_${cid || "unknown_course"}`;

/* ─────────────────────────────────────────────────────────────────
  buildOrderedSubItems
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

  const parseOrder = (o: any) => {
    if (o == null) return videosLen + 1;
    const n = Number(o);
    if (!Number.isFinite(n) || n <= 0) return videosLen + 1;
    return Math.floor(n);
  };

  const normalized = quizzes.map((q) => ({
    q,
    parsedOrder: parseOrder((q as any).order),
  }));

  for (let vi = 0; vi < videos.length; vi++) {
    const key = `${mkp}-sub-${si}-vid-${vi}`;
    const gi = giMap.get(key) ?? -1;
    lastVideoGi = gi;

    result.push({
      type: "video",
      vIndex: vi,
      v: videos[vi],
      key,
      gi,
    });

    normalized
      .filter((nq) => nq.parsedOrder === vi + 1)
      .forEach((nq) =>
        result.push({ type: "quiz", q: nq.q, prevVideoGi: gi })
      );
  }

  normalized
    .filter((nq) => nq.parsedOrder > videosLen)
    .forEach((nq) =>
      result.push({ type: "quiz", q: nq.q, prevVideoGi: lastVideoGi })
    );

  return result;
}

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
      const videoItems: any[] = Array.isArray(s.videos)
        ? s.videos
        : Array.isArray((s as any).items)
        ? (s as any).items.filter((it: any) => it?.type === "video")
        : [];

      videoItems.forEach((v: any, vi: number) => {
        const mkp = m.moduleId ?? `module-${mi}`;
        const idVal = v.id ?? v.videoId ?? v.sessionId;
        const title = v.title ?? v.videoTitle ?? v.name;
        const url = v.url ?? v.s3_url ?? v.secure_url ?? null;

        out.push({
          moduleIndex: mi,
          subIndex: si,
          videoIndex: vi,
          moduleId: m.moduleId,
          submoduleId: s.submoduleId,
          title,
          url,
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
  const [meetModalOpen, setMeetModalOpen] = useState(false);
  const [isFreeLoggedIn, setIsFreeLoggedIn] = useState(false);
  const [allowSeek, setAllowSeek] = useState(false);
  const [freePreviewStartedAt, setFreePreviewStartedAt] = useState<number | null>(null);
  const [isFreePreviewExpired, setIsFreePreviewExpired] = useState(false);

  const [isEmailUser] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const u = JSON.parse(raw);
        return Boolean(u?.email);
      }
      return false;
    } catch {
      return false;
    }
  });

  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");

useEffect(() => {
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const u = JSON.parse(raw);
      setCurrentUserEmail(String(u?.email ?? "").toLowerCase().trim());
    }
  } catch {
    setCurrentUserEmail("");
  }
}, []);

const isSuperUnlockedUser = currentUserEmail === SUPER_UNLOCK_EMAIL;

  const [guestProgress, setGuestProgress] = useState<Set<number>>(new Set());
  const [serverProgress, setServerProgress] = useState<
    Map<number, ProgressEntry>
  >(new Map());
  const [completedQuizzes, setCompletedQuizzes] = useState<Set<string>>(
    new Set()
  );
  const [quizzesBySubmodule, setQuizzesBySubmodule] = useState<
    Record<string, Quiz[]>
  >({});
  const [mergedMap, setMergedMap] = useState<Map<string, any>>(new Map());

  const serverProgressRef = useRef<Map<number, ProgressEntry>>(new Map());
  const completedSetRef = useRef<Set<number>>(new Set());
  const completedQuizzesRef = useRef<Set<string>>(new Set());
  const activeVideoKeyRef = useRef<string | null>(null);
  const saveTimersRef = useRef<Record<number, number | null>>({});
  const pendingNextVideoRef = useRef<number | null>(null);

  useEffect(() => {
    serverProgressRef.current = serverProgress;
  }, [serverProgress]);

  useEffect(() => {
    activeVideoKeyRef.current = activeVideoKey;
  }, [activeVideoKey]);

  useEffect(() => {
    completedQuizzesRef.current = completedQuizzes;
  }, [completedQuizzes]);

  const router = useRouter();
  const courseId = course?.courseId ?? "";

  const flatVideos = useMemo(() => flattenCourseVideos(course), [course]);

  const videoKeyToGlobalIndex = useMemo(() => {
    const m = new Map<string, number>();
    flatVideos.forEach((v, i) => m.set(v.key, i));
    return m;
  }, [flatVideos]);

  useEffect(() => {
    console.debug("[CURRICULUM_DEBUG] course payload:", course);
    console.debug("[CURRICULUM_DEBUG] flatVideos:", flatVideos);
    console.debug(
      "[CURRICULUM_DEBUG] videoKeyToGlobalIndex:",
      Array.from(videoKeyToGlobalIndex.entries())
    );
  }, [course, flatVideos, videoKeyToGlobalIndex]);

  const getUserKey = (): string => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.email) return u.email;
      }
      let k = localStorage.getItem("course_user_key");
      if (!k) {
        k = crypto.randomUUID();
        localStorage.setItem("course_user_key", k);
      }
      return k;
    } catch {
      return "guest-" + Date.now();
    }
  };

  const getMergedForKey = (key: string) => {
    try {
      return mergedMap.get(key);
    } catch {
      return undefined;
    }
  };

  const allowedSet = useMemo(
    () =>
      new Set(
        (Array.isArray(allowedModules) ? allowedModules : []).map((x: any) =>
          String(x)
        )
      ),
    [allowedModules]
  );

  const isFreePreviewVideo = (globalIndex: number) =>
    isFreeLoggedIn &&
    freePreviewStartedAt !== null &&
    !isFreePreviewExpired &&
    globalIndex >= 0 &&
    globalIndex < FREE_PREVIEW_COUNT;

  const hasFreePreviewInModule = (moduleIndex: number) =>
    flatVideos.some(
      (fv, gi) => fv.moduleIndex === moduleIndex && isFreePreviewVideo(gi)
    );

  const hasFreePreviewInSubmodule = (
    moduleIndex: number,
    subIndex: number
  ) =>
    flatVideos.some(
      (fv, gi) =>
        fv.moduleIndex === moduleIndex &&
        fv.subIndex === subIndex &&
        isFreePreviewVideo(gi)
    );

  /* ── completedSet ── */
  const completedSet = useMemo(() => {
    const s = new Set<number>();

    course?.modules?.forEach((m) => {
      const mid = m.moduleId;
      const done = mid ? progress?.[mid] ?? [] : [];
      if (mid && Array.isArray(done)) {
        flatVideos.filter((fv) => fv.moduleId === mid).forEach((fv, li) => {
          if (done.includes(li)) {
            const gi = videoKeyToGlobalIndex.get(fv.key);
            if (typeof gi === "number") s.add(gi);
          }
        });
      }
    });

    serverProgress.forEach((e, i) => {
      if (e.completed) s.add(i);
    });

    if (!isEmailUser) {
      guestProgress.forEach((g) => s.add(g));
    }

    return s;
  }, [
    progress,
    flatVideos,
    videoKeyToGlobalIndex,
    guestProgress,
    course?.modules,
    serverProgress,
    isEmailUser,
  ]);

  useEffect(() => {
    completedSetRef.current = completedSet;
  }, [completedSet]);

  /* ── login type ── */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const u = JSON.parse(raw);
        if (
          u?.loginType === "guest" ||
          u?.role === "guest" ||
          u?.loginType === "free"
        ) {
          setIsFreeLoggedIn(true);
          return;
        }
      }
      if (
        localStorage.getItem("course_user_key") &&
        !(Array.isArray(allowedModules) && allowedModules.length > 0)
      ) {
        setIsFreeLoggedIn(true);
        return;
      }
      setIsFreeLoggedIn(false);
    } catch {
      setIsFreeLoggedIn(false);
    }
  }, [JSON.stringify(allowedModules ?? [])]);

  /* ── free preview window ── */
  useEffect(() => {
    if (!isFreeLoggedIn || !courseId) {
      setFreePreviewStartedAt(null);
      setIsFreePreviewExpired(false);
      return;
    }

    let timeoutId: number | null = null;

    try {
      const key = FREE_PREVIEW_START_KEY(courseId);
      const raw = localStorage.getItem(key);
      let startedAt = raw ? Number(raw) : NaN;

      if (!Number.isFinite(startedAt) || startedAt <= 0) {
        startedAt = Date.now();
        localStorage.setItem(key, String(startedAt));
      }

      setFreePreviewStartedAt(startedAt);

      const elapsed = Date.now() - startedAt;
      const remaining = FREE_PREVIEW_DURATION_MS - elapsed;

      if (remaining <= 0) {
        setIsFreePreviewExpired(true);
      } else {
        setIsFreePreviewExpired(false);
        timeoutId = window.setTimeout(() => {
          setIsFreePreviewExpired(true);
        }, remaining);
      }
    } catch {
      const startedAt = Date.now();
      setFreePreviewStartedAt(startedAt);
      setIsFreePreviewExpired(false);
    }

    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [courseId, isFreeLoggedIn]);

  /* ── auto-open free preview content ── */
  useEffect(() => {
    if (!course?.modules?.length || !isFreeLoggedIn || isFreePreviewExpired) return;

    const firstPreview = flatVideos[0];
    if (firstPreview) {
      const fk = firstPreview.moduleId ?? `module-${firstPreview.moduleIndex}`;
      setOpenModuleId(fk);
      setOpenSubKey(`${fk}-sub-${firstPreview.subIndex}`);
      return;
    }

    const first = course.modules[0];
    const fk = first.moduleId ?? "module-0";
    setOpenModuleId(fk);
    if (first.submodules?.length) setOpenSubKey(`${fk}-sub-0`);
  }, [course, isFreeLoggedIn, isFreePreviewExpired, flatVideos]);

  /* ── guest video progress ── */
  useEffect(() => {
    if (isEmailUser) return;
    if (!courseId) {
      setGuestProgress(new Set());
      return;
    }
    try {
      const raw = localStorage.getItem(GUEST_PROGRESS_KEY(courseId));
      setGuestProgress(
        raw ? new Set(JSON.parse(raw) as number[]) : new Set()
      );
    } catch {
      setGuestProgress(new Set());
    }
  }, [courseId, isEmailUser]);

  /* ── guest quiz progress ── */
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

  /* ── server progress load ── */
  useEffect(() => {
    if (!courseId) return;
    let mounted = true;

    (async () => {
      try {
        const uk = getUserKey();
        const res = await fetch(
          `/api/course_progress?courseId=${encodeURIComponent(
            courseId
          )}&userKey=${encodeURIComponent(uk)}`
        );

        if (!res.ok || !mounted) return;

        const data = (await res.json()) as any[];
        const flat = flattenCourseVideos(course);
        const vidMap = new Map<string, number>();
        flat.forEach((fv, i) => {
          if (fv.videoId) vidMap.set(String(fv.videoId), i);
        });

        const videoMap = new Map<number, ProgressEntry>();
        const quizFromDB = new Set<string>();

        data.forEach((d) => {
          if (
            typeof d.videoId === "string" &&
            d.videoId.startsWith("quiz_")
          ) {
            if (d.completed) quizFromDB.add(d.videoId.slice(5));
            return;
          }

          let gi = -1;
          if (typeof d.globalIndex === "number") gi = d.globalIndex;
          else if (typeof d.global_index === "number") gi = d.global_index;
          else if (
            typeof d.videoId === "string" &&
            d.videoId.startsWith("idx_")
          )
            gi = parseInt(d.videoId.replace("idx_", ""), 10);
          else {
            const vid = d.videoId ?? d.video_public_id ?? d.video_publicid;
            if (vid)
              gi =
                vidMap.get(String(vid)) ??
                flat.findIndex(
                  (fv) => String(fv.videoId) === String(vid)
                );
          }

          if (gi >= 0) {
            videoMap.set(gi, {
              positionSeconds: Number(
                d.positionSeconds ?? d.position_seconds ?? 0
              ),
              completed: Boolean(d.completed),
            });
          }
        });

        if (mounted) {
          setServerProgress(videoMap);
          if (quizFromDB.size > 0) {
            setCompletedQuizzes((prev) => {
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

    return () => {
      mounted = false;
    };
  }, [courseId, course]);

  /* ── mergedMap ── */
  useEffect(() => {
    const m = new Map<string, any>();

    course?.modules?.forEach((mod, mi) => {
      const mkp = mod.moduleId ?? `module-${mi}`;

      mod.submodules?.forEach((s, si) => {
        const videoItems: any[] = Array.isArray(s.videos)
          ? s.videos
          : Array.isArray((s as any).items)
          ? (s as any).items.filter((it: any) => it?.type === "video")
          : [];

        videoItems.forEach((v, vi) => {
          const key = `${mkp}-sub-${si}-vid-${vi}`;
          const idVal = v.id ?? v.videoId ?? v.sessionId;
          const url = v.url ?? v.s3_url ?? v.secure_url ?? null;

          m.set(key, {
            url,
            videoId: idVal ?? null,
            thumb: v.thumb ?? null,
            duration:
              typeof v.duration === "number" ? v.duration : undefined,
            visible: Boolean(url),
          });
        });
      });
    });

    setMergedMap(m);
  }, [course]);

  /* ── quizzesBySubmodule ── */
  useEffect(() => {
    const map: Record<string, Quiz[]> = {};

    course?.modules?.forEach((m) => {
      m.submodules?.forEach((s) => {
        const subId = String(s.submoduleId ?? "");
        const rawQs: any[] = Array.isArray(s.quizzes)
          ? s.quizzes
          : Array.isArray((s as any).items)
          ? (s as any).items.filter((it: any) => it?.type === "quiz")
          : [];

        if (!rawQs.length) return;

        map[subId] = rawQs.map((q: any) => {
          const rawOrder =
            q.order ?? q.sortOrder ?? q.position ?? q.quiz_order ?? null;
          const normOrder =
            rawOrder == null
              ? null
              : (() => {
                  const n = Number(rawOrder);
                  return Number.isFinite(n) ? Math.floor(n) : null;
                })();

          return {
            id: String(q.quizId ?? q.id ?? q.quizRefId ?? Math.random()),
            name: q.name ?? q.quizTitle ?? q.title ?? "Quiz",
            submodule_id: subId,
            course_slug: course?.slug ?? "",
            time_minutes: q.quiz?.time_minutes ?? q.time_minutes,
            questions: q.quiz?.questions ?? q.questions ?? [],
            order: normOrder,
          } as Quiz;
        });
      });
    });

    setQuizzesBySubmodule(map);
  }, [course]);

  /* ══════════════════════════════════════════════════════════════════
    videoToNextQuizzes
  ══════════════════════════════════════════════════════════════════ */
  const videoToNextQuizzes = useMemo(() => {
    const map = new Map<number, Quiz[]>();

    course?.modules?.forEach((m, mi) => {
      const mkp = m.moduleId ?? `module-${mi}`;

      m.submodules?.forEach((s, si) => {
        if (
          Array.isArray((s as any).items) &&
          (s as any).items.length > 0
        ) {
          let lastVideoGi = -1;
          let videoCounter = 0;

          (s as any).items.forEach((it: any) => {
            if (it.type === "video") {
              const key = `${mkp}-sub-${si}-vid-${videoCounter}`;
              const gi = videoKeyToGlobalIndex.get(key) ?? -1;
              lastVideoGi = gi;
              videoCounter++;
            } else if (it.type === "quiz") {
              if (lastVideoGi < 0) return;

              const qid = String(
                it.quizId ?? it.id ?? it.quizRefId ?? Math.random()
              );
              const q: Quiz = {
                id: qid,
                name: it.name ?? it.quizTitle ?? "Quiz",
                submodule_id: String(s.submoduleId ?? ""),
                course_slug: course?.slug ?? "",
                time_minutes: it.quiz?.time_minutes ?? it.time_minutes,
                questions: it.quiz?.questions ?? it.questions ?? [],
                order: it.order ?? null,
              };

              const arr = map.get(lastVideoGi) ?? [];
              arr.push(q);
              map.set(lastVideoGi, arr);
            }
          });

          return;
        }

        const videos = Array.isArray(s.videos) ? s.videos : [];
        const quizzes =
          quizzesBySubmodule[String(s.submoduleId ?? "")] ?? [];
        const items = buildOrderedSubItems(
          videos,
          quizzes,
          mkp,
          si,
          videoKeyToGlobalIndex
        );

        items.forEach((item) => {
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
  const unlockedModulesSet = useMemo(() => {
    const s = new Set<string>();
    const mods = course?.modules ?? [];

    mods.forEach((m) => {
      if (m.moduleId && allowedSet.has(String(m.moduleId)))
        s.add(String(m.moduleId));
    });

    for (let i = 0; i < mods.length; i++) {
      const m = mods[i];
      const mid = m.moduleId ?? `module-${i}`;
      const midStr = String(mid);
      if (s.has(midStr) || i === 0) continue;

      const prev = mods[i - 1];
      const pid = prev.moduleId ?? `module-${i - 1}`;
      const pidStr = String(pid);

      if (s.has(pidStr) && isModuleCompleted(prev)) s.add(midStr);
    }

    return s;
  }, [course?.modules, allowedSet, completedSet, flatVideos]);

  const isIdAllowedOrUnlocked = (id: any) => {
    if (!id) return false;
    const sid = String(id);
    return allowedSet.has(sid) || unlockedModulesSet.has(sid);
  };

  function isModuleCompleted(module: Module) {
    if (!module.submodules?.length) return true;

    return module.submodules.every((s, si) =>
      (s.videos ?? []).every((_, vi) => {
        const fv = flatVideos.find(
          (f) =>
            f.moduleId === module.moduleId &&
            f.subIndex === si &&
            f.videoIndex === vi
        );
        if (!fv) return false;
        const gi = videoKeyToGlobalIndex.get(fv.key);
        return typeof gi === "number" && completedSet.has(gi);
      })
    );
  }

  /* ── isSubmoduleCompleted ── */
  function isSubmoduleCompleted(moduleIndex: number, subIndex: number): boolean {
    const mod = course?.modules?.[moduleIndex];
    if (!mod) return false;
    const sub = mod.submodules?.[subIndex];
    if (!sub) return false;

    const videoDone = flatVideos
      .filter(
        (fv) =>
          fv.moduleIndex === moduleIndex && fv.subIndex === subIndex
      )
      .every((fv) => {
        const gi = videoKeyToGlobalIndex.get(fv.key);
        return typeof gi === "number" && completedSet.has(gi);
      });

    if (!videoDone) return false;

    const subId = String(sub.submoduleId ?? "");
    const quizList = quizzesBySubmodule[subId] ?? [];

    let allQuizIds: string[] = quizList.map((q) => q.id);
    if (Array.isArray((sub as any).items)) {
      const inlineQuizIds = (sub as any).items
        .filter((it: any) => it?.type === "quiz")
        .map((it: any) =>
          String(it.quizId ?? it.id ?? it.quizRefId ?? "")
        )
        .filter(Boolean);
      allQuizIds = [...new Set([...allQuizIds, ...inlineQuizIds])];
    }

    return allQuizIds.every((qid) => completedQuizzes.has(qid));
  }

  /* ── markGuestCompleted, saveToServer, saveQuizToServer, reportProgress ── */
  const markGuestCompleted = (gi: number) => {
    if (isEmailUser) return;
    setGuestProgress((prev) => {
      if (prev.has(gi)) return prev;
      const n = new Set(prev);
      n.add(gi);
      try {
        if (courseId)
          localStorage.setItem(
            GUEST_PROGRESS_KEY(courseId),
            JSON.stringify([...n])
          );
      } catch {}
      return n;
    });
  };

  const saveToServer = (
    globalIndex: number,
    positionSeconds: number,
    completed = false
  ) => {
    if (!courseId) {
      if (completed) markGuestCompleted(globalIndex);
      return;
    }

    if (saveTimersRef.current[globalIndex])
      window.clearTimeout(saveTimersRef.current[globalIndex]!);

    saveTimersRef.current[globalIndex] = window.setTimeout(async () => {
      try {
        const fv = flatVideos[globalIndex];
        const merg = getMergedForKey(fv?.key ?? "");
        const dur =
          typeof merg?.duration === "number" && merg.duration > 0
            ? Math.floor(merg.duration)
            : 0;

        const alreadyCompleted =
          serverProgressRef.current.get(globalIndex)?.completed ||
          completedSetRef.current.has(globalIndex);

        const payload: any = {
          userKey: getUserKey(),
          courseId,
          positionSeconds: Math.floor(Math.max(0, positionSeconds)),
          duration: dur,
          completed: alreadyCompleted ? true : completed,
          videoId: fv?.videoId ?? `idx_${globalIndex}`,
        };

        const res = await fetch("/api/course_progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          setServerProgress((prev) => {
            const n = new Map(prev);
            const alreadyCompleted =
              prev.get(globalIndex)?.completed ||
              completedSetRef.current.has(globalIndex);

            n.set(globalIndex, {
              positionSeconds: Math.floor(Math.max(0, positionSeconds)),
              completed: alreadyCompleted ? true : completed,
            });
            return n;
          });
        }
      } catch {
      } finally {
        saveTimersRef.current[globalIndex] = null;
      }
    }, 1200);
  };

  const saveQuizToServer = (quizId: string) => {
    if (!courseId) return;
    fetch("/api/course_progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userKey: getUserKey(),
        courseId,
        videoId: `quiz_${quizId}`,
        positionSeconds: 0,
        duration: 0,
        completed: true,
      }),
    }).catch(() => {});
  };

  const reportProgress = onReportPlayerProgress ?? saveToServer;
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastAllowedTimeRef = useRef(0);

  const getResume = (gi: number) => {
    const e = serverProgressRef.current.get(gi);
    return e?.positionSeconds && e.positionSeconds > 1
      ? e.positionSeconds
      : undefined;
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.currentTime > lastAllowedTimeRef.current) {
        lastAllowedTimeRef.current = video.currentTime;
      }
    };

    const handleSeeking = () => {
      // allowSeek true = completed or has prior progress → no restriction
      if (!allowSeek) {
        if (video.currentTime > lastAllowedTimeRef.current + 1) {
          video.currentTime = lastAllowedTimeRef.current;
        }
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("seeking", handleSeeking);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("seeking", handleSeeking);
    };
  }, [allowSeek]);

  function formatLessonTitle(title?: string) {
  if (!title) return "Lesson";

  const lower = title.toLowerCase();

  // If already clean
  if (lower.includes("lesson")) {
    return title;
  }

  // Extract number from slug like chapter-01-lesson-1
  const match = title.match(/(\d+)/g);

  if (match && match.length > 0) {
    const lessonNumber = match[match.length - 1]; // last number
    return `Lesson ${parseInt(lessonNumber)}`;
  }

  return title;
}

  /* ── playGlobalIndex, computePendingNextVideo, handleVideoCompleted ── */
  const playGlobalIndex = (globalIndex: number, autoplay = false) => {
    const fv = flatVideos[globalIndex];
    if (!fv) return;

    const merg = getMergedForKey(fv.key);
    const url = merg?.url ?? fv.url;
    if (!url) return;

    const mod = course?.modules?.[fv.moduleIndex];

    const resumeSecs = getResume(globalIndex) ?? 0;
    const alreadyCompleted = completedSetRef.current.has(globalIndex);

    // ── FIX: if video is already completed, remove the seek fence entirely ──
    lastAllowedTimeRef.current = alreadyCompleted
      ? Number.MAX_SAFE_INTEGER
      : resumeSecs;

    (window as any).currentVideoIndex = globalIndex;
    (window as any).currentVideoResumeSeconds = resumeSecs;
    // expose max seekable seconds so external players can enforce the fence
    (window as any).currentVideoMaxSeekSeconds = alreadyCompleted
      ? Number.MAX_SAFE_INTEGER
      : resumeSecs;

    setActiveVideoKey(fv.key);
    activeVideoKeyRef.current = fv.key;

    // Allow seek if completed (full range) OR if the user has watched any
    // portion before (up to their last position).
    const canSeek = isSuperUnlockedUser || alreadyCompleted || resumeSecs > 0;
setAllowSeek(canSeek);

lastAllowedTimeRef.current = isSuperUnlockedUser
  ? Number.MAX_SAFE_INTEGER
  : alreadyCompleted
  ? Number.MAX_SAFE_INTEGER
  : resumeSecs;
   onPlayVideo(
  url,
  `${course?.modules?.[fv.moduleIndex]?.submodules?.[fv.subIndex]?.title}||${formatLessonTitle(fv.title)}`,
  mod?.moduleId ?? "",
  fv.videoIndex,
  {
    resumeSeconds: resumeSecs,
    autoplay,
    allowSeek: canSeek,
  }
);
  };

  const computePendingNextVideo = (
    afterGlobalIndex: number,
    liveCompleted: Set<number>
  ) => {
    let ni = -1;
    for (let i = afterGlobalIndex + 1; i < flatVideos.length; i++) {
      if (!liveCompleted.has(i)) {
        ni = i;
        break;
      }
    }
    pendingNextVideoRef.current = ni >= 0 ? ni : null;
  };

  const [pendingNextIndex, setPendingNextIndex] = useState<number | null>(
    null
  );

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

    const nextQuizzes = videoToNextQuizzes.get(globalIndex) ?? [];

    if (nextQuizzes.length > 0) {
      const allCompleted = nextQuizzes.every((q) =>
        completedQuizzesRef.current.has(q.id)
      );

      if (!allCompleted) {
        computePendingNextVideo(globalIndex, live);
        setPendingNextIndex(null);
        return;
      }
    }

    let nextIdx = -1;
    for (let i = globalIndex + 1; i < flatVideos.length; i++) {
      if (!live.has(i)) {
        nextIdx = i;
        break;
      }
    }

    if (nextIdx === -1) {
      setPendingNextIndex(null);
      return;
    }

    const nfv = flatVideos[nextIdx];
    const nmod = course?.modules?.[nfv.moduleIndex];
    const nmKey = nmod?.moduleId ?? `module-${nfv.moduleIndex}`;

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
        (unlockedModulesSet.has(String(nmod.moduleId)) ||
          allowedSet.has(String(nmod.moduleId)))) ||
        (!nmod?.moduleId && unlockedModulesSet.has(nmKey))
    );

    if (nextAllowed || prevModDone || isFreePreviewVideo(nextIdx)) {
      setOpenModuleId(nmKey);
      setOpenSubKey(`${nmKey}-sub-${nfv.subIndex}`);
      setPendingNextIndex(nextIdx);
    } else {
      setPendingNextIndex(null);
    }
  };

  useEffect(() => {
    const h = (e: Event) => {
      const ce = e as CustomEvent<{ globalIndex: number }>;
      if (typeof ce.detail?.globalIndex === "number")
        handleVideoCompleted(ce.detail.globalIndex);
    };

    window.addEventListener("lms_video_completed", h as EventListener);
    return () =>
      window.removeEventListener("lms_video_completed", h as EventListener);
  });

  useEffect(() => {
    const h = (e: Event) => {
      const ce = e as CustomEvent<{
        globalIndex: number;
        positionSeconds: number;
      }>;
      const { globalIndex, positionSeconds } = ce.detail ?? {};
      if (
        typeof globalIndex === "number" &&
        typeof positionSeconds === "number"
      )
        saveToServer(globalIndex, positionSeconds, false);
    };

    window.addEventListener("lms_save_progress", h as EventListener);
    return () =>
      window.removeEventListener("lms_save_progress", h as EventListener);
  }, [courseId]);

  useEffect(() => {
    const h = (e: Event) => {
      const ce = e as CustomEvent<{ quizId?: string }>;
      const qid = ce.detail?.quizId;
      if (!qid) return;

      setCompletedQuizzes((prev) => {
        const n = new Set(prev);
        n.add(qid);

        if (!isEmailUser) {
          try {
            localStorage.setItem(
              QUIZ_PROGRESS_KEY(courseId),
              JSON.stringify([...n])
            );
          } catch {}
        }

        completedQuizzesRef.current = n;
        return n;
      });

      if (isEmailUser) saveQuizToServer(qid);
    };

    window.addEventListener("lms_quiz_submitted", h as EventListener);
    return () =>
      window.removeEventListener("lms_quiz_submitted", h as EventListener);
  }, [courseId, isEmailUser]);

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
    return () =>
      window.removeEventListener("lms_quiz_advance", h as EventListener);
  }, [flatVideos]);

  useEffect(() => {
    const h = () => {
      const key = activeVideoKeyRef.current;
      if (!key) return;

      const gi = videoKeyToGlobalIndex.get(key);
      if (typeof gi !== "number") return;

      const e = serverProgressRef.current.get(gi);
      const merg = getMergedForKey(flatVideos[gi]?.key ?? "");
      const dur = merg?.duration ? Math.floor(merg.duration) : 0;
      const pos = dur > 0 ? dur : e?.positionSeconds ?? 0;
      const fv = flatVideos[gi];

      const alreadyCompleted =
        serverProgressRef.current.get(gi)?.completed ||
        completedSetRef.current.has(gi);

      const payload: any = {
        userKey: getUserKey(),
        courseId,
        positionSeconds: Math.floor(Math.max(0, pos)),
        duration: dur,
        completed: alreadyCompleted
          ? true
          : Boolean(dur > 0 && pos >= dur),
        videoId: fv?.videoId ?? `idx_${gi}`,
      };

      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon(
            "/api/course_progress",
            new Blob([JSON.stringify(payload)], {
              type: "application/json",
            })
          );
        }
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
    <div className="w-full space-y-6 relaitve z-10">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-white border-indigo-100 shadow-md ring-1 ring-indigo-50">
       <h2 className="text-2xl font-black leading-tight mb-2">
  {(() => {
    const words = course.name?.split(" ") || [];

    const firstPart = words.slice(0, 2).join(" ");
    const secondPart = words.slice(2).join(" ");

    return (
      <>
        <span className="text-[#00008b]">{firstPart}</span>{" "}
        <span className="text-slate-900">{secondPart}</span>
      </>
    );
  })()}
</h2>

        <p className="text-xs text-gray-500 mt-1">{course.description}</p>

        <div className="flex flex-col gap-4 mt-3">
          <div className="flex flex-row gap-4 items-center">
            <span className="text-[14px] font-medium text-gray-500 flex items-center gap-1">
              <BookOpen size={14} className="text-blue-400" />{" "}
              {course.modules.length} Modules
            </span>

            <span className="text-[14px] font-medium text-gray-500 flex items-center gap-1">
              <Video size={14} className="text-blue-400" /> Video Lessons
            </span>
          </div>

          {Array.isArray(allowedModules) && allowedModules.length > 1 ? (
            <button
              onClick={() => setMeetModalOpen(true)}
              type="button"
              className="w-fit mt-6 py-3.5 px-4 bg-linear-to-r from-green-600 to-emerald-800 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
            >
              Book A Meet with Mentors
            </button>
          ) : (
            <div className="ml-auto">
              <button
                className="px-3 py-2 bg-amber-500 text-white text-sm font-semibold rounded-md hover:bg-amber-600"
                onClick={() => {
                  const slug = course?.slug || "";
                  const name = course?.name || "";

                  if (!slug) {
                    console.error("Slug missing");
                    return;
                  }

                  router.push(
                    `/enroll?course=${slug}&type=expert&name=${encodeURIComponent(
                      name
                    )}`
                  );
                }}
              >
                Upgrade Your Access
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modules */}
      <div className="space-y-5">
        {course.modules.map((module, moduleIndex) => {
          const moduleKey = module.moduleId ?? `module-${moduleIndex}`;
          const gradient = gradients[moduleIndex % gradients.length];
          const moduleKeyStr = String(moduleKey);
          const isOpen = openModuleId === moduleKey;

          const hasAssignments = allowedSet.size > 0;

         const moduleUnlocked = isSuperUnlockedUser
  ? true
  : hasAssignments
  ? Boolean(
      module.moduleId && allowedSet.has(String(module.moduleId))
    )
  : isFreeLoggedIn
  ? !isFreePreviewExpired && hasFreePreviewInModule(moduleIndex)
  : Boolean(
      (module.moduleId &&
        (unlockedModulesSet.has(String(module.moduleId)) ||
          allowedSet.has(String(module.moduleId)))) ||
        (!module.moduleId && unlockedModulesSet.has(moduleKeyStr))
    );

          console.debug(
            `[MODULE_DEBUG] idx=${moduleIndex} id=${String(
              module.moduleId
            )} hasAssignments=${hasAssignments} moduleUnlocked=${moduleUnlocked} allowed=${allowedSet.has(
              String(module.moduleId)
            )} unlockedSet=${unlockedModulesSet.has(String(module.moduleId))}`
          );

          const showLockMessage =
            Boolean(module.moduleId) && !moduleUnlocked;

          return (
            <div
              key={moduleKey}
              className={`transition-all duration-300 rounded-2xl border ${
                isOpen
                  ? "bg-white border-indigo-100 shadow-md ring-1 ring-indigo-50"
                  : "bg-white border-slate-100 hover:border-slate-200"
              }`}
            >
              {/* module toggle */}
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
                className={`w-full flex items-center justify-between px-4 py-3 cursor-pointer transition-colors
                  ${isOpen ? "bg-gray-50" : "hover:bg-gray-50"}
                  ${!moduleUnlocked ? "cursor-not-allowed opacity-70" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <span
  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-lg
    bg-gradient-to-r ${gradient}
  `}
>
  {(moduleIndex + 1).toString().padStart(2, "0")}
</span>
                  <div>
                    <h3 className="text-sm md:text-[16px] font-bold text-slate-900">
                      {module.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-0.5">
                      {module.submodules?.length || 0} lessons
                    </p>

                    {showLockMessage && (
                      <p className="text-xs text-red-500 mt-1">
                        🔒 Locked — contact admin to unlock
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {moduleUnlocked ? (
                    isOpen ? (
                      <ChevronUp size={16} className="text-red-400" />
                    ) : (
                      <ChevronDown size={16} className="text-green-600 font-bold" />
                    )
                  ) : (
                    <div className="group/lock relative p-1">
                      <Lock size={18} className="text-gray-400" />
                      <div className="hidden group-hover/lock:block absolute -top-10 right-0 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        Upgrade to Access
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* submodules */}
              {isOpen && (
                <div className="border-t border-gray-100 divide-y divide-gray-50">
                  {module.submodules?.length ? (
                    module.submodules.map((sub, subIndex) => {
                      const moduleKeyPart =
                        module.moduleId ?? `module-${moduleIndex}`;
                      const subKey = `${moduleKey}-sub-${subIndex}`;
                      const subIsOpen = openSubKey === subKey;

                      const subUnlocked = isSuperUnlockedUser
  ? true
  : !moduleUnlocked
  ? false
  : isFreeLoggedIn
  ? !isFreePreviewExpired &&
    hasFreePreviewInSubmodule(moduleIndex, subIndex)
  : subIndex === 0
  ? true
  : isSubmoduleCompleted(moduleIndex, subIndex - 1);

                      // derive videos / quizzes, supporting `items[]`
                      const videos: VideoItem[] = Array.isArray(sub.videos)
                        ? sub.videos
                        : Array.isArray((sub as any).items)
                        ? (sub as any).items
                            .filter((it: any) => it?.type === "video")
                            .map((it: any) => ({
                              id: it.sessionId ?? it.videoId ?? it.id,
                              title: it.name ?? it.videoTitle,
                              url:
                                it.url ?? it.s3_url ?? it.secure_url ?? null,
                              thumb: it.thumb ?? undefined,
                              duration:
                                typeof it.duration === "number"
                                  ? it.duration
                                  : undefined,
                            }))
                        : [];

                      let quizzes: Quiz[] = (
                        quizzesBySubmodule[
                          String(sub.submoduleId ?? "")
                        ] ?? []
                      ).slice();

                      if (
                        (!quizzes || quizzes.length === 0) &&
                        Array.isArray((sub as any).items)
                      ) {
                        const qItems = (sub as any).items.filter(
                          (it: any) => it?.type === "quiz"
                        );
                        if (qItems.length) {
                          const mapped = qItems.map((q: any) => {
                            const rawOrder =
                              q.order ??
                              q.sortOrder ??
                              q.position ??
                              q.quiz_order ??
                              null;
                            const normOrder =
                              rawOrder == null
                                ? null
                                : (() => {
                                    const n = Number(rawOrder);
                                    return Number.isFinite(n)
                                      ? Math.floor(n)
                                      : null;
                                  })();

                            return {
                              id: String(
                                q.quizId ??
                                  q.id ??
                                  q.quizRefId ??
                                  Math.random()
                              ),
                              name:
                                q.name ?? q.quizTitle ?? q.title ?? "Quiz",
                              submodule_id: String(sub.submoduleId ?? ""),
                              course_slug: course?.slug ?? "",
                              time_minutes:
                                q.quiz?.time_minutes ?? q.time_minutes,
                              questions:
                                q.quiz?.questions ?? q.questions ?? [],
                              order: normOrder,
                            } as Quiz;
                          });

                          quizzes = mapped;
                        }
                      }

                      /* Build orderedItems */
                      const orderedItems: OrderedSubItem[] = Array.isArray(
                        (sub as any).items
                      )
                        ? (() => {
                            const arr: OrderedSubItem[] = [];
                            let lastVideoGi = -1;
                            let videoCounter = 0;

                            (sub.items as any[]).forEach((it: any) => {
                              if (it.type === "video") {
                                const vIndex = videoCounter;
                                const key = `${moduleKeyPart}-sub-${subIndex}-vid-${vIndex}`;
                                const gi =
                                  videoKeyToGlobalIndex.get(key) ?? -1;
                                lastVideoGi = gi;

                                arr.push({
                                  type: "video",
                                  vIndex,
                                  v: {
                                    id:
                                      it.videoId ?? it.sessionId ?? it.id,
                                    title: it.name ?? it.videoTitle,
                                    url:
                                      getMergedForKey(key)?.url ??
                                      it.url ??
                                      it.s3_url ??
                                      null,
                                    thumb:
                                      getMergedForKey(key)?.thumb ??
                                      it.thumb,
                                    duration:
                                      getMergedForKey(key)?.duration ??
                                      (typeof it.duration === "number"
                                        ? it.duration
                                        : undefined),
                                  },
                                  key,
                                  gi,
                                } as OrderedVideoItem);

                                videoCounter++;
                              } else if (it.type === "quiz") {
                                const qid = String(
                                  it.quizId ??
                                    it.id ??
                                    it.quizRefId ??
                                    Math.random()
                                );

                                const q: Quiz = {
                                  id: qid,
                                  name: it.name ?? it.quizTitle ?? "Quiz",
                                  submodule_id: String(
                                    sub.submoduleId ?? ""
                                  ),
                                  course_slug: course?.slug ?? "",
                                  time_minutes:
                                    it.quiz?.time_minutes ?? it.time_minutes,
                                  questions:
                                    it.quiz?.questions ?? it.questions ?? [],
                                  order: it.order ?? null,
                                };

                                arr.push({
                                  type: "quiz",
                                  q,
                                  prevVideoGi: lastVideoGi,
                                } as OrderedQuizItem);
                              } else if (it.type === "pdf") {
                                const pdfItem: PdfItem = {
                                  type: "pdf",
                                  pdfId: it.pdfId ?? it.id ?? "",
                                  name: it.name ?? "PDF",
                                  fileUrl: it.fileUrl ?? it.url ?? "",
                                };

                                arr.push({
                                  type: "pdf",
                                  p: pdfItem,
                                  key: `${moduleKeyPart}-sub-${subIndex}-pdf-${arr.length}`,
                                } as OrderedPdfItem);
                              } else {
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

                      return (
                        <div
                          key={subKey}
                          className={`p-3 transition-colors ${
                            subIsOpen ? "bg-blue-50/20" : "hover:bg-gray-50"
                          }`}
                        >
                          {/* SUBMODULE TOGGLE */}
                          <button
                            type="button"
                            disabled={!subUnlocked}
                            onClick={() => {
                              if (!subUnlocked) return;
                              setOpenSubKey(subIsOpen ? null : subKey);
                            }}
                            className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-colors ${
                              subIsOpen ? "bg-blue-50" : "hover:bg-slate-50"
                            } ${
                              !subUnlocked
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            <div className="space-y-1 text-left flex gap-4 items-center">
                              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                  <Tag size={14} strokeWidth={1.5} /></div>
                <div className="flex flex-col">
                              <h4
                                className={`text-sm font-bold ${
                                  subIsOpen
                                    ? "text-indigo-900"
                                    : "text-gray-700"
                                }`}
                              >
                                {sub.title}
                              </h4>
                              <p className="text-[10px] text-gray-400">
                                {sub.description}
                              </p>
                              {!subUnlocked && (
                                <p className="text-[10px] text-red-400 mt-0.5">
                                  {isFreeLoggedIn
                                    ? isFreePreviewExpired
                                    ? "Free preview expired after 7 days"
                                    : "Upgrade your access to unlock"
                                    : "Complete the previous chapter to unlock"}
                                </p>
                              )}
                              </div>
                            </div>
                            {subUnlocked ? (
                              <CheckCircle2
                                size={14}
                                className={
                                  subIsOpen
                                    ? "text-indigo-400"
                                    : "text-gray-200"
                                }
                              />
                            ) : (
                              <Lock size={14} className="text-gray-400" />
                            )}
                          </button>

                          {subIsOpen && (
                            <div className="mt-3 space-y-2">
                              {orderedItems.length > 0 ? (
                                orderedItems.map((item, itemIndex) => {
                                  /* VIDEO ITEM */
                                  if (item.type === "video") {
                                    const vidItem =
                                      item as OrderedVideoItem;
                                    const {
                                      v: vv,
                                      key: videoKey,
                                      gi: globalIndex,
                                    } = vidItem;
                                    const merged =
                                      getMergedForKey(videoKey);
                                    const urlToPlay =
                                      merged?.url ?? vv.url;
                                    const visible = Boolean(urlToPlay);
                                    const done =
                                      typeof globalIndex === "number" &&
                                      globalIndex >= 0
                                        ? completedSet.has(globalIndex)
                                        : false;

                                    const prevIdx = vidItem.vIndex - 1;
                                    const prevKey = `${moduleKeyPart}-sub-${subIndex}-vid-${prevIdx}`;
                                    const prevGiLocal =
                                      videoKeyToGlobalIndex.get(prevKey) ??
                                      -1;
                                    const prevGlobalDone =
                                      prevGiLocal >= 0
                                        ? completedSet.has(prevGiLocal)
                                        : true;

                                    const quizBetweenArr =
                                      prevGiLocal >= 0
                                        ? videoToNextQuizzes.get(
                                            prevGiLocal
                                          ) ?? []
                                        : [];
                                    const quizGatePassed =
                                      quizBetweenArr.length === 0 ||
                                      quizBetweenArr.every((q) =>
                                        completedQuizzes.has(q.id)
                                      );
                                    const isFirst =
                                      typeof globalIndex === "number" &&
                                      globalIndex === 0;

                                    const unlocked = isSuperUnlockedUser
  ? true
  : isFreeLoggedIn
  ? Boolean(
      subUnlocked &&
      typeof globalIndex === "number" &&
      isFreePreviewVideo(globalIndex)
    )
  : Boolean(
      subUnlocked &&
        (isFirst ||
          done ||
          (prevGlobalDone && quizGatePassed))
    );

                                    return (
                                      <div
                                        key={videoKey}
                                        className={`flex items-center gap-3 p-2 rounded-md transition ${
                                          activeVideoKey === videoKey
                                            ? ""
                                            : "hover:bg-gray-50"
                                        }`}
                                      >
                                        <div className="flex w-full items-center gap-2">
                                          {urlToPlay ? (
                                            <button
                                              type="button"
                                              disabled={
                                                !visible || !unlocked
                                              }
                                              onClick={() => {
                                                if (
                                                  !visible ||
                                                  !unlocked
                                                )
                                                  return;
                                                if (
                                                  typeof globalIndex ===
                                                    "number" &&
                                                  globalIndex >= 0
                                                ) {
                                                  playGlobalIndex(
                                                    globalIndex
                                                  );
                                                } else {
                                                  onPlayVideo(
                                                    urlToPlay,
                                                    vv.title,
                                                    module.moduleId ?? "",
                                                    vidItem.vIndex,
                                                    {
                                                      resumeSeconds:
                                                        undefined,
                                                      autoplay: true,
                                                    }
                                                  );
                                                  setActiveVideoKey(
                                                    videoKey
                                                  );
                                                }
                                              }}
                                              className={`w-full flex justify-between items-center gap-3 p-3 rounded-xl border transition-all bg-white
                                                ${
                                                  unlocked
                                                    ? "border-slate-100 hover:border-indigo-100 text-slate-600 hover:text-indigo-600 cursor-pointer"
                                                    : "border-slate-100 opacity-50 cursor-not-allowed"
                                                }`}
                                            >
                                              <div className="flex items-center gap-3">
                                                 
                                                <p className="text-xs font-semibold flex items-center gap-2">
                                                  {vv.title}
                                                  {done && (
                                                    <span className="inline-flex items-center ml-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 border border-emerald-100">
                                                      <CheckCircle2
                                                        size={12}
                                                        className="text-emerald-500"
                                                      />
                                                      
                                                    </span>
                                                  )}
                                                </p>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                {!unlocked ? (
                                                  <span className="text-[11px] px-2 py-1 rounded bg-gray-50 border text-gray-400 flex items-center gap-1">
                                                    <Lock size={12} />{" "}
                                                    Locked
                                                  </span>
                                                ) : (
                                                  <span className=" text-white text-[10px] font-bold rounded flex items-center gap-1">
  {done ? (
  <RotateCcw size={18} className="text-yellow-300" />
) : (
  <PlayIcon size={18} className="text-green-300" />
)}
   
</span>
                                                )}
                                              </div>
                                            </button>
                                          ) : (
                                            <span className="text-xs text-gray-300">
                                              No URL
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  }

                                  /* PDF ITEM */
                                  if (item.type === "pdf") {
                                    const pdfItem = item as OrderedPdfItem;
                                    const pdf = pdfItem.p;

                                    return (
                                      
                                     <Link
  href={pdf.fileUrl || "#"}
  target="_blank"
  rel="noreferrer"
  key={pdfItem.key || `${subKey}-pdf-${itemIndex}`}
  className="flex items-center justify-between gap-3 p-3 rounded-xl"
>
  <div className="w-full flex justify-between items-center gap-3 p-3 rounded-xl border transition-all bg-white  border-slate-100 hover:border-indigo-100 text-slate-600 hover:text-indigo-600 cursor-pointer">
  <div className="flex items-center gap-3">
    <div className="text-left">
      <p className="text-xs font-semibold">
        {pdf.name || "PDF"}
      </p>
    </div>
  </div>

  <span className="text-red-500 text-[14px] font-bold rounded">
    <ExternalLink size={18} />
  </span>
  </div>
</Link>
                                    );
                                  }

                                  /* QUIZ ITEM */
                                  const qItem = item as OrderedQuizItem;
                                  const { q, prevVideoGi } = qItem;
                                  const quizDone = completedQuizzes.has(
                                    q.id
                                  );

                                const quizUnlocked = isSuperUnlockedUser
  ? true
  : (() => {
      if (!subUnlocked) return false;
      if (prevVideoGi >= 0) return completedSet.has(prevVideoGi);
      const firstVideoOfSubKey = `${moduleKeyPart}-sub-${subIndex}-vid-0`;
      const firstVideoOfSubGi =
        videoKeyToGlobalIndex.get(firstVideoOfSubKey) ?? -1;
      if (firstVideoOfSubGi > 0) {
        return completedSet.has(firstVideoOfSubGi - 1);
      }
      return true;
    })();

                                  return (
                                    <div
                                      key={q.id}
                                      className={`flex items-center gap-3 p-3 rounded-xl  
                                         `}
                                    >
                                      <button
                                        disabled={!quizUnlocked}
                                        onClick={() => {
                                          if (
                                            !quizUnlocked ||
                                            !onOpenQuiz
                                          )
                                            return;
                                          if (prevVideoGi >= 0)
                                            computePendingNextVideo(
                                              prevVideoGi,
                                              completedSetRef.current
                                            );
                                          onOpenQuiz(q);
                                        }}
                                        className="w-full flex justify-between items-center gap-3 p-3 rounded-xl border transition-all bg-white border-slate-100 hover:border-indigo-100 text-slate-600 hover:text-indigo-600 cursor-pointer"
                                      >
                                        <div className="flex items-center gap-3">
                                          
                                      <div className="text-left flex items-center gap-3">
  {/* Always show quiz name */}
  <p className="text-xs font-semibold">
    {q.name}
  </p>

  {/* Status below */}
  {quizDone ? (
    <p className="text-[10px] text-emerald-600 flex items-center gap-1 mt-0.5">
      <CheckCircle2 size={10} />
    </p>
  ) : !quizUnlocked ? (
    <p className="text-[10px] text-gray-400 mt-0.5">
      Complete the previous chapter first
    </p>
  ) : null}
</div>
                                        </div>
                                        <span
                                          className={`px-3 py-1 text-[10px] font-bold rounded ${
                                            quizDone
                                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                              : quizUnlocked
                                              ? "bg-indigo-600 text-white"
                                              : "bg-gray-100 text-gray-400"
                                          }`}
                                        >
                                          {quizDone
                                            ? "RETAKE"
                                            : quizUnlocked
                                            ? "TAKE QUIZ"
                                            : "LOCKED"}
                                        </span>
                                      </button>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-sm text-gray-400 italic p-2">
                                  No content available.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center text-gray-400">
                      <Lock size={16} className="mx-auto mb-1 opacity-50" />
                      <p className="text-[10px] uppercase font-bold tracking-widest">
                        Contents Locked
                      </p>
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