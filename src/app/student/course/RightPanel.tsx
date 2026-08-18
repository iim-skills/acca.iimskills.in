"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import {
  Play, X, Trophy, Activity, Layers, User, CheckCircle2, XCircle,
  BookOpen, Calculator, Landmark, ShieldCheck, ChevronRight, RotateCcw,
  Clock, Award, Bell, MonitorPlay, Info
} from "lucide-react";
import Image from "next/image";
import Modal from "@/components/Modal";

/* ================= TYPES ================= */

type VideoItem = {
  id?: string;
  title?: string;
  url?: string;
};

type Submodule = {
  submoduleId?: string;
  title?: string;
  description?: string;
  videos?: VideoItem[];
};

type Module = {
  moduleId?: string;
  slug?: string;
  name?: string;
  description?: string;
  submodules?: Submodule[];
};

type CourseFile = {
  courseId?: string;
  slug?: string;
  name?: string;
  description?: string;
  modules?: Module[];
};

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

type QuizResult = {
  score: number;
  total: number;
  passed: boolean;
  quizId?: string;
};

type Props = {
  course: CourseFile | null;
  student: StudentAPIResp;
  activeModuleId: string | null;
  activeVideoUrl: string | null;
  activeSubmoduleTitle: string | null;
  activeLiveSessions?: any[] | null;
  activeQuiz: any | null;
  onCloseQuiz: () => void;
  onPlayVideo: (
    url: string | null,
    title?: string,
    moduleId?: string
  ) => void;
  QuizPanel: React.ComponentType<any>;
  liveSessionsLocked?: boolean;
};

/* ================= PASTEL COLORS ================= */

const PASTEL_COLORS = [
  { bg: "#FFFBE6", border: "#FFE066", text: "#B38600" },
  { bg: "#FFF0F3", border: "#FFCCD5", text: "#C9184A" },
  { bg: "#FFF4E6", border: "#FFD8A8", text: "#E67700" },
  { bg: "#EEFBF3", border: "#B2EECE", text: "#1A7A4A" },
  { bg: "#EEF6FF", border: "#BFDBFE", text: "#1D4ED8" },
  { bg: "#F3EEFF", border: "#DDD6FE", text: "#6D28D9" },
  { bg: "#FFF0FB", border: "#F9C6EE", text: "#BE185D" },
  { bg: "#E6FAFA", border: "#A5F3FC", text: "#0E7490" },
];

function getPastelForIndex(i: number) {
  return PASTEL_COLORS[i % PASTEL_COLORS.length];
}

