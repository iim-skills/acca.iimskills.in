"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ArrowRight } from "lucide-react";

type Course = {
  course_slug: string;
  course_title: string;
};

export default function StudentPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"my" | "all">("my");

  // API-fetched lists
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);

  // local "enrolled" cache for client-only enroll action (keeps UI responsive)
  const [localEnrolled, setLocalEnrolled] = useState<string[]>([]);

  const [studentName, setStudentName] = useState("Student");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentType, setStudentType] = useState("student");

  const [loading, setLoading] = useState(true);

  /* ===================== Helpers ===================== */

  // Check enrolled either from server myCourses OR localEnrolled fallback
  const isEnrolled = (slug: string) => {
    return (
      myCourses.some((c) => c.course_slug === slug) ||
      localEnrolled.includes(slug)
    );
  };

  // Decide primary action text depending on type & visited state
  const getButtonText = (slug: string) => {
    if (studentType === "free") return "Start Free Preview";

    const visited = JSON.parse(
      localStorage.getItem("visitedCourses") || "[]"
    ) as string[];

    if (visited.includes(slug)) return "Continue Learning";
    return "Start Learning";
  };

  /* ===================== Lifecycle ===================== */

  // Load user, studentType, enrolled courses from API
  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) {
      router.push("/");
      return;
    }
    const user = JSON.parse(raw);
    setStudentName(user.name || "Student");
    setStudentEmail(user.email || "");

    // fetch student type and assigned (paid) courses
    fetch("/api/student/me", {
      headers: { "x-user-email": user.email },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.student_type) setStudentType(data.student_type);
      })
      .catch((err) => console.error("Student fetch error:", err));

    // server-backed "my courses" (assigned courses)
    fetch("/api/student/course", {
      headers: { "x-user-email": user.email },
    })
      .then((res) => res.json())
      .then((data) => {
        // ensure consistent shape
        setMyCourses(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("My courses fetch error:", err);
        setMyCourses([]);
      });
  }, [router]);

  // Load all courses list + local enrolled/visited caches
  useEffect(() => {
    fetch("/api/courses")
      .then((res) => res.json())
      .then((data) => setAllCourses(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("All courses fetch error:", err);
        setAllCourses([]);
      })
      .finally(() => setLoading(false));

    // load local enrolled (persisted client-side enrollment)
    const savedEnrolled = JSON.parse(
      localStorage.getItem("local_enrolled") || "[]"
    ) as string[];
    setLocalEnrolled(Array.isArray(savedEnrolled) ? savedEnrolled : []);
  }, []);

  const courses = activeTab === "my"
    ? studentType === "free" ? [] : myCourses
    : allCourses;

  /* ===================== Enrollment Helpers ===================== */

  // Persist local enrollment (this is client-side only; swap with real API later)
  const persistLocalEnroll = (slug: string) => {
    const next = Array.from(new Set([...localEnrolled, slug]));
    setLocalEnrolled(next);
    localStorage.setItem("local_enrolled", JSON.stringify(next));
  };

  // When user clicks "Enroll Now"
  const handleEnrollNow = async (slug: string) => {
    // If paid user, you'd normally call your enroll API here.
    // For now we persist locally so UI updates immediately.
    persistLocalEnroll(slug);

    // Optionally also add to myCourses state to show up in "My Courses" immediately for this session
    // (only if the course exists in allCourses, we copy minimal data)
    const courseObj = allCourses.find((c) => c.course_slug === slug);
    if (courseObj) {
      setMyCourses((prev) => {
        if (prev.some((c) => c.course_slug === slug)) return prev;
        return [...prev, { course_slug: slug, course_title: courseObj.course_title }];
      });
    }
  };

  // Primary action: Start/Continue. If not enrolled and user is paid -> auto-enroll first, then navigate
  const handlePrimaryClick = (slug: string) => {
    const enrolled = isEnrolled(slug);

    if (!enrolled && studentType !== "free") {
      // auto-enroll paid user client-side; replace with API call if you have one
      persistLocalEnroll(slug);

      // add to myCourses state (so My Courses shows it)
      const courseObj = allCourses.find((c) => c.course_slug === slug);
      if (courseObj) {
        setMyCourses((prev) => {
          if (prev.some((c) => c.course_slug === slug)) return prev;
          return [...prev, { course_slug: slug, course_title: courseObj.course_title }];
        });
      }
    }

    // mark as visited (for Start vs Continue text)
    const visited = JSON.parse(localStorage.getItem("visitedCourses") || "[]") as string[];
    if (!visited.includes(slug)) {
      visited.push(slug);
      localStorage.setItem("visitedCourses", JSON.stringify(visited));
    }

    router.push(`/student/course/${slug}`);
  };

  /* ===================== Render ===================== */

  return (
    <main className="min-h-screen bg-[#f8fafc]">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white px-8 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-xl bg-blue-800 flex items-center justify-center text-3xl">👤</div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold">{studentName}</h2>
                <span className="text-xs px-3 py-1 bg-blue-500 rounded-full">{studentType.toUpperCase()}</span>
              </div>
              <p className="text-blue-200 mt-1">{studentEmail}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6">
            <div className="bg-blue-800/40 px-6 py-4 rounded-xl text-center min-w-[120px]">
              <div className="text-sm text-blue-200">ALL COURSES</div>
              <div className="text-2xl font-bold">{allCourses.length}</div>
            </div>
            <div className="bg-blue-800/40 px-6 py-4 rounded-xl text-center min-w-[120px]">
              <div className="text-sm text-blue-200">ENROLLED</div>
              <div className="text-2xl font-bold">{(myCourses.length + localEnrolled.length)}</div>
            </div>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem("user");
              router.push("/");
            }}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* DASHBOARD */}
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-4xl font-black text-slate-900 mb-6">Learning Dashboard</h1>

        {/* TABS */}
        <div className="flex gap-4 mb-10">
          <button
            onClick={() => setActiveTab("my")}
            className={`px-6 py-2 rounded-xl font-semibold transition ${activeTab === "my"
              ? "bg-blue-600 text-white"
              : "bg-white border text-slate-600"}`}
          >
            My Courses
          </button>

          <button
            onClick={() => setActiveTab("all")}
            className={`px-6 py-2 rounded-xl font-semibold transition ${activeTab === "all"
              ? "bg-blue-600 text-white"
              : "bg-white border text-slate-600"}`}
          >
            All Courses
          </button>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="text-gray-500">Loading courses...</div>
        ) : activeTab === "my" && (studentType === "free" || myCourses.length === 0) ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No Courses Assigned</h3>
            <p className="text-slate-500">Your learning journey hasn't started yet. Once a course is assigned to you, it will appear here.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => {
              const enrolled = isEnrolled(course.course_slug);

              return (
                <div key={course.course_slug} className="group bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition overflow-hidden flex flex-col">

                  {/* Card top */}
                  <div className="h-44 bg-slate-900 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/40 to-black/70"></div>
                    <BookOpen className="w-8 h-8 text-white relative z-10" />
                  </div>

                  {/* Card body */}
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-slate-800 mb-3 group-hover:text-blue-600 transition">
                      {course.course_title}
                    </h3>

                    {/* Row: Enrolled badge OR Enroll Now button */}
                    <div className="flex items-center gap-3 mb-4">
                      {enrolled ? (
                        <div className="text-sm text-slate-600 font-medium">Enrolled</div> // plain text as requested
                      ) : (
                        <button
                          onClick={() => handleEnrollNow(course.course_slug)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 transition"
                        >
                          Enroll Now
                        </button>
                      )}
                      {/* Optionally show small metadata or tag */}
                      <div className="text-xs text-slate-400 ml-auto">{/* placeholder for duration/batch etc. */}</div>
                    </div>

                    <div className="mt-auto flex items-center gap-3">
                      {/* Primary action button (Start/Continue) */}
                      <button
                        onClick={() => handlePrimaryClick(course.course_slug)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition"
                      >
                        {getButtonText(course.course_slug)}
                        <ArrowRight size={16} />
                      </button>

                      {/* If not enrolled, optionally show a secondary lighter CTA (duplicate of Enroll) */}
                      {!enrolled && (
                        <button
                          onClick={() => handleEnrollNow(course.course_slug)}
                          className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition"
                        >
                          Enroll
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}