"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import DashboardHero from "../DashboardHero";
import CourseModules from "../CourseModules";
import RightSidePanel from "../RightSidePanel";
import { Loader2 } from "lucide-react";

/* ================= TYPES ================= */
type StudentAPIResp = {
  id: number;
  name: string;
  email: string;
  student_type: string;
  phone?: string;
  courseSlug?: string;
  courseTitle?: string;
  modules?: string[] | string;
  progress?: Record<string, number[]>; 
  batch_id?: string | number;
  studentType?: "free" | "paid";
};

type VideoItem = { id?: string; title?: string; url?: string };
type Submodule = { submoduleId?: string; title?: string; description?: string; videos?: VideoItem[]; thumbnail?: string };
type Module = { moduleId?: string; slug?: string; name?: string; description?: string; moduleVideo?: string; submodules?: Submodule[] };
type CourseFile = { courseId?: string; slug?: string; name?: string; description?: string; modules?: Module[] };

/* ================= DYNAMIC IMPORTS ================= */
const QuizPanel = dynamic(() => import("@/components/Students/QuizPanel"), { ssr: false });

export default function StudentDashboardLMS(): React.ReactElement | null {
  const router = useRouter();

  const [student, setStudent] = useState<StudentAPIResp | null>(null);
  const [loadingStudent, setLoadingStudent] = useState<boolean>(true);
  const [course, setCourse] = useState<CourseFile | null>(null);
  const [loadingCourse, setLoadingCourse] = useState<boolean>(false);

  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [activeSubmoduleTitle, setActiveSubmoduleTitle] = useState<string | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);

  const onPlayVideoInternal = useCallback((videoUrl: string | null, title?: string, moduleId?: string) => {
    setActiveQuiz(null);
    setActiveVideoUrl(videoUrl);
    setActiveSubmoduleTitle(title ?? null);
    setActiveModuleId(moduleId ? String(moduleId) : null);
  }, []);

  const studentModuleIds: string[] = useMemo(() => {
    const rawModules = student?.modules ?? [];
    if (typeof rawModules === "string") return rawModules.split(",").map((x) => x.trim()).filter(Boolean);
    if (Array.isArray(rawModules)) return rawModules.map(String);
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
        const res = await fetch("/api/student/me", { headers: { "x-user-email": parsed.email } });
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
  }, [router]);

  /* ================= LOAD COURSE ================= */
  useEffect(() => {
    if (!student?.email) return;

    async function fetchCourse() {
      setLoadingCourse(true);
      try {
        const res = await fetch("/api/student/course", { headers: { "x-user-email": student?.email ?? "" } });
        if (!res.ok) throw new Error("Failed to fetch course");
        const list = await res.json();
        const courseData: CourseFile | null = list?.[0] ?? null;
        if (courseData) courseData.modules = courseData.modules ?? [];
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

  if (loadingStudent || loadingCourse) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          Securing Professional Dashboard...
        </div>
      </div>
    );
  }

  if (!student) return null;
  const s = student;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* 1. Header Area with Hero */}
      <div className="bg-white border-b border-slate-200">
        <div className="w-full mx-auto">
          <DashboardHero
            studentName={s.name}
            Type={s.student_type}
            course={course}
            activeModules={studentModuleIds}
            onLogout={() => {
              if (typeof window !== "undefined") localStorage.removeItem("user");
              router.push("/");
            }}
          />
        </div>
      </div>

      {/* 2. Main Course Layout Grid */}
      <main className="max-w-7xl mx-auto pb-12 px-4 lg:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Modules Navigation (40% width on large screens) */}
          <aside className="lg:col-span-5 xl:col-span-4">
            <div className="sticky top-8 space-y-6">
              
              
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                <CourseModules
                  course={course}
                  allowedModules={studentModuleIds}
                  progress={s.progress ?? {}}
                  onPlayVideo={(url, title, moduleId) => onPlayVideoInternal(url, title, moduleId)}
                  onOpenQuiz={(quiz) => {
                    setActiveVideoUrl(null);
                    setActiveQuiz(quiz);
                  }}
                />
              </div>
            </div>
          </aside>

          {/* RIGHT: Content Player & Info (60% width on large screens) */}
          <section className="lg:col-span-7 xl:col-span-8">
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className="w-1.5 h-6 bg-cyan-500 rounded-full" />
                <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase">
                  Learning Workspace
                </h2>
              </div>

              <RightSidePanel
                course={course}
                student={s}
                activeModuleId={activeModuleId}
                activeVideoUrl={activeVideoUrl}
                activeSubmoduleTitle={activeSubmoduleTitle}
                activeQuiz={activeQuiz}
                onCloseQuiz={() => setActiveQuiz(null)}
                onPlayVideo={(url, title, moduleId) => onPlayVideoInternal(url, title, moduleId)}
                QuizPanel={QuizPanel}
              />
            </div>
          </section>
        </div>
      </main>

      {/* 3. Subtle Footer Branding */}
      <footer className="py-8 text-center border-t border-slate-200 bg-white">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
          Professional Learning Management System &bull; ACCA Verified
        </p>
      </footer>
    </div>
  );
}