/** Extracts a YouTube video ID from any common YouTube URL shape. */
function extractYouTubeId(url: string | null): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host.includes("youtu.be")) {
      return parsed.pathname.slice(1) || null;
    }

    if (host.includes("youtube.com")) {
      const v = parsed.searchParams.get("v");

      if (v) return v;

      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.split("/").pop() || null;
      }

      if (parsed.pathname.startsWith("/shorts/")) {
        return parsed.pathname.split("/")[2] || null;
      }
    }
  } catch {
    // Invalid URL
  }

  return null;
}

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export default function App({
  course,
  student,
  activeModuleId,
  activeVideoUrl,
  activeSubmoduleTitle,
  activeLiveSessions,
  activeQuiz,
  onCloseQuiz,
  onPlayVideo,
  QuizPanel,
  liveSessionsLocked = false,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [videoKey, setVideoKey] = useState<string>(
    activeVideoUrl ?? "init"
  );

  const videoCompleteFiredRef = useRef(false);
  const lastVideoUrlRef = useRef<string | null>(null);

  // Shared tracker for the furthest point the student is legitimately
  // allowed to reach.
  const maxTimeReachedRef = useRef<number>(0);

  const isSeekingRef = useRef<boolean>(false);
  const lastSavedAtRef = useRef<number>(0);

  // Keep latest module/submodule context in refs.
  const activeModuleIdRef = useRef(activeModuleId);
  const activeSubmoduleTitleRef = useRef(activeSubmoduleTitle);

  useEffect(() => {
    activeModuleIdRef.current = activeModuleId;
  }, [activeModuleId]);

  useEffect(() => {
    activeSubmoduleTitleRef.current = activeSubmoduleTitle;
  }, [activeSubmoduleTitle]);

  const [quizResult, setQuizResult] =
    useState<QuizResult | null>(null);

  const [advanceCountdown, setAdvanceCountdown] = useState(0);

  const quizResultRef = useRef<QuizResult | null>(null);

  useEffect(() => {
    quizResultRef.current = quizResult;
  }, [quizResult]);

  /* ============================================================
     1. MONITOR ACTIVE VIDEO CHANGES
     ============================================================ */

  useEffect(() => {
    if (!activeVideoUrl) return;

    if (lastVideoUrlRef.current === activeVideoUrl) return;

    lastVideoUrlRef.current = activeVideoUrl;
    videoCompleteFiredRef.current = false;

    const resumeAt =
      (window as any).currentVideoResumeSeconds ?? 0;

    maxTimeReachedRef.current = resumeAt;

    setVideoKey(activeVideoUrl);
  }, [activeVideoUrl]);

  /* ============================================================
     2. INITIAL SEEK / RESUME
     ============================================================ */

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    const resumeAt: number =
      (window as any).currentVideoResumeSeconds ?? 0;

    const performInitialSeek = () => {
      if (resumeAt > 0) {
        maxTimeReachedRef.current = resumeAt;
        video.currentTime = resumeAt;
      }

      (window as any).currentVideoResumeSeconds = 0;
    };

    if (video.readyState >= 1) {
      performInitialSeek();
    } else {
      video.addEventListener(
        "loadedmetadata",
        performInitialSeek,
        { once: true }
      );
    }

    return () => {
      video.removeEventListener(
        "loadedmetadata",
        performInitialSeek
      );
    };
  }, [videoKey]);

  /* ============================================================
     SAVE VIDEO PROGRESS
     ============================================================ */

  const saveProgress = (
    globalIndex: number,
    positionSeconds: number,
    completed = false,
    durationSeconds = 0
  ) => {
    const videoId =
      (window as any).currentVideoId ?? null;

    const courseId =
      course?.courseId ?? null;

    const userKey =
      student?.email ?? null;

    if (!userKey || !courseId || !videoId) {
      if (!videoId) {
        console.warn(
          "saveProgress: window.currentVideoId is not set, skipping save"
        );
      }

      return;
    }

    const payload = {
      userKey,
      courseId,
      videoId,
      globalIndex,
      positionSeconds: Math.floor(positionSeconds),
      duration: Math.floor(durationSeconds),
      completed,
    };

    fetch("/api/course_progress", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }).catch((err) => {
      console.warn(
        "Failed to save progress:",
        err
      );
    });
  };

  /* ============================================================
     VIDEO COMPLETION
     ============================================================ */

  const fireCompleted = (
    currentTime: number,
    duration: number
  ) => {
    if (videoCompleteFiredRef.current) return;

    videoCompleteFiredRef.current = true;

    const globalIndex =
      (window as any).currentVideoIndex ?? 0;

    const durationSeconds = Number.isFinite(duration)
      ? Math.floor(Math.max(0, duration))
      : 0;

    const positionSeconds =
      durationSeconds > 0
        ? durationSeconds
        : Math.floor(Math.max(0, currentTime));

    saveProgress(
      globalIndex,
      positionSeconds,
      true,
      durationSeconds
    );

    window.dispatchEvent(
      new CustomEvent("lms_video_completed", {
        detail: {
          globalIndex,
          positionSeconds,
          durationSeconds,
        },
      })
    );

    window.dispatchEvent(
      new CustomEvent("lms_request_next_item", {
        detail: {
          type: "video",
          moduleId: activeModuleIdRef.current,
          submoduleTitle:
            activeSubmoduleTitleRef.current,
        },
      })
    );
  };

  /* ============================================================
     3. NATIVE VIDEO:
        BLOCK FORWARD SEEK
        SAVE PROGRESS
        COMPLETE VIDEO
     ============================================================ */

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    const handleSeeking = () => {
      isSeekingRef.current = true;
    };

    const handleSeeked = () => {
      if (
        video.currentTime >
        maxTimeReachedRef.current + 2
      ) {
        video.currentTime =
          maxTimeReachedRef.current;
      }

      isSeekingRef.current = false;
    };

    const handleTimeUpdate = () => {
      if (
        !video.duration ||
        isSeekingRef.current
      ) {
        return;
      }

      // Only update maxTimeReached during natural playback.
      if (
        video.currentTime >
        maxTimeReachedRef.current
      ) {
        maxTimeReachedRef.current =
          video.currentTime;
      }

      // Consider video completed at 95%.
      if (
        video.currentTime / video.duration >
        0.95
      ) {
        fireCompleted(
          video.currentTime,
          video.duration
        );

        return;
      }

      if (videoCompleteFiredRef.current) {
        return;
      }

      const now = Date.now();

      // Save progress every 10 seconds.
      if (
        now - lastSavedAtRef.current >
        10_000
      ) {
        lastSavedAtRef.current = now;

        const globalIndex =
          (window as any).currentVideoIndex ?? 0;

        saveProgress(
          globalIndex,
          Math.floor(video.currentTime),
          false,
          video.duration
        );
      }
    };

    const handleEnded = () => {
      fireCompleted(
        video.currentTime,
        video.duration
      );
    };

    video.addEventListener(
      "seeking",
      handleSeeking
    );

    video.addEventListener(
      "seeked",
      handleSeeked
    );

    video.addEventListener(
      "timeupdate",
      handleTimeUpdate
    );

    video.addEventListener(
      "ended",
      handleEnded
    );

    return () => {
      video.removeEventListener(
        "seeking",
        handleSeeking
      );

      video.removeEventListener(
        "seeked",
        handleSeeked
      );

      video.removeEventListener(
        "timeupdate",
        handleTimeUpdate
      );

      video.removeEventListener(
        "ended",
        handleEnded
      );
    };
  }, [videoKey]);

  /* ============================================================
     QUIZ LOGIC
     ============================================================ */

  useEffect(() => {
    setQuizResult(null);
    setAdvanceCountdown(0);
  }, [activeQuiz?.id]);

  useEffect(() => {
    if (
      advanceCountdown <= 0 ||
      !quizResult?.passed
    ) {
      return;
    }

    const t = setTimeout(() => {
      setAdvanceCountdown((prev) => {
        if (prev <= 1) {
          window.dispatchEvent(
            new CustomEvent(
              "lms_quiz_advance",
              {
                detail: {
                  quizId:
                    quizResultRef.current
                      ?.quizId,
                },
              }
            )
          );

          onCloseQuiz();

          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearTimeout(t);
  }, [
    advanceCountdown,
    onCloseQuiz,
    quizResult?.passed,
  ]);

  const handleQuizSubmit = (result?: any) => {
    try {
      let score = 0;
      let total = 0;

      if (
        typeof result?.score === "number" &&
        typeof result?.total === "number"
      ) {
        score = result.score;
        total = result.total;
      } else if (
        result?.answers &&
        activeQuiz?.questions
      ) {
        total =
          activeQuiz.questions.length;

        activeQuiz.questions.forEach(
          (q: any) => {
            const uid = String(
              q.id ?? ""
            );

            const user = String(
              result.answers[uid] ?? ""
            );

            const ok = String(
              q.correctOption ??
                q.correctAnswer ??
                q.answer ??
                ""
            );

            if (
              user &&
              user === ok
            ) {
              score++;
            }
          }
        );
      }

      const passed =
        typeof result?.passed ===
        "boolean"
          ? result.passed
          : typeof result?.result ===
            "string"
          ? String(
              result.result
            ).toUpperCase() === "PASS"
          : total > 0
          ? score / total >= 0.6
          : false;

      setQuizResult({
        score,
        total,
        passed,
        quizId:
          result?.quizId ??
          activeQuiz?.id,
      });

      setAdvanceCountdown(
        passed ? 5 : 0
      );

      window.dispatchEvent(
        new CustomEvent(
          "lms_quiz_submitted",
          {
            detail: {
              quizId:
                result?.quizId ??
                activeQuiz?.id,

              moduleId:
                activeModuleId,

              submoduleTitle:
                activeSubmoduleTitle,

              result: {
                score,
                total,
                passed,
              },
            },
          }
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleContinueNow = () => {
    if (
      !quizResultRef.current?.passed
    ) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent(
        "lms_quiz_advance",
        {
          detail: {
            quizId:
              quizResultRef.current
                ?.quizId,
          },
        }
      )
    );

    setAdvanceCountdown(0);
    onCloseQuiz();
  };

  /* ============================================================
     ACTIVE MODULE
     ============================================================ */

  const activeModule =
    course?.modules?.find(
      (m) =>
        m.moduleId ===
        activeModuleId
    );

  const [
    showLiveModal,
    setShowLiveModal,
  ] = useState(false);

  const [
    liveModalUrl,
    setLiveModalUrl,
  ] = useState<string | null>(
    null
  );

  const [
    liveModalTitle,
    setLiveModalTitle,
  ] = useState<string | null>(
    null
  );

  /* ============================================================
     DIRECT VIDEO / YOUTUBE DETECTION

     IMPORTANT:
     NO BLOB FETCHING HERE.
     ============================================================ */

  const isDirectFile = useMemo(
    () =>
      !!activeVideoUrl &&
      /\.(mp4|webm|ogg)$/i.test(
        activeVideoUrl
      ),
    [activeVideoUrl]
  );

  const youTubeId = useMemo(
    () =>
      isDirectFile
        ? null
        : extractYouTubeId(
            activeVideoUrl
          ),
    [
      activeVideoUrl,
      isDirectFile,
    ]
  );

  /* ============================================================
     YOUTUBE PLAYER
     ============================================================ */

  const youtubeContainerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const youtubePlayerRef =
    useRef<any>(null);

  useEffect(() => {
    if (!youTubeId) return;

    let player: any = null;

    let pollInterval:
      ReturnType<typeof setInterval> |
      null = null;

    let apiCheckInterval:
      ReturnType<typeof setInterval> |
      null = null;

    let destroyed = false;

    const resumeAt =
      (window as any)
        .currentVideoResumeSeconds ??
      0;

    maxTimeReachedRef.current =
      resumeAt;

    const startPolling = (
      p: any
    ) => {
      pollInterval =
        setInterval(() => {
          if (
            !p ||
            typeof p.getCurrentTime !==
              "function"
          ) {
            return;
          }

          let current = 0;
          let duration = 0;

          try {
            current =
              p.getCurrentTime();

            duration =
              p.getDuration();
          } catch {
            return;
          }

          if (!duration) return;

          // Block forward seeking.
          if (
            current >
            maxTimeReachedRef.current +
              2
          ) {
            p.seekTo(
              maxTimeReachedRef.current,
              true
            );
          } else if (
            current >
            maxTimeReachedRef.current
          ) {
            maxTimeReachedRef.current =
              current;
          }

          if (
            current / duration >
            0.95
          ) {
            fireCompleted(
              current,
              duration
            );

            return;
          }

          if (
            videoCompleteFiredRef.current
          ) {
            return;
          }

          const now = Date.now();

          if (
            now -
              lastSavedAtRef.current >
            10_000
          ) {
            lastSavedAtRef.current =
              now;

            const gi =
              (window as any)
                .currentVideoIndex ??
              0;

            saveProgress(
              gi,
              Math.floor(current),
              false,
              duration
            );
          }
        }, 1000);
    };

    const createPlayer = () => {
      if (
        destroyed ||
        !youtubeContainerRef.current ||
        !window.YT
      ) {
        return;
      }

      player = new window.YT.Player(
        youtubeContainerRef.current,
        {
          videoId: youTubeId,

          playerVars: {
            rel: 0,
            modestbranding: 1,
            iv_load_policy: 3,
            autoplay: 1,
            controls: 1,
            disablekb: 1,
          },

          events: {
            onReady: (e: any) => {
              if (resumeAt > 0) {
                e.target.seekTo(
                  resumeAt,
                  true
                );
              }

              (
                window as any
              ).currentVideoResumeSeconds = 0;

              youtubePlayerRef.current =
                e.target;

              startPolling(
                e.target
              );
            },

            onStateChange: (
              e: any
            ) => {
              if (
                e.data ===
                window.YT
                  .PlayerState
                  .ENDED
              ) {
                const duration =
                  e.target.getDuration();

                fireCompleted(
                  duration,
                  duration
                );
              }
            },
          },
        }
      );
    };

    if (
      window.YT &&
      window.YT.Player
    ) {
      createPlayer();
    } else {
      if (
        !document.getElementById(
          "youtube-iframe-api"
        )
      ) {
        const tag =
          document.createElement(
            "script"
          );

        tag.id =
          "youtube-iframe-api";

        tag.src =
          "https://www.youtube.com/iframe_api";

        document.head.appendChild(
          tag
        );
      }

      const prevCallback =
        window.onYouTubeIframeAPIReady;

      window.onYouTubeIframeAPIReady =
        () => {
          if (
            typeof prevCallback ===
            "function"
          ) {
            prevCallback();
          }

          createPlayer();
        };

      apiCheckInterval =
        setInterval(() => {
          if (
            window.YT &&
            window.YT.Player &&
            !player
          ) {
            if (
              apiCheckInterval
            ) {
              clearInterval(
                apiCheckInterval
              );
            }

            createPlayer();
          }
        }, 300);
    }

    return () => {
      destroyed = true;

      if (pollInterval) {
        clearInterval(
          pollInterval
        );
      }

      if (
        apiCheckInterval
      ) {
        clearInterval(
          apiCheckInterval
        );
      }

      if (
        player &&
        typeof player.destroy ===
          "function"
      ) {
        try {
          player.destroy();
        } catch {
          // no-op
        }
      }

      youtubePlayerRef.current =
        null;
    };
  }, [youTubeId, videoKey]);

  /* ============================================================
     LIVE SESSIONS
     ============================================================ */

  const sessionsWithUrl =
    useMemo(() => {
      try {
        return (
          activeLiveSessions ??
          []
        ).filter(
          (s: any) =>
            typeof s?.url ===
              "string" &&
            s.url.trim() !== ""
        );
      } catch {
        return [];
      }
    }, [activeLiveSessions]);

  /* ============================================================
     EMBEDDED VIDEO URL
     ============================================================ */

  const getEmbeddedVideoUrl = (
    url: string
  ) => {
    try {
      const parsed =
        new URL(url);

      const host =
        parsed.hostname.toLowerCase();

      if (
        host.includes(
          "youtube.com"
        ) ||
        host.includes(
          "youtu.be"
        )
      ) {
        let videoId = "";

        if (
          host.includes(
            "youtu.be"
          )
        ) {
          videoId =
            parsed.pathname.slice(
              1
            );
        } else {
          videoId =
            parsed.searchParams.get(
              "v"
            ) || "";

          if (
            !videoId &&
            parsed.pathname.startsWith(
              "/embed/"
            )
          ) {
            videoId =
              parsed.pathname
                .split("/")
                .pop() || "";
          }
        }

        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&autoplay=1&controls=1`;
        }
      }
    } catch {
      // Ignore invalid URL.
    }

    return url;
  };

  /* ============================================================
     NOTIFICATIONS
     ============================================================ */

  const [
    notifications,
    setNotifications,
  ] = useState<any[]>([]);

  useEffect(() => {
    const fetchNotifications =
      async () => {
        try {
          const res =
            await fetch(
              "/api/student/notifications"
            );

          const data =
            await res.json();

          setNotifications(
            data
          );
        } catch (err) {
          console.error(
            "Notification fetch error:",
            err
          );
        }
      };

    fetchNotifications();

    const interval =
      setInterval(
        fetchNotifications,
        30000
      );

    return () =>
      clearInterval(interval);
  }, []);

  /* ============================================================
     SECURITY / CONTEXT MENU
     ============================================================ */

  useEffect(() => {
    const handleContextmenu = (
      e: MouseEvent
    ) => {
      e.preventDefault();
    };

    const handleKeyDown = (
      e: KeyboardEvent
    ) => {
      // F12
      if (
        e.keyCode === 123
      ) {
        e.preventDefault();
      }

      // Ctrl + Shift + I
      if (
        e.ctrlKey &&
        e.shiftKey &&
        e.keyCode === 73
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener(
      "contextmenu",
      handleContextmenu
    );

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "contextmenu",
        handleContextmenu
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div
      className="bg-[#f8fafc] p-2.5 sm:p-4 md:p-6 lg:p-8 font-sans text-slate-900 selection:bg-blue-100"
      onContextMenu={(e) =>
        e.preventDefault()
      }
    >
      <div className="max-w-6xl mx-auto grid grid-cols-1 gap-4 sm:gap-5 md:gap-6 lg:gap-8">

        {/* ======================================================
            MAIN CONTENT
            ====================================================== */}

        <div className="min-w-0 space-y-4 sm:space-y-5 md:space-y-5 lg:space-y-6">

          {/* HEADER */}

          <div className="flex min-w-0 flex-col gap-1 px-0.5 sm:px-1">

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] sm:text-[10px] md:text-[11px] lg:text-[10px] font-bold text-blue-600 uppercase tracking-[0.14em] sm:tracking-widest mb-1">

              <Layers
                size={14}
                className="shrink-0"
              />

              <span className="min-w-0 truncate">
                {course?.name ||
                  "Professional Certification"}
              </span>

              <ChevronRight
                size={12}
                className="text-rose-600"
              />

              <span className="min-w-0 text-rose-600 break-words">
                {activeModule?.name ||
                  "Select a module"}
              </span>

            </div>

            <h1 className="text-lg sm:text-2xl md:text-2xl lg:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug sm:leading-tight break-words">
              {(() => {
                if (!activeVideoUrl) {
                  return `Welcome ${
                    student?.name ||
                    "Student"
                  }`;
                }

                if (
                  activeSubmoduleTitle?.includes(
                    "||"
                  )
                ) {
                  const [
                    chapter,
                    lesson,
                  ] =
                    activeSubmoduleTitle.split(
                      "||"
                    );

                  return `${chapter} - ${lesson}`;
                }

                return (
                  activeSubmoduleTitle ||
                  "Chapter"
                );
              })()}
            </h1>

          </div>

          {/* PLAYER / QUIZ CONTAINER */}

          <div className="relative group overflow-hidden bg-white shadow-2xl shadow-slate-200 border border-slate-200 flex flex-col">

            {activeQuiz ? (

              /* ==================================================
                 QUIZ
                 ================================================== */

              <div className="p-0 animate-in fade-in slide-in-from-bottom-4 duration-500">

                <div className="bg-slate-50 border-b border-slate-100 p-3.5 sm:p-6 flex items-start sm:items-center justify-between gap-3">

                  <div className="min-w-0 flex items-center gap-3 sm:gap-4">

                    <div className="w-9 h-9 sm:w-12 sm:h-12 shrink-0 bg-amber-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">

                      <Trophy
                        size={22}
                        className="text-white sm:hidden"
                      />

                      <Trophy
                        size={24}
                        className="text-white hidden sm:block"
                      />

                    </div>

                    <div>

                      <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-none">
                        Assessment
                      </h3>

                      <p className="text-[11px] sm:text-xs text-slate-500 mt-1 font-medium leading-snug">
                        Verify your understanding of recent concepts
                      </p>

                    </div>

                  </div>

                  <button
                    onClick={() => {
                      setQuizResult(
                        null
                      );

                      setAdvanceCountdown(
                        0
                      );

                      onCloseQuiz();
                    }}
                    className="shrink-0 p-2 sm:p-2.5 rounded-xl hover:bg-slate-200 transition-colors text-slate-500 active:scale-95"
                  >
                    <X size={20} />
                  </button>

                </div>

                <div className="p-3.5 sm:p-6 lg:p-8">

                  {quizResult ? (

                    <div className="py-2 sm:py-4 flex flex-col items-center gap-4 sm:gap-8 text-center animate-in zoom-in-95 duration-500">

                      <div className="relative">

                        <div
                          className={`w-24 h-24 sm:w-40 sm:h-40 rounded-full flex flex-col items-center justify-center border-[6px] sm:border-[8px] bg-white shadow-xl ${
                            quizResult.passed
                              ? "border-emerald-500 ring-4 ring-emerald-50"
                              : "border-blue-600 ring-4 ring-blue-50"
                          }`}
                        >

                          <span
                            className={`text-2xl sm:text-4xl font-black tracking-tighter ${
                              quizResult.passed
                                ? "text-emerald-600"
                                : "text-blue-600"
                            }`}
                          >
                            {quizResult.total >
                            0
                              ? Math.round(
                                  (quizResult.score /
                                    quizResult.total) *
                                    100
                                )
                              : 0}
                            %
                          </span>

                          <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                            Final Score
                          </span>

                        </div>

                        <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-1.5 sm:p-2 rounded-xl shadow-lg border border-slate-700">

                          {quizResult.passed ? (
                            <CheckCircle2
                              size={20}
                              className="text-emerald-400 sm:hidden"
                            />
                          ) : (
                            <Info
                              size={20}
                              className="text-blue-400 sm:hidden"
                            />
                          )}

                          {quizResult.passed ? (
                            <CheckCircle2
                              size={24}
                              className="text-emerald-400 hidden sm:block"
                            />
                          ) : (
                            <Info
                              size={24}
                              className="text-blue-400 hidden sm:block"
                            />
                          )}

                        </div>

                      </div>

                      <div className="space-y-2">

                        <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
                          {quizResult.passed
                            ? "Certification Ready! 🎉"
                            : "Knowledge Validated"}
                        </h2>

                        <p className="text-sm sm:text-base text-slate-500 font-medium max-w-xs mx-auto">
                          You correctly answered{" "}
                          <span className="text-slate-900 font-bold">
                            {quizResult.score}{" "}
                            out of{" "}
                            {quizResult.total}
                          </span>{" "}
                          questions.
                        </p>

                      </div>

                      <div className="w-full max-w-sm space-y-3 sm:space-y-4 pt-4 border-t border-slate-100">

                        {quizResult.passed ? (

                          <>
                            <div className="px-4 sm:px-6 py-3.5 sm:py-4 rounded-2xl bg-slate-950 text-white relative overflow-hidden group">

                              <div className="relative z-10">

                                <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black mb-3">
                                  Auto-Advancing Syllabus
                                </p>

                                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">

                                  <div
                                    className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
                                    style={{
                                      width: `${
                                        (advanceCountdown /
                                          5) *
                                        100
                                      }%`,
                                    }}
                                  />

                                </div>

                                <p className="text-xs sm:text-sm font-bold flex items-center justify-center gap-2">

                                  <Clock
                                    size={14}
                                    className="text-blue-400"
                                  />

                                  Next lesson in{" "}
                                  {
                                    advanceCountdown
                                  }{" "}
                                  seconds

                                </p>

                              </div>

                            </div>

                            <button
                              onClick={
                                handleContinueNow
                              }
                              className="w-full py-3.5 sm:py-4 bg-white border-2 border-slate-200 hover:border-blue-600 hover:text-blue-600 text-slate-700 text-xs sm:text-sm font-bold rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                              Resume Learning Now{" "}
                              <ChevronRight
                                size={18}
                              />
                            </button>
                          </>

                        ) : (

                          <>
                            <div className="px-5 sm:px-6 py-3.5 sm:py-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-900">

                              <p className="text-xs sm:text-sm font-bold">
                                Pass this quiz to unlock the next lesson.
                              </p>

                              <p className="text-[11px] sm:text-xs mt-1 text-rose-700">
                                Retake the quiz and score at least 60% to continue.
                              </p>

                            </div>

                            <button
                              onClick={() => {
                                setQuizResult(
                                  null
                                );

                                setAdvanceCountdown(
                                  0
                                );
                              }}
                              className="w-full py-3.5 sm:py-4 bg-white border-2 border-slate-200 hover:border-rose-500 hover:text-rose-600 text-slate-700 text-xs sm:text-sm font-bold rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                              Try Quiz Again{" "}
                              <RotateCcw
                                size={18}
                              />
                            </button>
                          </>

                        )}

                      </div>

                    </div>

                  ) : (

                    <QuizPanel
                      quiz={activeQuiz}
                      onClose={() => {
                        setQuizResult(
                          null
                        );

                        setAdvanceCountdown(
                          0
                        );

                        onCloseQuiz();
                      }}
                      onSubmitted={
                        handleQuizSubmit
                      }
                      email={
                        student.email
                      }
                    />

                  )}

                </div>

              </div>

            ) : activeVideoUrl ? (

              /* ==================================================
                 VIDEO
                 ================================================== */

              <div className="bg-slate-900 aspect-video w-full relative">

                {isDirectFile ? (

                  /*
                   * IMPORTANT:
                   * Direct MP4 playback.
                   *
                   * No fetch()
                   * No Blob
                   * No createObjectURL()
                   * No crossOrigin
                   */

                  <video
                    key={videoKey}
                    ref={videoRef}
                    controls
                    autoPlay
                    playsInline
                    preload="metadata"
                    className="absolute inset-0 w-full h-full object-contain"
                    controlsList="nodownload noplaybackrate"
                    onContextMenu={(e) =>
                      e.preventDefault()
                    }
                    disablePictureInPicture
                    src={
                      activeVideoUrl
                    }
                    onError={(e) => {
                      const el =
                        e.currentTarget;

                      console.error(
                        "Video element failed to load.",
                        "src:",
                        el.currentSrc,
                        "error code:",
                        el.error?.code,
                        "error message:",
                        el.error?.message
                      );
                    }}
                    onLoadedMetadata={() => {
                      console.log(
                        "Video metadata loaded:",
                        videoRef.current
                          ?.currentSrc
                      );
                    }}
                    onLoadedData={() => {
                      console.log(
                        "Video loaded and ready to play:",
                        videoRef.current
                          ?.currentSrc
                      );
                    }}
                  />

                ) : youTubeId ? (

                  /* ==================================================
                     YOUTUBE
                     ================================================== */

                  <div
                    key={videoKey}
                    ref={
                      youtubeContainerRef
                    }
                    className="absolute inset-0 w-full h-full"
                  />

                ) : (

                  /* ==================================================
                     OTHER EMBEDDED SOURCE
                     ================================================== */

                  <iframe
                    key={videoKey}
                    src={getEmbeddedVideoUrl(
                      activeVideoUrl
                    )}
                    className="absolute inset-0 w-full h-full"
                    allowFullScreen
                    title="Course video"
                  />

                )}

                <div className="absolute inset-0 pointer-events-none border-[10px] sm:border-[12px] border-white/5 opacity-40" />

              </div>

            ) : activeLiveSessions ? (

              /* ==================================================
                 LIVE SESSIONS
                 ================================================== */

              sessionsWithUrl &&
              sessionsWithUrl.length >
                0 ? (

                <div className="p-3.5 sm:p-6">

                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">
                    Live Recording Sessions
                  </h3>

                  <div className="space-y-2.5 sm:space-y-3">

                    {sessionsWithUrl.map(
                      (
                        s: any,
                        i: number
                      ) => {
                        const pastel =
                          getPastelForIndex(
                            i
                          );

                        return (
                          <a
                            key={
                              s.id ??
                              i
                            }
                            href={
                              s.url
                            }
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              backgroundColor:
                                pastel.bg,
                              borderColor:
                                pastel.border,
                              color:
                                pastel.text,
                            }}
                            className="flex min-w-0 items-center gap-3 px-3 sm:px-5 py-2.5 rounded-xl transition-all duration-200 hover:brightness-95 hover:shadow-md active:scale-[0.98] cursor-pointer group"
                          >

                            <span
                              style={{
                                backgroundColor:
                                  pastel.border,
                                color:
                                  pastel.text,
                              }}
                              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-black shrink-0"
                            >
                              {i + 1}
                            </span>

                            <span className="min-w-0 text-[13px] sm:text-sm font-bold leading-snug group-hover:underline underline-offset-2 truncate">
                              {s.title ||
                                `Session ${
                                  i + 1
                                }`}
                            </span>

                            <ChevronRight
                              size={16}
                              className="ml-auto shrink-0 opacity-60 group-hover:translate-x-0.5 transition-transform"
                            />

                          </a>
                        );
                      }
                    )}

                  </div>

                </div>

              ) : (

                <div className="aspect-video w-full flex items-center justify-center p-5 sm:p-8 text-center bg-slate-950">

                  <div className="inline-block bg-white/5 border border-slate-700 rounded-xl px-5 py-6 sm:px-6 sm:py-8">

                    <p className="text-base sm:text-lg font-bold text-slate-200">
                      No video available
                    </p>

                    <p className="text-xs sm:text-sm text-slate-400 mt-2">
                      There are no recorded sessions for this module.
                    </p>

                  </div>

                </div>

              )

            ) : (

              /* ==================================================
                 DEFAULT PREVIEW
                 ================================================== */

              <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">

                <Image
                  src="/acca-lms-image.jpg"
                  alt="Preview"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 90vw, 1152px"
                  className="object-cover"
                  priority
                />

              </div>

            )}

          </div>

        </div>

        {/* ======================================================
            SIDEBAR
            ====================================================== */}

        <div className="hidden md:block space-y-4 sm:space-y-5 md:space-y-5 lg:space-y-6">

          {/* NOTIFICATIONS */}

          <div className="space-y-2.5 sm:space-y-3">

            <div className="flex items-center justify-between px-2">

              <h5 className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-rose-400 flex items-center gap-2">

                <Bell size={12} />

                News & Alerts

              </h5>

              <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />

            </div>

            <div className="space-y-2.5 sm:space-y-3">

              {notifications.length >
              0 ? (

                notifications
                  .slice(0, 3)
                  .map(
                    (
                      n,
                      i
                    ) => (

                      <div
                        key={i}
                        className="bg-white hover:bg-blue-50/30 border border-slate-200 rounded-2xl p-3.5 sm:p-4 transition-all duration-300 group cursor-default animate-in slide-in-from-right-4 fade-in"
                        style={{
                          animationDelay: `${
                            i * 100
                          }ms`,
                        }}
                      >

                        <div className="flex gap-3">

                          <div className="mt-1 w-2 h-2 rounded-full bg-blue-600 shrink-0" />

                          <div className="space-y-1">

                            <p className="font-bold text-[13px] text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">
                              {
                                n.title
                              }
                            </p>

                            <p className="text-slate-500 text-[11px] font-medium leading-relaxed">
                              {
                                n.message
                              }
                            </p>

                          </div>

                        </div>

                      </div>

                    )
                  )

              ) : (

                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-4 sm:p-6 text-center">

                  <p className="text-[10px] sm:text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                    No new alerts
                  </p>

                </div>

              )}

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}