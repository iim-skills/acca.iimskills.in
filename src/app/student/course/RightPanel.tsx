"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import {
  Play, X, Trophy, Activity, Layers, User, CheckCircle2, XCircle, 
  BookOpen, Calculator, Landmark, ShieldCheck
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

  // Tracking the "Farthest point" reached.
  const maxTimeReachedRef = useRef<number>(0);
  const isSeekingRef = useRef<boolean>(false);

  const [quizResult,        setQuizResult]      = useState<QuizResult | null>(null);
  const [advanceCountdown, setAdvanceCountdown] = useState(0);
  const quizResultRef = useRef<QuizResult | null>(null);
  
  useEffect(() => { quizResultRef.current = quizResult; }, [quizResult]);

  // 1. Monitor active video changes and reset tracking
  useEffect(() => {
    if (!activeVideoUrl) return;
    if (lastVideoUrlRef.current === activeVideoUrl) return;
    
    lastVideoUrlRef.current       = activeVideoUrl;
    videoCompleteFiredRef.current = false;
    
    // Crucial: Set maxTimeReached to current resume point immediately
    const resumeAt = (window as any).currentVideoResumeSeconds ?? 0;
    maxTimeReachedRef.current = resumeAt;
    
    setVideoKey(activeVideoUrl);
  }, [activeVideoUrl]);

  // 2. Handle the initial Seek on Refresh/Load
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    // Get the position from your JSON progress (e.g., 27 or 84)
    const resumeAt: number = (window as any).currentVideoResumeSeconds ?? 0;
    
    const performInitialSeek = () => {
      if (resumeAt > 0) {
        // We set this BEFORE seeking so handleTimeUpdate doesn't fight it
        maxTimeReachedRef.current = resumeAt; 
        video.currentTime = resumeAt;
      }
      (window as any).currentVideoResumeSeconds = 0;
    };
    
    if (video.readyState >= 1) performInitialSeek();
    else video.addEventListener("loadedmetadata", performInitialSeek, { once: true });
    
    return () => { video.removeEventListener("loadedmetadata", performInitialSeek); };
  }, [videoKey]);

  // 3. Core Logic: Prevent skipping, allow back, save progress
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

    const handleSeeking = () => { isSeekingRef.current = true; };

    const handleSeeked = () => {
      // If user jumped forward past their farthest point (+ buffer for browser quirks)
      if (video.currentTime > maxTimeReachedRef.current + 1.5) {
        video.currentTime = maxTimeReachedRef.current;
      }
      isSeekingRef.current = false;
    };

    const handleTimeUpdate = () => {
      if (!video.duration || isSeekingRef.current) return;

      // Anti-Skip: If the clock jumps ahead without 'seeking' event (rare but possible)
      if (video.currentTime > maxTimeReachedRef.current + 2) {
        video.currentTime = maxTimeReachedRef.current;
      } else {
        // Update the high water mark only if moving forward
        if (video.currentTime > maxTimeReachedRef.current) {
            maxTimeReachedRef.current = video.currentTime;
        }
      }

      // Mark completed at 95%
      if (video.currentTime / video.duration > 0.95) { 
        fireCompleted(); 
      }

      // Auto-save every 10 seconds
      const now = Date.now();
      if (now - lastSavedAt > 10_000) {
        lastSavedAt = now;
        const gi = (window as any).currentVideoIndex ?? 0;
        window.dispatchEvent(new CustomEvent("lms_save_progress", {
          detail: { globalIndex: gi, positionSeconds: Math.floor(video.currentTime) },
        }));
      }
    };

    video.addEventListener("seeking",    handleSeeking);
    video.addEventListener("seeked",     handleSeeked);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended",      fireCompleted);

    return () => {
      video.removeEventListener("seeking",    handleSeeking);
      video.removeEventListener("seeked",     handleSeeked);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended",      fireCompleted);
    };
  }, [videoKey, activeModuleId, activeSubmoduleTitle]);

  /* ================= REMAINING LOGIC (Quizzes, Continue, UI) ================= */

  useEffect(() => {
    setQuizResult(null);
    setAdvanceCountdown(0);
  }, [activeQuiz?.id]);

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

  const handleQuizSubmit = (result?: any) => {
    try {
      let score = 0, total = 0;
      if (typeof result?.score === "number" && typeof result?.total === "number") {
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
    } catch (err) { console.error(err); }
  };

  const handleContinueNow = () => {
    window.dispatchEvent(new CustomEvent("lms_quiz_advance", {
      detail: { quizId: quizResultRef.current?.quizId },
    }));
    setAdvanceCountdown(0);
    onCloseQuiz();
  };

  const activeModule = course?.modules?.find(m => m.moduleId === activeModuleId);

  return (
    <div className="bg-[#f0f4f8] p-4 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto space-y-4">

        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xl shadow-blue-900/5">

          {activeQuiz ? (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Trophy size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Knowledge Check</h3>
                    <p className="text-xs text-slate-500 font-medium italic">ACCA Standards Assessment</p>
                  </div>
                </div>
                <button
                  onClick={() => { setQuizResult(null); setAdvanceCountdown(0); onCloseQuiz(); }}
                  className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400">
                  <X size={20} />
                </button>
              </div>

              {quizResult ? (
                <div className="py-8 flex flex-col items-center gap-6 text-center animate-in fade-in zoom-in duration-300">
                  <div className="w-full px-5 py-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-600/20">
                      <CheckCircle2 size={20} className="text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-blue-900">Submission Successful</p>
                      <p className="text-xs text-blue-700">Results recorded for Professional Certification.</p>
                    </div>
                  </div>

                  <div className={`w-32 h-32 rounded-full flex flex-col items-center justify-center border-[6px] shadow-inner ${
                    quizResult.passed ? "border-emerald-500 bg-emerald-50" : "border-blue-500 bg-blue-50"}`}>
                    <span className={`text-3xl font-black ${quizResult.passed ? "text-emerald-700" : "text-blue-700"}`}>
                      {quizResult.total > 0 ? Math.round((quizResult.score / quizResult.total) * 100) : 0}%
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Score</span>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    {quizResult.passed
                      ? <p className="font-black text-slate-900 text-xl tracking-tight">EXCELLENT PROGRESS! 🎉</p>
                      : <p className="font-black text-slate-900 text-xl tracking-tight">REVIEW & CONTINUE</p>
                    }
                    <p className="text-sm text-slate-500 font-medium">
                      Correct Answers: <span className="text-blue-600 font-bold">{quizResult.score} out of {quizResult.total}</span>
                    </p>
                  </div>

                  <div className="w-full max-w-sm space-y-3">
                    <div className="px-4 py-3 rounded-xl bg-slate-900 text-white flex flex-col items-center gap-2">
                       <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Auto-Advancing Lesson</p>
                       <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400 transition-all duration-1000" style={{ width: `${(advanceCountdown / 5) * 100}%` }} />
                      </div>
                      <p className="text-xs font-bold">Resuming in {advanceCountdown}s</p>
                    </div>
                    
                    <button onClick={handleContinueNow}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-600/30 active:scale-[0.98]">
                      Start Next Lesson Now
                    </button>
                  </div>
                </div>
              ) : (
                <QuizPanel
                  quiz={activeQuiz}
                  onClose={() => { setQuizResult(null); setAdvanceCountdown(0); onCloseQuiz(); }}
                  onSubmitted={handleQuizSubmit}
                  email={student.email}
                />
              )}
            </div>

          ) : activeVideoUrl ? (
            <div className="bg-black aspect-video relative group">
              {activeVideoUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                <video 
                  key={videoKey} 
                  ref={videoRef} 
                  controls 
                  autoPlay 
                  className="w-full h-full"
                  controlsList="nodownload"
                >
                  <source src={activeVideoUrl} />
                </video>
              ) : (
                <iframe key={videoKey} src={activeVideoUrl} className="w-full h-full"
                  allowFullScreen title="Course video" />
              )}
            </div>
          ) : (
            <div className="relative aspect-video bg-slate-950 overflow-hidden flex items-center justify-center">
               <div className="absolute inset-0 opacity-20 pointer-events-none">
                 <div className="absolute top-10 left-10"><Calculator size={120} className="text-white rotate-12" /></div>
                 <div className="absolute bottom-10 right-10"><Landmark size={140} className="text-white -rotate-12" /></div>
               </div>
               <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 via-transparent to-slate-950/90" />
               <div className="relative z-10 text-center px-6">
                 <div className="mb-6 inline-flex p-5 bg-blue-600 rounded-full text-white shadow-2xl shadow-blue-600/50 hover:scale-110 transition-transform cursor-pointer group">
                   <Play size={32} fill="currentColor" className="ml-1 group-hover:animate-pulse" />
                 </div>
                 <div className="space-y-2">
                   <h2 className="text-2xl font-black text-white tracking-tight uppercase">Professional Accountant Learning</h2>
                   <div className="flex items-center justify-center gap-4 text-blue-200 text-[10px] font-bold tracking-[0.2em] uppercase">
                     <span className="flex items-center gap-1.5"><ShieldCheck size={12} /> Certified Content</span>
                     <span className="w-1 h-1 bg-blue-400 rounded-full" />
                     <span className="flex items-center gap-1.5"><BookOpen size={12} /> ACCA Compliant</span>
                   </div>
                 </div>
               </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 hidden md:grid">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm transition-all hover:shadow-md group">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Layers size={18} />
              </div>
              <h3 className="font-black text-sm tracking-tight text-slate-800 uppercase">Module Summary</h3>
            </div>
            <h4 className="font-bold text-blue-600 text-sm mb-1">{activeModule?.name ?? "General Studies"}</h4>
            <p className="text-xs leading-relaxed text-slate-500 font-medium">
              {activeModule?.description ?? "Select a learning module from the list to begin your professional certification journey."}
            </p>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-sm text-white">
            <div className="flex items-center gap-3 mb-4 text-slate-400">
              <User size={18} />
              <span className="text-[10px] font-black tracking-widest uppercase">Student Profile</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-lg">
                {student.name.charAt(0)}
              </div>
              <div>
                <p className="text-base font-bold tracking-tight">{student.name}</p>
                <p className="text-xs text-slate-400 font-medium">{student.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}