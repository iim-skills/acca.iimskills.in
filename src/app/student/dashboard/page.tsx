"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import CourseModules from "../CourseModules";
import dynamic from "next/dynamic";
import { LogOut, Film } from "lucide-react";

const QuizPanel = dynamic(() => import("@/components/Students/QuizPanel"), {
  ssr: false,
});

/* ================= TYPES ================= */
type StudentAPIResp = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  courseSlug?: string;
  courseTitle?: string;
  modules?: string[] | string;
  progress?: Record<string, number[]>;
  batch_id?: string | number;
};

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
  thumbnail?: string;
};

type Module = {
  moduleId?: string;
  slug?: string;
  name?: string;
  description?: string;
  moduleVideo?: string;
  submodules?: Submodule[];
};

type CourseFile = {
  courseId?: string;
  slug?: string;
  name?: string;
  description?: string;
  modules?: Module[]; // normalized to empty array when absent
};

/* ================= COMPONENT ================= */
export default function StudentDashboardLMS(): React.ReactElement | null {
  const router = useRouter();

  // ======= HOOKS (always declared, never conditionally) =======
  const [student, setStudent] = useState<StudentAPIResp | null>(null);
  const [loadingStudent, setLoadingStudent] = useState<boolean>(true);

  const [course, setCourse] = useState<CourseFile | null>(null);
  const [loadingCourse, setLoadingCourse] = useState<boolean>(false);

  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [activeSubmoduleTitle, setActiveSubmoduleTitle] = useState<string | null>(null);
  const [activeGlobalIndex, setActiveGlobalIndex] = useState<number | null>(null);

  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // useCallback (stable)
  const onPlayVideoInternal = useCallback((videoUrl: string | null, title?: string, moduleId?: string) => {
    setActiveQuiz(null); // hide quiz if open
    setActiveVideoUrl(videoUrl);
    setActiveSubmoduleTitle(title ?? null);
    setActiveModuleId(moduleId ? String(moduleId) : null);
  }, []);

  // useMemo (must be before any early return)
  const studentModuleIds: string[] = useMemo(() => {
    const rawModules = student?.modules ?? [];
    if (typeof rawModules === "string") {
      return rawModules.split(",").map((x) => x.trim()).filter(Boolean);
    }
    if (Array.isArray(rawModules)) {
      return rawModules.map(String);
    }
    return [];
  }, [student?.modules]);

  /* ================= LOAD STUDENT ================= */
  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (!raw) {
      router.push("/");
      return;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      router.push("/");
      return;
    }

    if (!parsed || parsed.role !== "student" || !parsed.email) {
      router.push("/");
      return;
    }

    async function fetchStudent() {
      setLoadingStudent(true);
      try {
        const res = await fetch("/api/student/me", {
          headers: { "x-user-email": parsed.email },
        });
        if (!res.ok) throw new Error("Failed to fetch student");
        const data = await res.json();
        setStudent(data);
      } catch (err) {
        console.error("fetchStudent error:", err);
        router.push("/");
      } finally {
        setLoadingStudent(false);
      }
    }

    fetchStudent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  /* ================= LOAD COURSE ================= */
  useEffect(() => {
    // Only run when we have a student object with an email
    if (!student?.email) return;

    async function fetchCourse() {
      setLoadingCourse(true);
      try {
        const res = await fetch("/api/student/course", {
          headers: { "x-user-email": student.email },
        });
        if (!res.ok) throw new Error("Failed to fetch course");
        const list = await res.json();

        // normalize modules so it's never null
        const courseData: CourseFile | null = list?.[0] ?? null;
        if (courseData) {
          courseData.modules = courseData.modules ?? [];
        }
        setCourse(courseData);
      } catch (err) {
        console.error("fetchCourse error:", err);
        setCourse(null);
      } finally {
        setLoadingCourse(false);
      }
    }

    fetchCourse();
  }, [student?.email]);

  /* ================= LOADING UI (guards after hooks) ================= */
  if (loadingStudent || loadingCourse) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  // Narrow student: now that loading is done, ensure student exists before using it.
  if (!student) return null;
  const s = student; // safe alias for convenience

  const activeModule = course?.modules?.find((m) => m.moduleId === activeModuleId);

  /* ================= RENDER ================= */
  return (
    <div className="min-h-screen bg-slate-50">
      {/* HERO */}
      <div className="max-w-full mx-auto mb-8 bg-gradient-to-r from-indigo-600 to-indigo-400 text-white shadow-lg overflow-hidden">
        <div className="max-w-7xl mx-auto p-8 flex justify-between">
          <div>
            <h1 className="text-2xl font-bold">{s.name}</h1>
            <p className="text-sm opacity-90">{s.courseTitle ?? "Your course"}</p>
          </div>

          <button
            onClick={() => {
              if (typeof window !== "undefined") localStorage.removeItem("user");
              router.push("/");
            }}
            className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl flex items-center gap-2"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6 px-4">
        {/* LEFT */}
        <aside className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow p-4 sticky top-6">
            <CourseModules
              course={course}
              allowedModules={studentModuleIds}
              progress={s.progress ?? {}}
              onPlayVideo={(url, title, moduleId) => {
                onPlayVideoInternal(url, title, moduleId);
              }}
              onOpenQuiz={(quiz) => {
                setActiveVideoUrl(null);
                setActiveQuiz(quiz);
              }}
            />
          </div>
        </aside>

        {/* RIGHT */}
        <section className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow p-4">
            <div className="w-full aspect-video bg-black rounded-xl overflow-hidden mb-4 flex items-center justify-center">
              {/* SHOW QUIZ IF SELECTED */}
              {activeQuiz ? (
                <div className="w-full h-full bg-white overflow-auto">
                  <QuizPanel quiz={activeQuiz} onClose={() => setActiveQuiz(null)} />
                </div>
              ) : activeVideoUrl ? (
                // activeVideoUrl is guaranteed to be non-null in this branch
                (() => {
                  const url = activeVideoUrl as string;
                  return url.match(/\.(mp4|webm|ogg)$/i) ? (
                    <video ref={videoRef} controls className="w-full h-full">
                      <source src={url} />
                    </video>
                  ) : (
                    <iframe
                      src={url}
                      className="w-full h-full"
                      allowFullScreen
                      title={activeSubmoduleTitle ?? "Embedded video"}
                    />
                  );
                })()
              ) : (
                <div className="text-center text-slate-400">
                  <Film size={36} className="mx-auto mb-2" />
                  <div className="text-sm">Select a video or quiz</div>
                </div>
              )}
            </div>

            {/* MODULE INFO */}
            <div>
              <h3 className="text-lg font-semibold mb-2">{activeModule?.name ?? "Module details"}</h3>
              <p className="text-sm text-slate-600">{activeModule?.description ?? "Select a module to see details."}</p>

              {activeSubmoduleTitle && (
                <div className="mt-3 text-sm text-slate-700">
                  <span className="font-medium">Now playing:</span> {activeSubmoduleTitle}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}