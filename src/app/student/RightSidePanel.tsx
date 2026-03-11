"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import {
  Play, X, Trophy, Activity, Layers, User, CheckCircle2, XCircle,
} from "lucide-react";

/* ================= TYPES ================= */
type VideoItem   = { id?: string; title?: string; url?: string };
type Submodule   = { submoduleId?: string; title?: string; description?: string; videos?: VideoItem[] };
type Module      = { moduleId?: string; slug?: string; name?: string; description?: string; submodules?: Submodule[] };
type CourseFile  = { courseId?: string; slug?: string; name?: string; description?: string; modules?: Module[] };

type StudentAPIResp = {
  id: number; name: string; email: string; phone?: string;
  modules?: string[] | string; progress?: Record<string, number[]>;
  courseTitle?: string; batch_id?: string | number;
};

type QuizResult = { score: number; total: number; passed: boolean; quizId?: string };

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

export default function App({
  course, student,
  activeModuleId, activeVideoUrl, activeSubmoduleTitle,
  activeQuiz, onCloseQuiz, onPlayVideo, QuizPanel,
}: Props) {

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [videoKey, setVideoKey] = useState<string>(activeVideoUrl ?? "init");

  const videoCompleteFiredRef = useRef(false);
  const lastVideoUrlRef       = useRef<string | null>(null);

  const [quizResult,       setQuizResult]      = useState<QuizResult | null>(null);
  const [advanceCountdown, setAdvanceCountdown] = useState(0);
  const quizResultRef = useRef<QuizResult | null>(null);
  useEffect(() => { quizResultRef.current = quizResult; }, [quizResult]);

  /* ── Remount video element when URL changes ── */
  useEffect(() => {
    if (!activeVideoUrl) return;
    if (lastVideoUrlRef.current === activeVideoUrl) return;
    lastVideoUrlRef.current       = activeVideoUrl;
    videoCompleteFiredRef.current = false;
    setVideoKey(activeVideoUrl);
  }, [activeVideoUrl]);

  /* ─────────────────────────────────────────────────────────────────
     VIDEO RESUME
     After remount, seek to window.currentVideoResumeSeconds
     (set by CourseModules.playGlobalIndex before calling onPlayVideo).
  ───────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const resumeAt: number = (window as any).currentVideoResumeSeconds ?? 0;
    if (resumeAt <= 1) return;

    const seekTo = () => {
      video.currentTime = resumeAt;
      (window as any).currentVideoResumeSeconds = 0;
    };

    if (video.readyState >= 1) seekTo();
    else video.addEventListener("loadedmetadata", seekTo, { once: true });

    return () => { video.removeEventListener("loadedmetadata", seekTo); };
  }, [videoKey]);

  /* ─────────────────────────────────────────────────────────────────
     VIDEO PROGRESS LISTENERS
     • 95% watched   → fire lms_video_completed
     • Every 10 s    → fire lms_save_progress (mid-video resume save)
  ───────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let lastSavedAt = 0;

    const fireCompleted = () => {
      if (videoCompleteFiredRef.current) return;
      videoCompleteFiredRef.current = true;
      const globalIndex = (window as any).currentVideoIndex ?? 0;
      window.dispatchEvent(new CustomEvent("lms_video_completed", { detail: { globalIndex } }));
      window.dispatchEvent(new CustomEvent("lms_request_next_item", {
        detail: { type: "video", moduleId: activeModuleId, submoduleTitle: activeSubmoduleTitle },
      }));
    };

    const handleEnded      = () => fireCompleted();
    const handleTimeUpdate = () => {
      if (!video.duration) return;
      if (video.currentTime / video.duration > 0.95) { fireCompleted(); return; }
      const now = Date.now();
      if (now - lastSavedAt > 10_000) {
        lastSavedAt = now;
        const gi = (window as any).currentVideoIndex ?? 0;
        window.dispatchEvent(new CustomEvent("lms_save_progress", {
          detail: { globalIndex: gi, positionSeconds: Math.floor(video.currentTime) },
        }));
      }
    };

    video.addEventListener("ended",      handleEnded);
    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      video.removeEventListener("ended",      handleEnded);
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoKey, activeModuleId, activeSubmoduleTitle]);

  /* ── Reset quiz result when a different quiz is opened ── */
  useEffect(() => {
    setQuizResult(null);
    setAdvanceCountdown(0);
  }, [activeQuiz?.id]);

  /* ── Countdown after quiz submit → plays next video ── */
  useEffect(() => {
    if (advanceCountdown <= 0) return;
    const t = setTimeout(() => {
      setAdvanceCountdown(prev => {
        if (prev <= 1) {
          window.dispatchEvent(new CustomEvent("lms_quiz_advance", {
            detail: { quizId: quizResultRef.current?.quizId },
          }));
          onCloseQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [advanceCountdown, onCloseQuiz]);

  /* ─────────────────────────────────────────────────────────────────
     QUIZ SUBMIT HANDLER
     Called by QuizPanel via the onSubmitted prop.

     Steps:
       1. Compute score from the result object QuizPanel sends.
       2. Show the green "Thank you" result card.
       3. Start 5-second countdown → next video plays automatically.
       4. Dispatch lms_quiz_submitted → CourseModules marks quiz done
          and saves to DB (email users) or localStorage (guests).
  ───────────────────────────────────────────────────────────────── */
  const handleQuizSubmit = (result?: any) => {
    try {
      let score = 0, total = 0;

      if (typeof result?.score === "number" && typeof result?.total === "number") {
        // QuizPanel already computed score + total
        score = result.score;
        total = result.total;
      } else if (result?.answers && activeQuiz?.questions) {
        total = activeQuiz.questions.length;
        activeQuiz.questions.forEach((q: any) => {
          const uid  = String(q.id ?? "");
          const user = String(result.answers[uid] ?? "");
          const ok   = String(q.correctOption ?? q.correctAnswer ?? q.answer ?? "");
          if (user && user === ok) score++;
        });
      } else if (Array.isArray(result?.questions)) {
        total = result.questions.length;
        score = result.questions.filter(
          (q: any) => q.correct || q.userAnswer === q.correctAnswer
        ).length;
      }

      const passed = total > 0 ? score / total >= 0.6 : false;

      setQuizResult({ score, total, passed, quizId: activeQuiz?.id });
      setAdvanceCountdown(5);

      window.dispatchEvent(new CustomEvent("lms_quiz_submitted", {
        detail: {
          quizId: activeQuiz?.id, moduleId: activeModuleId,
          submoduleTitle: activeSubmoduleTitle,
          result: { score, total, passed },
        },
      }));
      window.dispatchEvent(new CustomEvent("lms_request_next_item", {
        detail: { type: "quiz", moduleId: activeModuleId, submoduleTitle: activeSubmoduleTitle, result },
      }));
    } catch (err) {
      console.error("[RightSidePanel] handleQuizSubmit error:", err);
    }
  };

  /* "Continue Now" — fires lms_quiz_advance immediately */
  const handleContinueNow = () => {
    window.dispatchEvent(new CustomEvent("lms_quiz_advance", {
      detail: { quizId: quizResultRef.current?.quizId },
    }));
    setAdvanceCountdown(0);
    onCloseQuiz();
  };

  /* ── course progress % ── */
  const progressPercent = useMemo(() => {
    const mods = course?.modules ?? [];
    if (!mods.length) return 0;
    const pcts = mods.map(m => {
      const total = m.submodules?.reduce((a, s) => a + (s.videos?.length ?? 0), 0) ?? 0;
      const done  = student.progress?.[String(m.moduleId)]?.length ?? 0;
      return total ? Math.min(100, Math.round((done / total) * 100)) : 0;
    });
    return Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
  }, [course, student.progress]);

  const activeModule = course?.modules?.find(m => m.moduleId === activeModuleId);

  /* ════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════ */
  return (
    <div className="bg-[#f8fafc] min-h-screen p-4 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto space-y-4">

        {/* progress header */}
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-bold">Learning Dashboard</h2>
              <p className="text-xs text-slate-500">Continue your learning journey</p>
            </div>
            <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-lg">
              <Activity size={14} className="text-indigo-600" />
              <span className="text-xs font-bold text-indigo-700">{progressPercent}% Done</span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* video / quiz area */}
        <div className="rounded-xl overflow-hidden border">

          {activeQuiz ? (
            <div className="bg-white p-4">
              <div className="flex justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Trophy size={16} className="text-amber-500" />
                  <h3 className="text-sm font-bold">Assessment</h3>
                </div>
                <button
                  onClick={() => { setQuizResult(null); setAdvanceCountdown(0); onCloseQuiz(); }}
                  className="p-1 text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              {quizResult ? (
                /* ── RESULT CARD ── shown after Submit, next video plays after countdown */
                <div className="py-4 flex flex-col items-center gap-4 text-center">

                  {/* ★ Green "Thank you" banner */}
                  <div className="w-full px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 size={16} className="text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-emerald-800">Thank you! Your quiz has been submitted.</p>
                      <p className="text-xs text-emerald-600 mt-0.5">Your response has been recorded.</p>
                    </div>
                  </div>

                  {/* score ring */}
                  <div className={`w-24 h-24 rounded-full flex flex-col items-center justify-center border-4 ${
                    quizResult.passed ? "border-emerald-400 bg-emerald-50" : "border-amber-400 bg-amber-50"}`}>
                    <span className={`text-2xl font-black ${quizResult.passed ? "text-emerald-600" : "text-amber-600"}`}>
                      {quizResult.total > 0 ? Math.round((quizResult.score / quizResult.total) * 100) : 0}%
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">Score</span>
                  </div>

                  {/* pass / fail */}
                  <div className="flex flex-col items-center gap-1">
                    {quizResult.passed
                      ? <><CheckCircle2 size={20} className="text-emerald-500" /><p className="font-bold text-slate-800 text-base">Great work! 🎉</p></>
                      : <><XCircle     size={20} className="text-amber-500"   /><p className="font-bold text-slate-800 text-base">Keep going!</p></>
                    }
                    <p className="text-sm text-slate-500">
                      You scored <span className="font-bold text-slate-700">{quizResult.score} / {quizResult.total}</span> correctly.
                    </p>
                  </div>

                  {/* countdown bar */}
                  <div className="mt-1 px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-100 flex flex-col items-center gap-1 w-full max-w-xs">
                    <p className="text-xs text-indigo-700 font-semibold">
                      Next lesson starts in <span className="text-indigo-900 font-black">{advanceCountdown}s</span>
                    </p>
                    <div className="w-full h-1 bg-indigo-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 transition-all duration-1000"
                        style={{ width: `${(advanceCountdown / 5) * 100}%` }} />
                    </div>
                  </div>

                  <button onClick={handleContinueNow}
                    className="mt-1 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all">
                    Continue Now →
                  </button>
                </div>
              ) : (
                /*
                 * ── QUIZ QUESTIONS ──
                 * ★ FIX: prop is "onSubmitted" (QuizPanel's actual prop name),
                 *         NOT "onSubmit". This was the reason the submit button
                 *         never triggered the thank-you card.
                 */
                <QuizPanel
                  quiz={activeQuiz}
                  onClose={() => { setQuizResult(null); setAdvanceCountdown(0); onCloseQuiz(); }}
                  onSubmitted={handleQuizSubmit}
                  email={student.email}              /* <<<< ADDED: pass student email so API can save results */
                />
              )}
            </div>

          ) : activeVideoUrl ? (
            <div className="bg-black aspect-video">
              {activeVideoUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                <video key={videoKey} ref={videoRef} controls autoPlay className="w-full h-full">
                  <source src={activeVideoUrl} />
                </video>
              ) : (
                <iframe key={videoKey} src={activeVideoUrl} className="w-full h-full"
                  allowFullScreen title="Course video" />
              )}
            </div>
          ) : (
            <div className="text-center p-10 bg-black text-white">
              <Play size={24} className="mx-auto mb-4" />
              <h3 className="font-bold">Ready to learn?</h3>
              <p className="text-sm text-gray-400">Select a lesson to start</p>
            </div>
          )}
        </div>

        {/* module + student info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-5 border">
            <div className="flex items-center gap-2 mb-3">
              <Layers size={14} className="text-indigo-600" />
              <h3 className="font-bold text-sm">{activeModule?.name ?? "Module Summary"}</h3>
            </div>
            <p className="text-xs text-slate-500">{activeModule?.description ?? "Select a module to see details"}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border">
            <div className="flex items-center gap-2 mb-3 text-slate-400">
              <User size={14} />
              <span className="text-xs font-bold">Student Info</span>
            </div>
            <p className="text-sm font-bold">{student.name}</p>
            <p className="text-xs text-gray-500">{student.email}</p>
            <p className="text-xs mt-2">Batch: #{student.batch_id ?? "N/A"}</p>
          </div>
        </div>

      </div>
    </div>
  );
}