"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Play,
  X,
  Trophy,
  Layers,
  User,
  CheckCircle2,
  BookOpen,
  Calculator,
  Landmark,
  ShieldCheck,
} from "lucide-react";

/* ================= TYPES ================= */
type VideoItem = { id?: string; title?: string; url?: string };
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
  activeQuiz: any | null;
  onCloseQuiz: () => void;
  onPlayVideo: (url: string | null, title?: string, moduleId?: string) => void;
  QuizPanel: React.ComponentType<any>;
};

type SavedProgress = {
  currentTime: number;
  maxWatched: number;
  updatedAt: number;
};

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

  const [videoKey, setVideoKey] = useState<string>(activeVideoUrl ?? "init");
  const videoCompleteFiredRef = useRef(false);
  const lastVideoUrlRef = useRef<string | null>(null);

  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [advanceCountdown, setAdvanceCountdown] = useState(0);
  const quizResultRef = useRef<QuizResult | null>(null);

  const maxWatchedTimeRef = useRef(0);
  const lastSavedTimeRef = useRef(0);
  const resumeTimeRef = useRef(0);

  // Tracks whether a seek is currently being corrected to avoid recursive loops
  const isCorrectingSeekRef = useRef(false);

  const progressStorageKey = activeVideoUrl
    ? `lms_progress_${student.id}_${activeModuleId ?? "no-module"}_${encodeURIComponent(
        activeVideoUrl
      )}`
    : null;

  useEffect(() => {
    quizResultRef.current = quizResult;
  }, [quizResult]);

  const readSavedProgress = (): SavedProgress | null => {
    if (!progressStorageKey) return null;
    try {
      const raw = localStorage.getItem(progressStorageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SavedProgress;
      if (
        typeof parsed?.currentTime === "number" &&
        typeof parsed?.maxWatched === "number"
      ) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  };

  const writeSavedProgress = (payload: SavedProgress) => {
    if (!progressStorageKey) return;
    try {
      localStorage.setItem(progressStorageKey, JSON.stringify(payload));
    } catch {
      // ignore storage errors
    }
  };

  const dispatchProgressSave = (video: HTMLVideoElement) => {
    const currentTime = Math.max(0, Math.floor(video.currentTime));
    const maxWatched = Math.max(0, Math.floor(maxWatchedTimeRef.current));
    const globalIndex = (window as any).currentVideoIndex ?? 0;

    const payload: SavedProgress = {
      currentTime,
      maxWatched,
      updatedAt: Date.now(),
    };

    writeSavedProgress(payload);

    window.dispatchEvent(
      new CustomEvent("lms_save_progress", {
        detail: {
          globalIndex,
          positionSeconds: currentTime,
          maxWatched,
          moduleId: activeModuleId,
          submoduleTitle: activeSubmoduleTitle,
          videoUrl: activeVideoUrl,
        },
      })
    );
  };

  useEffect(() => {
    if (!activeVideoUrl) return;
    if (lastVideoUrlRef.current === activeVideoUrl) return;

    lastVideoUrlRef.current = activeVideoUrl;
    videoCompleteFiredRef.current = false;
    setVideoKey(activeVideoUrl);

    const saved = readSavedProgress();
    const resumeFromWindow = Number(
      (window as any).currentVideoResumeSeconds ?? 0
    );

    const resumeAt =
      resumeFromWindow > 0
        ? resumeFromWindow
        : saved?.currentTime && saved.currentTime > 0
          ? saved.currentTime
          : 0;

    resumeTimeRef.current = resumeAt;
    maxWatchedTimeRef.current = Math.max(saved?.maxWatched ?? 0, resumeAt);
    lastSavedTimeRef.current = resumeAt;
  }, [activeVideoUrl, progressStorageKey]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const resumeAt = resumeTimeRef.current || 0;

    const seekToResume = () => {
      if (resumeAt > 1) {
        video.currentTime = resumeAt;
        (window as any).currentVideoResumeSeconds = 0;
      }
    };

    if (video.readyState >= 1) {
      seekToResume();
    } else {
      video.addEventListener("loadedmetadata", seekToResume, { once: true });
    }

    return () => {
      video.removeEventListener("loadedmetadata", seekToResume);
    };
  }, [videoKey]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let lastSavedAt = 0;

    const fireCompleted = () => {
      if (videoCompleteFiredRef.current) return;

      videoCompleteFiredRef.current = true;
      const globalIndex = (window as any).currentVideoIndex ?? 0;

      window.dispatchEvent(
        new CustomEvent("lms_video_completed", {
          detail: { globalIndex },
        })
      );

      window.dispatchEvent(
        new CustomEvent("lms_request_next_item", {
          detail: {
            type: "video",
            moduleId: activeModuleId,
            submoduleTitle: activeSubmoduleTitle,
          },
        })
      );
    };

    /**
     * Clamps video.currentTime to the maximum watched position.
     * Returns true if a correction was applied.
     */
    const clampToMaxWatched = (): boolean => {
      if (isCorrectingSeekRef.current) return false;
      const allowedMax = Math.max(0, maxWatchedTimeRef.current);
      if (video.currentTime > allowedMax + 0.25) {
        isCorrectingSeekRef.current = true;
        video.currentTime = allowedMax;
        // Release the guard after the browser has settled
        requestAnimationFrame(() => {
          isCorrectingSeekRef.current = false;
        });
        return true;
      }
      return false;
    };

    const handleTimeUpdate = () => {
      if (!video.duration || Number.isNaN(video.duration)) return;

      // Clamp any forward drift that wasn't caught by seeking/seeked events
      if (clampToMaxWatched()) return;

      if (video.currentTime > maxWatchedTimeRef.current) {
        maxWatchedTimeRef.current = video.currentTime;
      }

      if (video.currentTime / video.duration > 0.95) {
        fireCompleted();
      }

      const now = Date.now();
      if (now - lastSavedAt >= 10_000) {
        lastSavedAt = now;
        dispatchProgressSave(video);
        lastSavedTimeRef.current = video.currentTime;
      }
    };

    /**
     * `seeking` fires the instant the user initiates a seek, before the
     * browser has actually moved the playhead. We capture the intended
     * destination in video.currentTime and clamp it immediately.
     */
    const handleSeeking = () => {
      if (!video.duration || Number.isNaN(video.duration)) return;
      clampToMaxWatched();
    };

    /**
     * `seeked` fires once the browser has finished the seek. This is a
     * second safety net in case the browser ignored our correction during
     * the `seeking` event.
     */
    const handleSeeked = () => {
      if (!video.duration || Number.isNaN(video.duration)) return;
      clampToMaxWatched();
    };

    const handlePause = () => {
      dispatchProgressSave(video);
      lastSavedTimeRef.current = video.currentTime;
    };

    const handleEnded = () => {
      if (video.duration && !Number.isNaN(video.duration)) {
        maxWatchedTimeRef.current = Math.max(
          maxWatchedTimeRef.current,
          video.duration
        );
      }
      dispatchProgressSave(video);
      fireCompleted();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        dispatchProgressSave(video);
      }
    };

    const handleBeforeUnload = () => {
      dispatchProgressSave(video);
    };

    const handleRateChange = () => {
      if (video.playbackRate !== 1) {
        video.playbackRate = 1;
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("seeking", handleSeeking);
    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("ratechange", handleRateChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("seeking", handleSeeking);
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("ratechange", handleRateChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [videoKey, activeModuleId, activeSubmoduleTitle, activeVideoUrl]);

  // Block all keyboard shortcuts that can seek the video
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;

      const blockedKeys = [
        "ArrowRight",
        "ArrowLeft",
        "PageUp",
        "PageDown",
        "Home",
        "End",
      ];

      if (blockedKeys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, []);

  useEffect(() => {
    setQuizResult(null);
    setAdvanceCountdown(0);
  }, [activeQuiz?.id]);

  useEffect(() => {
    if (advanceCountdown <= 0) return;

    const t = setTimeout(() => {
      setAdvanceCountdown((prev) => {
        if (prev <= 1) {
          window.dispatchEvent(
            new CustomEvent("lms_quiz_advance", {
              detail: { quizId: quizResultRef.current?.quizId },
            })
          );
          onCloseQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearTimeout(t);
  }, [advanceCountdown, onCloseQuiz]);

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
      } else if (result?.answers && activeQuiz?.questions) {
        total = activeQuiz.questions.length;

        activeQuiz.questions.forEach((q: any) => {
          const uid = String(q.id ?? "");
          const user = String(result.answers[uid] ?? "");
          const ok = String(
            q.correctOption ?? q.correctAnswer ?? q.answer ?? ""
          );
          if (user && user === ok) score++;
        });
      }

      const passed = total > 0 ? score / total >= 0.6 : false;
      setQuizResult({ score, total, passed, quizId: activeQuiz?.id });
      setAdvanceCountdown(5);

      window.dispatchEvent(
        new CustomEvent("lms_quiz_submitted", {
          detail: {
            quizId: activeQuiz?.id,
            moduleId: activeModuleId,
            submoduleTitle: activeSubmoduleTitle,
            result: { score, total, passed },
          },
        })
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleContinueNow = () => {
    window.dispatchEvent(
      new CustomEvent("lms_quiz_advance", {
        detail: { quizId: quizResultRef.current?.quizId },
      })
    );
    setAdvanceCountdown(0);
    onCloseQuiz();
  };

  const activeModule = course?.modules?.find(
    (m) => m.moduleId === activeModuleId
  );

  return (
    <div className="bg-[#f0f4f8] p-4 font-sans text-slate-900">
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-blue-900/5">
          {activeQuiz ? (
            <div className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-amber-100 p-2">
                    <Trophy size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      Knowledge Check
                    </h3>
                    <p className="text-xs font-medium italic text-slate-500">
                      ACCA Standards Assessment
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setQuizResult(null);
                    setAdvanceCountdown(0);
                    onCloseQuiz();
                  }}
                  className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              {quizResult ? (
                <div className="animate-in fade-in zoom-in flex flex-col items-center gap-6 py-8 text-center duration-300">
                  <div className="flex w-full items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 shadow-lg shadow-blue-600/20">
                      <CheckCircle2 size={20} className="text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-blue-900">
                        Submission Successful
                      </p>
                      <p className="text-xs text-blue-700">
                        Results recorded for Professional Certification.
                      </p>
                    </div>
                  </div>

                  <div
                    className={`flex h-32 w-32 flex-col items-center justify-center rounded-full border-[6px] shadow-inner ${
                      quizResult.passed
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-blue-500 bg-blue-50"
                    }`}
                  >
                    <span
                      className={`text-3xl font-black ${
                        quizResult.passed
                          ? "text-emerald-700"
                          : "text-blue-700"
                      }`}
                    >
                      {quizResult.total > 0
                        ? Math.round(
                            (quizResult.score / quizResult.total) * 100
                          )
                        : 0}
                      %
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Score
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    {quizResult.passed ? (
                      <p className="text-xl font-black tracking-tight text-slate-900">
                        EXCELLENT PROGRESS! 🎉
                      </p>
                    ) : (
                      <p className="text-xl font-black tracking-tight text-slate-900">
                        REVIEW & CONTINUE
                      </p>
                    )}
                    <p className="text-sm font-medium text-slate-500">
                      Correct Answers:{" "}
                      <span className="font-bold text-blue-600">
                        {quizResult.score} out of {quizResult.total}
                      </span>
                    </p>
                  </div>

                  <div className="w-full max-w-sm space-y-3">
                    <div className="flex flex-col items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-white">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Auto-Advancing Lesson
                      </p>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full bg-blue-400 transition-all duration-1000"
                          style={{
                            width: `${(advanceCountdown / 5) * 100}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs font-bold">
                        Resuming in {advanceCountdown}s
                      </p>
                    </div>

                    <button
                      onClick={handleContinueNow}
                      className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-700 active:scale-[0.98]"
                    >
                      Start Next Lesson Now
                    </button>
                  </div>
                </div>
              ) : (
                <QuizPanel
                  quiz={activeQuiz}
                  onClose={() => {
                    setQuizResult(null);
                    setAdvanceCountdown(0);
                    onCloseQuiz();
                  }}
                  onSubmitted={handleQuizSubmit}
                  email={student.email}
                />
              )}
            </div>
          ) : activeVideoUrl ? (
            <div className="relative aspect-video bg-black group">
              {activeVideoUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                <video
                  key={videoKey}
                  ref={videoRef}
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                  controlsList="nodownload noplaybackrate noremoteplayback"
                  disablePictureInPicture
                  disableRemotePlayback
                  onContextMenu={(e) => e.preventDefault()}
                  className="h-full w-full"
                >
                  <source src={activeVideoUrl} />
                </video>
              ) : (
                <iframe
                  key={videoKey}
                  src={activeVideoUrl}
                  className="h-full w-full"
                  allowFullScreen
                  title="Course video"
                />
              )}
            </div>
          ) : (
            <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-slate-950">
              <div className="pointer-events-none absolute inset-0 opacity-20">
                <div className="absolute left-10 top-10">
                  <Calculator size={120} className="rotate-12 text-white" />
                </div>
                <div className="absolute bottom-10 right-10">
                  <Landmark size={140} className="-rotate-12 text-white" />
                </div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 via-transparent to-slate-950/90" />

              <div className="relative z-10 px-6 text-center">
                <div className="mb-6 inline-flex cursor-pointer rounded-full bg-blue-600 p-5 text-white shadow-2xl shadow-blue-600/50 transition-transform hover:scale-110">
                  <Play size={32} fill="currentColor" className="ml-1" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-black uppercase tracking-tight text-white">
                    Professional Accountant Learning
                  </h2>
                  <div className="flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck size={12} /> Certified Content
                    </span>
                    <span className="h-1 w-1 rounded-full bg-blue-400" />
                    <span className="flex items-center gap-1.5">
                      <BookOpen size={12} /> ACCA Compliant
                    </span>
                  </div>
                </div>

                <div className="mt-8 inline-block rounded-2xl border border-white/10 bg-white/5 px-6 py-3 backdrop-blur-md">
                  <p className="text-xs font-medium italic text-slate-300">
                    "Excellence in accounting through digital mastery"
                  </p>
                </div>
              </div>

              <div className="absolute left-6 top-6 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-black text-white">
                  A
                </div>
                <span className="text-xs font-bold tracking-widest text-white/50">
                  ACCA ACADEMY
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="hidden grid-cols-1 gap-4 md:grid md:grid-cols-2">
          <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                <Layers size={18} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-tight text-slate-800">
                Module Summary
              </h3>
            </div>
            <h4 className="mb-1 text-sm font-bold text-blue-600">
              {activeModule?.name ?? "General Studies"}
            </h4>
            <p className="text-xs font-medium leading-relaxed text-slate-500">
              {activeModule?.description ??
                "Select a learning module from the list to begin your professional certification journey."}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-white shadow-sm">
            <div className="mb-4 flex items-center gap-3 text-slate-400">
              <User size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Student Profile
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold">
                {student.name.charAt(0)}
              </div>
              <div>
                <p className="text-base font-bold tracking-tight">
                  {student.name}
                </p>
                <p className="text-xs font-medium text-slate-400">
                  {student.email}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Enrollment Status
              </span>
              <span className="rounded border border-blue-500/30 bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-400">
                Active Batch: {student.batch_id ?? "2026-X"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}