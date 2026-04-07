  "use client";

  import React, { useMemo, useRef, useEffect, useState } from "react";
  import {
    Play, X, Trophy, Activity, Layers, User, CheckCircle2, XCircle, 
    BookOpen, Calculator, Landmark, ShieldCheck, ChevronRight,
    Clock, Award, Bell, MonitorPlay, Info
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

    const [quizResult,         setQuizResult]      = useState<QuizResult | null>(null);
    const [advanceCountdown, setAdvanceCountdown] = useState(0);
    const quizResultRef = useRef<QuizResult | null>(null);
    
    useEffect(() => { quizResultRef.current = quizResult; }, [quizResult]);

    // 1. Monitor active video changes and reset tracking
    useEffect(() => {
      if (!activeVideoUrl) return;
      if (lastVideoUrlRef.current === activeVideoUrl) return;
      
      lastVideoUrlRef.current       = activeVideoUrl;
      videoCompleteFiredRef.current = false;
      
      const resumeAt = (window as any).currentVideoResumeSeconds ?? 0;
      maxTimeReachedRef.current = resumeAt;
      
      setVideoKey(activeVideoUrl);
    }, [activeVideoUrl]);

    // 2. Handle the initial Seek on Refresh/Load
    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;
      
      const resumeAt: number = (window as any).currentVideoResumeSeconds ?? 0;
      
      const performInitialSeek = () => {
        if (resumeAt > 0) {
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
        if (video.currentTime > maxTimeReachedRef.current + 1.5) {
          video.currentTime = maxTimeReachedRef.current;
        }
        isSeekingRef.current = false;
      };

      const handleTimeUpdate = () => {
        if (!video.duration || isSeekingRef.current) return;

        if (video.currentTime > maxTimeReachedRef.current + 2) {
          video.currentTime = maxTimeReachedRef.current;
        } else {
          if (video.currentTime > maxTimeReachedRef.current) {
              maxTimeReachedRef.current = video.currentTime;
          }
        }

        if (video.currentTime / video.duration > 0.95) { 
          fireCompleted(); 
        }

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

    /* ================= QUIZ LOGIC ================= */

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

    /* ================= NOTIFICATIONS ================= */
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
      const fetchNotifications = async () => {
        try {
          const res = await fetch("/api/student/notifications");
          const data = await res.json();
          setNotifications(data);
        } catch (err) {
          console.error("Notification fetch error", err);
        }
      };

      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }, []);

    return (
      <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans text-slate-900 selection:bg-blue-100">
        <div className="max-w-6xl mx-auto grid grid-cols-1 gap-8">
          
          {/* Main Content Area */}
          <div className="space-y-6">
            
            {/* Header Context */}
            <div className="flex flex-col gap-1 px-1">
              <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">
                <Layers size={14} />
                <span>{course?.name || "Professional Certification"}</span>
                <ChevronRight size={12} className="text-slate-300" />
                <span className="text-slate-500">{activeModule?.name || "Select a module"}</span>
              </div>
<h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
  {(() => {
    if (!activeVideoUrl) {
      return `Welcome ${student?.name || "Student"}`;
    }

    if (activeSubmoduleTitle?.includes("||")) {
      const [chapter, lesson] = activeSubmoduleTitle.split("||");
      return `${chapter} - ${lesson}`;
    }

    return activeSubmoduleTitle || "Chapter";
  })()}
</h1>
            </div>

            {/* Player/Quiz Container */}
            <div className="relative group overflow-hidden bg-white shadow-2xl shadow-slate-200 border border-slate-200">
              {activeQuiz ? (
                <div className="p-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <Trophy size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 leading-none">Assessment</h3>
                        <p className="text-xs text-slate-500 mt-1 font-medium">Verify your understanding of recent concepts</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setQuizResult(null); setAdvanceCountdown(0); onCloseQuiz(); }}
                      className="p-2.5 rounded-xl hover:bg-slate-200 transition-colors text-slate-500 active:scale-95"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="p-8">
                    {quizResult ? (
                      <div className="py-4 flex flex-col items-center gap-8 text-center animate-in zoom-in-95 duration-500">
                        <div className="relative">
                          <div className={`w-40 h-40 rounded-full flex flex-col items-center justify-center border-[8px] bg-white shadow-xl ${
                            quizResult.passed ? "border-emerald-500 ring-4 ring-emerald-50" : "border-blue-600 ring-4 ring-blue-50"}`}>
                            <span className={`text-4xl font-black tracking-tighter ${quizResult.passed ? "text-emerald-600" : "text-blue-600"}`}>
                              {quizResult.total > 0 ? Math.round((quizResult.score / quizResult.total) * 100) : 0}%
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Final Score</span>
                          </div>
                          <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-2 rounded-xl shadow-lg border border-slate-700">
                            {quizResult.passed ? <CheckCircle2 size={24} className="text-emerald-400" /> : <Info size={24} className="text-blue-400" />}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                            {quizResult.passed ? "Certification Ready! 🎉" : "Knowledge Validated"}
                          </h2>
                          <p className="text-slate-500 font-medium max-w-xs mx-auto">
                            You correctly answered <span className="text-slate-900 font-bold">{quizResult.score} out of {quizResult.total}</span> questions.
                          </p>
                        </div>

                        <div className="w-full max-w-sm space-y-4 pt-4 border-t border-slate-100">
                          <div className="px-6 py-4 rounded-2xl bg-slate-950 text-white relative overflow-hidden group">
                            <div className="relative z-10">
                                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black mb-3">Auto-Advancing Syllabus</p>
                                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
                                  <div className="h-full bg-blue-500 transition-all duration-1000 ease-linear shadow-[0_0_8px_rgba(59,130,246,0.5)]" style={{ width: `${(advanceCountdown / 5) * 100}%` }} />
                                </div>
                                <p className="text-sm font-bold flex items-center justify-center gap-2">
                                  <Clock size={14} className="text-blue-400" />
                                  Next lesson in {advanceCountdown} seconds
                                </p>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          
                          <button onClick={handleContinueNow}
                            className="w-full py-4 bg-white border-2 border-slate-200 hover:border-blue-600 hover:text-blue-600 text-slate-700 text-sm font-bold rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                            Resume Learning Now <ChevronRight size={18} />
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
                </div>

              ) : activeVideoUrl ? (
                <div className="bg-slate-900 aspect-video relative">
                  {activeVideoUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                    <video 
                      key={videoKey} 
                      ref={videoRef} 
                      controls 
                      autoPlay 
                      className="w-full h-full object-contain border-2 border-slate-800"
                      controlsList="nodownload"
                    >
                      <source src={activeVideoUrl} />
                    </video>
                  ) : (
                    <iframe key={videoKey} src={activeVideoUrl} className="w-full h-full "
                      allowFullScreen title="Course video" />
                  )}
                  
                  {/* Cinema mode glass overlay when paused/inactive */}
                  <div className="absolute inset-0 pointer-events-none border-[12px] border-white/5 opacity-40" />
                </div>
              ) : (
                <div className="relative aspect-video bg-slate-950 flex items-center justify-center">
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-[-10%] left-[-5%] opacity-10 animate-pulse"><Calculator size={240} className="text-white rotate-12" /></div>
                    <div className="absolute bottom-[-10%] right-[-5%] opacity-10"><Landmark size={280} className="text-white -rotate-12" /></div>
                  </div>
                  
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/40 via-transparent to-slate-950/80" />
                  
                  <div className="relative z-10 text-center px-8 space-y-8 animate-in fade-in zoom-in-95 duration-700">
                    <div className="relative inline-block group cursor-pointer">
                        <div className="absolute -inset-4 bg-blue-600/20 rounded-full blur-2xl group-hover:bg-blue-600/40 transition-all duration-500" />
                        <div className="relative p-7 bg-blue-600 text-white rounded-full shadow-2xl shadow-blue-600/50 group-hover:scale-110 transition-all duration-300">
                          <Play size={40} fill="currentColor" className="ml-1.5" />
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h2 className="text-3xl font-black text-white tracking-tighter uppercase sm:text-4xl">
                        Ready for the <span className="text-blue-400 italic">Next Level?</span>
                      </h2>
                      <div className="flex flex-wrap items-center justify-center gap-6">
                        <div className="flex items-center gap-2 text-slate-300 text-[11px] font-bold tracking-widest uppercase bg-white/5 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
                          <ShieldCheck size={14} className="text-blue-400" /> Verified Content
                        </div>
                        <div className="flex items-center gap-2 text-slate-300 text-[11px] font-bold tracking-widest uppercase bg-white/5 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
                          <BookOpen size={14} className="text-blue-400" /> ACCA Standards
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar / Intelligence Panel */}
          <div className="space-y-6">
            
            {/* Student Profile Card */}
          

            {/* Notifications Hub */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-2">
                <h5 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                  <Bell size={12} /> News & Alerts
                </h5>
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              </div>
              
              <div className="space-y-3">
                {notifications.length > 0 ? (
                  notifications.slice(0, 3).map((n, i) => (
                    <div
                      key={i}
                      className="bg-white hover:bg-blue-50/30 border border-slate-200 rounded-2xl p-4 transition-all duration-300 group cursor-default animate-in slide-in-from-right-4 fade-in"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <div className="flex gap-3">
                        <div className="mt-1 w-2 h-2 rounded-full bg-blue-600 shrink-0 shadow-[0_0_6px_rgba(37,99,235,0.5)]" />
                        <div className="space-y-1">
                            <p className="font-bold text-[13px] text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">
                              {n.title}
                            </p>
                            <p className="text-slate-500 text-[11px] font-medium leading-relaxed">
                              {n.message}
                            </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center">
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">No new alerts</p>
                  </div>
                )}
              </div>
            </div>

          

          </div>
        </div>
      </div>
    );
  }