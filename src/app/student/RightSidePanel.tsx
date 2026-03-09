"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import {
  Play,
  X,
  Maximize2,
  Trophy,
  Activity,
  Layers,
  User,
  Info
} from "lucide-react";

/* ================= TYPES ================= */

type VideoItem = { id?: string; title?: string; url?: string };
type Submodule = { submoduleId?: string; title?: string; description?: string; videos?: VideoItem[] };
type Module = { moduleId?: string; slug?: string; name?: string; description?: string; submodules?: Submodule[] };
type CourseFile = { courseId?: string; slug?: string; name?: string; description?: string; modules?: Module[] };

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

  // Dedupe flags so we don't fire completion multiple times per video
  const videoCompleteFiredRef = useRef<boolean>(false);
  // track the current URL so we reset dedupe when video changes
  const lastVideoUrlRef = useRef<string | null>(null);

  // a small flash message for quiz-submitted confirmation
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  /* ================= VIDEO COMPLETE EVENT ================= */

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // reset dedupe when video url changes
    if (lastVideoUrlRef.current !== activeVideoUrl) {
      videoCompleteFiredRef.current = false;
      lastVideoUrlRef.current = activeVideoUrl;
    }

    const handleEnded = () => {
      // guard: only fire once per video load
      if (videoCompleteFiredRef.current) {
        // console.debug("[video] completion already fired for this video");
        return;
      }
      videoCompleteFiredRef.current = true;

      console.log("🎬 Video finished");

      // dispatch the canonical event your CourseModules listens to
      window.dispatchEvent(
        new CustomEvent("lms_video_completed", {
          detail: {
            // we keep using window.currentVideoIndex if your app sets it elsewhere
            globalIndex: (window as any).currentVideoIndex ?? 0
          }
        })
      );

      // Optionally also dispatch a more generic 'request_next' event
      // for other parts of the app that care about advancing.
      window.dispatchEvent(
        new CustomEvent("lms_request_next_item", {
          detail: {
            type: "video",
            moduleId: activeModuleId,
            submoduleTitle: activeSubmoduleTitle
          }
        })
      );
    };

    const handleTimeUpdate = () => {
      if (!video.duration) return;

      const progress = video.currentTime / video.duration;

      // 95% watch = complete
      if (progress > 0.95) {
        handleEnded();
      }
    };

    video.addEventListener("ended", handleEnded);
    video.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };

  }, [activeVideoUrl, activeModuleId, activeSubmoduleTitle]);


  /* ================= QUIZ SUBMIT HANDLER ================= */

  // Called when the QuizPanel reports a successful submission.
  // We show a single flash message, dispatch an event the parent can listen to,
  // and close the quiz UI.
  const handleQuizSubmit = async (result?: any) => {
    try {
      console.log("[Quiz] submit result:", result);
      // show the message to the user
      setFlashMessage("Your quiz submitted successfully — activating next item");

      // dispatch an event the CourseModules (or other parent) can listen to
      window.dispatchEvent(
        new CustomEvent("lms_quiz_submitted", {
          detail: {
            moduleId: activeModuleId,
            submoduleTitle: activeSubmoduleTitle,
            // optionally include quiz result data
            result
          }
        })
      );

      // Also dispatch a generic request-next event
      window.dispatchEvent(
        new CustomEvent("lms_request_next_item", {
          detail: {
            type: "quiz",
            moduleId: activeModuleId,
            submoduleTitle: activeSubmoduleTitle,
            result
          }
        })
      );

      // close quiz UI after a short delay to allow user to read the message
      // (you can change timing as needed)
      setTimeout(() => {
        onCloseQuiz();
      }, 700);

      // auto-hide flash after a short time
      window.setTimeout(() => {
        setFlashMessage(null);
      }, 2800);
    } catch (err) {
      console.error("[Quiz] submit handler error", err);
      setFlashMessage("There was a problem submitting the quiz. Please try again.");
      window.setTimeout(() => setFlashMessage(null), 3000);
    }
  };


  /* ================= PROGRESS CALCULATION ================= */

  const progressPercent = useMemo(() => {

    const modules = course?.modules ?? [];
    if (!modules.length) return 0;

    const modulePercents = modules.map((module) => {

      const totalVideos =
        module.submodules?.reduce((acc, s) => acc + (s.videos?.length ?? 0), 0) ?? 0;

      const completed =
        student.progress?.[String(module.moduleId)]?.length ?? 0;

      if (!totalVideos) return 0;

      return Math.min(100, Math.round((completed / totalVideos) * 100));

    });

    const sum = modulePercents.reduce((a, b) => a + b, 0);

    return Math.round(sum / modulePercents.length);

  }, [course, student.progress]);

  const activeModule = course?.modules?.find(
    (m) => m.moduleId === activeModuleId
  );

  /* ================= UI ================= */

  return (
    <div className="bg-[#f8fafc] min-h-screen p-4 font-sans text-slate-800">

      <div className="max-w-4xl mx-auto space-y-4">

        {/* HEADER */}
        <div className="bg-white rounded-xl p-4 shadow-sm border">

          <div className="flex items-center justify-between mb-3">

            <div>
              <h2 className="text-base font-bold">Learning Dashboard</h2>
              <p className="text-xs text-slate-500">
                Continue your learning journey
              </p>
            </div>

            <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-lg">
              <Activity size={14} className="text-indigo-600" />
              <span className="text-xs font-bold text-indigo-700">
                {progressPercent}% Done
              </span>
            </div>

          </div>

          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">

            <div
              className="h-full bg-indigo-600 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />

          </div>
        </div>

        {/* VIDEO / QUIZ AREA */}

        <div className="rounded-xl overflow-hidden border">

          {activeQuiz ? (

            <div className="bg-white p-4">

              <div className="flex justify-between mb-4">

                <div className="flex items-center gap-2">
                  <Trophy size={16} className="text-amber-500" />
                  <h3 className="text-sm font-bold">Assessment</h3>
                </div>

                <button
                  onClick={onCloseQuiz}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>

              </div>

              {/* Pass handleQuizSubmit to QuizPanel so it can call it when the user submits */}
              <QuizPanel quiz={activeQuiz} onClose={onCloseQuiz} onSubmit={handleQuizSubmit} />

            </div>

          ) : activeVideoUrl ? (

            <div className="bg-black aspect-video">

              {(activeVideoUrl as string).match(/\.(mp4|webm|ogg)$/i) ? (

                <video
                  ref={videoRef}
                  controls
                  autoPlay
                  className="w-full h-full"
                >
                  <source src={activeVideoUrl} />
                </video>

              ) : (

                <iframe
                  src={activeVideoUrl}
                  className="w-full h-full"
                  allowFullScreen
                  title="Course video"
                />

              )}

            </div>

          ) : (

            <div className="text-center p-10 bg-black text-white">

              <Play size={24} className="mx-auto mb-4" />

              <h3 className="font-bold">
                Ready to learn?
              </h3>

              <p className="text-sm text-gray-400">
                Select a lesson to start
              </p>

            </div>

          )}

        </div>

        {/* flash message */}
        {flashMessage && (
          <div className="max-w-4xl mx-auto mt-2">
            <div className="p-3 rounded-md bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm">
              {flashMessage}
            </div>
          </div>
        )}

        {/* MODULE INFO */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="bg-white rounded-xl p-5 border">

            <div className="flex items-center gap-2 mb-3">
              <Layers size={14} className="text-indigo-600" />
              <h3 className="font-bold text-sm">
                {activeModule?.name ?? "Module Summary"}
              </h3>
            </div>

            <p className="text-xs text-slate-500">
              {activeModule?.description ??
                "Select a module to see details"}
            </p>

          </div>

          <div className="bg-white rounded-xl p-4 border">

            <div className="flex items-center gap-2 mb-3 text-slate-400">
              <User size={14} />
              <span className="text-xs font-bold">
                Student Info
              </span>
            </div>

            <p className="text-sm font-bold">{student.name}</p>
            <p className="text-xs text-gray-500">{student.email}</p>

            <p className="text-xs mt-2">
              Batch: #{student.batch_id ?? "N/A"}
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}