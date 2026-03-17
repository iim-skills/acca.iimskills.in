"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import DashboardHero from "../DashboardHero";
import CourseModules from "../CourseModules";
import RightPanel from "../RightPanel";

type Student = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  modules: string[];
  progress: any;
  batch_id?: string | number;
};

type Course = {
  name: string;
  modules: any[];
};

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [course, setCourse] = useState<Course | null>(null);

  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [activeSubmoduleTitle, setActiveSubmoduleTitle] = useState<string | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);

  /* ================= STUDENT ================= */
  useEffect(() => {
    const raw = localStorage.getItem("user");

    if (!raw) {
      router.push("/");
      return;
    }

    const user = JSON.parse(raw);

    fetch(`/api/student/me?slug=${slug}`, {
      headers: {
        "x-user-email": user.email
      }
    })
      .then(res => res.json())
      .then(data => {
        setStudent(data);
      });
  }, [router, slug]);

  /* ================= COURSE ================= */
  useEffect(() => {
    fetch(`/api/student/course/course-details?slug=${slug}`)
      .then(res => res.json())
      .then(data => {
        setCourse(data.course);
      });
  }, [slug]);

  if (!student || !course) return <div>Loading...</div>;

  /* ================= PLAY VIDEO ================= */
  const handlePlayVideo = (
    url: string | null,
    title?: string,
    moduleId?: string
  ) => {
    setActiveQuiz(null);
    setActiveVideoUrl(url ?? null);
    setActiveModuleId(moduleId ?? null);
    setActiveSubmoduleTitle(title ?? null);
  };

  /* ================= OPEN QUIZ ================= */
  const handleOpenQuiz = (quiz: any) => {
    setActiveVideoUrl(null);
    setActiveQuiz(quiz);
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HERO */}
      <DashboardHero
        studentName={student.name}
        Type="paid"
        course={course}
        activeModules={student.modules}
        onLogout={() => {
          localStorage.removeItem("user");
          router.push("/");
        }}
      />

      {/* MAIN GRID */}
      {/* Mobile-first: RightPanel will be order-first & sticky;
          Modules will be order-last (so they appear below).
          On lg: breakpoint restore original grid columns & ordering */}
      <div className="max-w-7xl mx-auto md:px-6 py-8 grid grid-cols-12 gap-15">

        {/* RIGHT SIDE (Player + Quiz) - mobile: top & sticky */}
        <div
  className="
    col-span-12
    order-first
    sticky top-4 z-20 bg-white
    lg:order-none lg:col-span-7 xl:col-span-7
    h-fit
    rounded-xl
    shadow-sm
    p-0
  "
>
          <RightPanel
            course={course}
            student={student}
            activeModuleId={activeModuleId}
            activeVideoUrl={activeVideoUrl}
            activeSubmoduleTitle={activeSubmoduleTitle}
            activeQuiz={activeQuiz}
            onCloseQuiz={() => setActiveQuiz(null)}
            onPlayVideo={(url, title, moduleId) =>
              handlePlayVideo(url, title, moduleId)
            }
            QuizPanel={require("@/components/Students/QuizPanel").default}
          />
        </div>

        {/* LEFT SIDE (Modules) - mobile: below right panel */}
        <div className="col-span-12 order-last lg:order-none lg:col-span-5 xl:col-span-5">
          <CourseModules
            course={course}
            allowedModules={student.modules}
            progress={student.progress}
            onPlayVideo={(url, title, moduleId) =>
              handlePlayVideo(url, title, moduleId)
            }
            onOpenQuiz={handleOpenQuiz}
          />
        </div>

      </div>
    </div>
  );
}