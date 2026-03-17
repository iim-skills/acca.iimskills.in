"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ArrowRight,
  LogOut,
  GraduationCap,
  Award,
} from "lucide-react";

/* ================= TYPES ================= */
type Course = {
  course_slug: string;
  course_title: string;
};

/* ================= COURSE CONFIG (keys match API full slugs) ================= */
const courseMeta: Record<
  string,
  { fee: number; description: string; enrollUrl: string }
> = {
  "acca-applied-knowledge": {
    fee: 49900,
    description: "Learn fundamentals of accounting, business & finance.",
    enrollUrl: "/enroll?course=aak&type=expert",
  },
  "acca-applied-skills-level": {
    fee: 149900,
    description: "Build strong accounting, taxation & audit skills.",
    enrollUrl: "/enroll?course=aas&type=expert",
  },
  "acca-professional-level": {
    fee: 99900,
    description:
      "Advanced strategic professional level with case studies.",
    enrollUrl: "/enroll?course=asp&type=expert",
  },
};

export default function StudentPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"my" | "all">("my");
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [studentName, setStudentName] = useState("Student");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentType, setStudentType] = useState("user");
  const [loading, setLoading] = useState(true);

  /* ================= HELPERS ================= */
  const isEnrolled = (slug: string) =>
    myCourses.some((c) => c.course_slug === slug);

  const getButtonText = (slug: string) => {
    if (typeof window === "undefined") return "Start Learning";
    const visited = JSON.parse(
      localStorage.getItem("visitedCourses") || "[]"
    );
    return visited.includes(slug) ? "Continue Learning" : "Start Learning";
  };

  /* ================= FETCH ================= */
  useEffect(() => {
    const raw = localStorage.getItem("user");

    if (!raw) {
      router.push("/");
      return;
    }

    const user = JSON.parse(raw);

    setStudentName(user.name);
    setStudentEmail(user.email);
    setStudentType(user.type || "user");

    fetch("/api/student/course", {
      headers: { "x-user-email": user.email },
    })
      .then((res) => res.json())
      .then((data) => setMyCourses(data || []));

    fetch("/api/courses")
      .then((res) => res.json())
      .then((data) => setAllCourses(data || []))
      .finally(() => setLoading(false));
  }, [router]);

  const courses = activeTab === "my" ? myCourses : allCourses;

  /* ================= ACTION ================= */
  const handleStart = (slug: string) => {
    const visited = JSON.parse(
      localStorage.getItem("visitedCourses") || "[]"
    );

    if (!visited.includes(slug)) {
      visited.push(slug);
      localStorage.setItem("visitedCourses", JSON.stringify(visited));
    }

    router.push(`/student/course/${encodeURIComponent(slug)}`);
  };

  /* ================= UI ================= */
  return (
    <main className="min-h-screen bg-[#FDFDFE] text-slate-800">
      {/* HERO */}
      <div className="relative pt-16 pb-20 px-6 sm:px-10 bg-[#1c398e] bg-cover bg-center border-b border-slate-100">
        {/* <div className="absolute inset-0 bg-black opacity-70" /> */}

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl p-10 shadow-xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6 flex-col md:flex-row text-center md:text-left">
                <div className="relative">
                  <div className="w-24 h-24 rounded-3xl bg-blue-900 flex items-center justify-center text-white">
                    <GraduationCap size={48} />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-amber-400 text-white p-2 rounded-xl">
                    <Award size={18} />
                  </div>
                </div>

                <div>
                  <h2 className="text-3xl font-bold">{studentName}</h2>
                  <p className="text-slate-600">{studentEmail}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  localStorage.removeItem("user");
                  router.push("/");
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl border hover:text-red-500"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-6 -mt-10">
        {/* TABS */}
        <div className="flex gap-4 mb-10 relative w-max bg-white px-5 py-3 rounded">
          <button
            onClick={() => setActiveTab("my")}
            className={`px-6 py-3 rounded-xl ${
              activeTab === "my" ? "bg-blue-900 text-white" : "bg-white border"
            }`}
          >
            My Courses
          </button>

          <button
            onClick={() => setActiveTab("all")}
            className={`px-6 py-3 rounded-xl ${
              activeTab === "all" ? "bg-blue-900 text-white" : "bg-white border"
            }`}
          >
            Explore
          </button>
        </div>

        {/* GRID */}
        {loading ? (
          <div className="text-center py-20">Loading...</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
            {courses.map((course) => {
              /* 🔥 Use the full API slug (lowercased & trimmed) to look up meta */
              const processedSlug = course.course_slug?.toLowerCase().trim();
              const meta = courseMeta[processedSlug as keyof typeof courseMeta];

              // ===== DEBUG LOGS =====
              console.log("-------- COURSE DEBUG --------");
              console.log("Raw Slug:", course.course_slug);
              console.log("Processed Slug:", processedSlug);
              console.log("Meta Found:", meta);
              console.log("Available Keys:", Object.keys(courseMeta));
              if (!meta) {
                console.warn("❌ No meta found for slug:", processedSlug, "raw:", course.course_slug);
              }
              console.log("-----------------------------");
              // ======================

              const enrolled = isEnrolled(course.course_slug);

              return (
                <div
                  key={course.course_slug}
                  className="bg-white rounded-3xl border overflow-hidden flex flex-col"
                >
                  {/* HEADER */}
                  <div className="h-40 bg-slate-50 flex flex-col items-center justify-center">
                    <BookOpen className="text-indigo-500 mb-2" />
                    <h3 className="font-bold text-lg text-center px-4">
                      {course.course_title}
                    </h3>
                  </div>

                  {/* BODY */}
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex justify-between mb-3">
                      <p className="font-bold text-lg">
                        ₹{meta?.fee?.toLocaleString() || "N/A"}
                      </p>

                      {enrolled && (
                        <span className="text-xs text-green-600">ENROLLED</span>
                      )}
                    </div>

                    <p className="text-sm text-slate-600 mb-6">
                      {meta?.description || "Learn industry-ready skills."}
                    </p>

                    <div className="mt-auto">
                      {enrolled ? (
                        <button
                          onClick={() => handleStart(course.course_slug)}
                          className="w-full bg-indigo-600 text-white py-3 rounded-xl flex justify-center items-center gap-2"
                        >
                          {getButtonText(course.course_slug)}
                          <ArrowRight size={16} />
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStart(course.course_slug)}
                            className="flex-1 bg-gray-100 py-3 rounded-xl"
                          >
                            Explore
                          </button>

                          <button
                            onClick={() =>
                              router.push(meta?.enrollUrl || "/enroll")
                            }
                            className="flex-1 bg-cyan-500 text-white py-3 rounded-xl"
                          >
                            Enroll Now
                          </button>
                        </div>
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