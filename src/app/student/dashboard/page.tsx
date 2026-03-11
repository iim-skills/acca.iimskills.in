"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import DashboardHero from "../DashboardHero";
import CourseModules from "../CourseModules";
import RightSidePanel from "../RightSidePanel";
import { LogOut } from "lucide-react";

/* ================= TYPES (re-used / small edits) ================= */
type StudentAPIResp = {
  id: number;
  name: string;
  email: string;
  student_type: string;
  phone?: string;
  courseSlug?: string;
  courseTitle?: string;
  modules?: string[] | string;
  progress?: Record<string, number[]>; // moduleId -> array of completed videoIds / indexes
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

  // Right-side state
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [activeSubmoduleTitle, setActiveSubmoduleTitle] = useState<string | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);

  // stable callback for CourseModules -> play video
  const onPlayVideoInternal = useCallback((videoUrl: string | null, title?: string, moduleId?: string) => {
    setActiveQuiz(null);
    setActiveVideoUrl(videoUrl);
    setActiveSubmoduleTitle(title ?? null);
    setActiveModuleId(moduleId ? String(moduleId) : null);
  }, []);

  // parse allowed module IDs from student
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  if (!student) return null;
  const s = student;

  return (
    <div className="min-h-screen bg-slate-50">
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
    

      {/* MAIN GRID */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6 px-4">
        {/* LEFT (modules) */}
        <aside className="lg:col-span-2">
          <div className="rounded-2xl sticky top-6">
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
        </aside>

        {/* RIGHT (new component) */}
        <section className="lg:col-span-3">
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
        </section>
      </div>
    </div>
  );
}