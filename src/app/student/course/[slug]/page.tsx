"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import DashboardHero from "../DashboardHero";
import CourseModules from "../CourseModules";
import RightPanel from "../RightPanel";
import QuizPanel from "@/components/Students/QuizPanel";

type Student = {
  id: number;
  name: string;
  email: string;
  student_type?: string;
  phone?: string;
  modules: string[];
  submodules?: any;
  progress: any;
  batch_id?: string | number;
};

type Course = {
  name: string;
  fullStudyMaterial?: {
    name?: string;
    fileUrl?: string;
  };
  modules: any[];
};

const normalizeStudentType = (value: unknown): "free" | "paid" =>
  String(value ?? "").trim().toLowerCase() === "free" ? "free" : "paid";

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
  const [activeLiveSessions, setActiveLiveSessions] = useState<any[] | null>(null);

  const studentTypeNorm = normalizeStudentType(student?.student_type ?? "");
  const hasAssignedModules = Boolean(student && Array.isArray(student.modules) && student.modules.length > 0);
  const hasAssignedSubmodules = Boolean(student && student.submodules && Object.keys(student.submodules).length > 0);
  const canAccessLiveSessions = Boolean(student && studentTypeNorm === "paid" && (hasAssignedModules || hasAssignedSubmodules));

  /* ================= LOGOUT ================= */
  const handleLogout = () => {
    try {
      console.log("Logout clicked");

      // clear user data
      localStorage.removeItem("user");
      localStorage.removeItem("course_user_key");

      // optional full clear
      // localStorage.clear();

      // redirect to home/login
      router.push("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

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
        "x-user-email": user.email,
      },
      })
      .then((res) => res.json())
      .then((data) => {
        const resolvedStudentType = normalizeStudentType(
          data?.student_type ?? data?.studentType
        );
        const nextStudent = {
          ...data,
          student_type: resolvedStudentType,
          modules: Array.isArray(data?.modules) ? data.modules : [],
          progress: data?.progress ?? {},
        };

        setStudent(nextStudent);

        try {
          const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
          localStorage.setItem(
            "user",
            JSON.stringify({
              ...storedUser,
              student_type: resolvedStudentType,
              studentType: resolvedStudentType,
            })
          );
        } catch {
          // Ignore localStorage sync issues and continue rendering.
        }
      })
      .catch((err) => {
        console.error("Student fetch error:", err);
      });
  }, [router, slug]);

  /* ================= COURSE ================= */
  useEffect(() => {
    fetch(`/api/student/course/course-details?slug=${slug}`)
      .then((res) => res.json())
      .then((data) => {
        setCourse(data.course);
      })
      .catch((err) => {
        console.error("Course fetch error:", err);
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
    setActiveLiveSessions(null);
  };

  const handleShowLiveSessions = (moduleId: string) => {
    setActiveQuiz(null);
    setActiveVideoUrl(null);
    setActiveModuleId(moduleId);
    setActiveSubmoduleTitle(null);
    const mod = course?.modules?.find((m) => m.moduleId === moduleId) ?? null;
    setActiveLiveSessions(mod?.liveSessions ?? null);
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
        student_type={student.student_type}
        course={course}
        activeModules={student.modules}
      />

      {/* MAIN GRID */}
      <div className="relative z-10 max-w-7xl mx-auto md:px-6 py-8 grid grid-cols-12 gap-6 md:-mt-20 bg-[#fbffff] rounded-2xl shadow-lg">

        {/* LEFT SIDE (Modules) */}
        <div className="col-span-12 order-last lg:order-first lg:col-span-5 xl:col-span-5">
          <CourseModules
            course={course}
            studentType={student.student_type}
            allowedModules={student.modules}
            allowedSubmodules={student.submodules}
            progress={student.progress}
            onPlayVideo={(url, title, moduleId) =>
              handlePlayVideo(url, title, moduleId)
            }
            onOpenQuiz={handleOpenQuiz}
            onShowLiveSessions={handleShowLiveSessions}
          />
        </div>

        {/* RIGHT SIDE (Player + Quiz) */}
        <div
          className="
            col-span-12
            order-first
            lg:order-last lg:col-span-7 xl:col-span-7
            sticky -top-14
            lg:sticky lg:top-4
            h-fit
            rounded-xl
            shadow-sm
            bg-white
          "
        >
          <RightPanel
            course={course}
            student={student}
            activeModuleId={activeModuleId}
            activeVideoUrl={activeVideoUrl}
            activeSubmoduleTitle={activeSubmoduleTitle}
            activeQuiz={activeQuiz}
            activeLiveSessions={activeLiveSessions}
            liveSessionsLocked={!canAccessLiveSessions}
            onCloseQuiz={() => setActiveQuiz(null)}
            onPlayVideo={(url, title, moduleId) =>
              handlePlayVideo(url, title, moduleId)
            }
            QuizPanel={QuizPanel}
          />
        </div>

      </div>
    </div>
  );
}
