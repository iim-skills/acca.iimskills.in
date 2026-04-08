"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import BookingApp from "@/components/MentorsMeetForm";
import {
  BookOpen,
  ArrowRight,
  LogOut,
  GraduationCap,
  Award,
  Search,
  LayoutDashboard,
  Compass,
  CheckCircle,
  Clock,
  ChevronRight,
  Bell,
  Zap,
  Globe,
} from "lucide-react";

/* ================= TYPES ================= */
type Course = {
  course_slug: string;
  course_title: string;
  total_modules?: number;
  completed_modules?: number;
  progress?: number;
  last_accessed?: string;
};

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  created_at?: string;
};

/* ================= COURSE CONFIG ================= */
const courseMeta: Record<
  string,
  { fee: number; description: string; enrollUrl: string; color: string; gradient: string }
> = {
  "acca-applied-knowledge": {
    fee: 49900,
    description: "Learn fundamentals of accounting, business & finance.",
    enrollUrl: "/enroll?course=aak&type=expert",
    color: "bg-blue-600",
    gradient: "from-blue-600 to-indigo-700",
  },
  "acca-applied-skills-level": {
    fee: 149900,
    description: "Build strong accounting, taxation & audit skills.",
    enrollUrl: "/enroll?course=aas&type=expert",
    color: "bg-purple-600",
    gradient: "from-purple-600 to-fuchsia-700",
  },
  "acca-professional-level": {
    fee: 99900,
    description: "Advanced strategic professional level with case studies.",
    enrollUrl: "/enroll?course=asp&type=expert",
    color: "bg-pink-600",
    gradient: "from-pink-600 to-rose-700",
  },
};

const NOTIFICATION_SEEN_KEY = "student_seen_notifications";

export default function StudentPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"my" | "all">("my");
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [studentName, setStudentName] = useState("Student");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentType, setStudentType] = useState<"free" | "paid">("free");
  const [loading, setLoading] = useState(true);
  const [meetModalOpen, setMeetModalOpen] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  /* ================= HELPERS ================= */
  const getChartProgress = (course: Course) => {
    const directProgress = typeof course.progress === "number" ? course.progress : 0;
    const moduleProgress =
      course.total_modules && course.total_modules > 0
        ? Math.round(((course.completed_modules || 0) / course.total_modules) * 100)
        : 0;
    const value = directProgress > 0 ? directProgress : moduleProgress;
    return Math.max(5, Math.min(100, value));
  };

  const getSeenNotificationIds = () => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(NOTIFICATION_SEEN_KEY);
      return raw ? (JSON.parse(raw) as number[]) : [];
    } catch {
      return [];
    }
  };

  const saveSeenNotificationIds = (ids: number[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(NOTIFICATION_SEEN_KEY, JSON.stringify(Array.from(new Set(ids))));
  };

  const refreshUnreadCount = (items: NotificationItem[]) => {
    const seenIds = getSeenNotificationIds();
    const unread = items.filter((item) => !seenIds.includes(item.id)).length;
    setUnreadCount(unread);
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/student/notifications", {
        cache: "no-store",
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setNotifications(list);
      refreshUnreadCount(list);
    } catch (error) {
      console.error("ERROR FETCHING NOTIFICATIONS:", error);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const handleBellClick = () => {
    setShowNotifications((prev) => {
      const next = !prev;

      if (!prev) {
        const ids = notifications.map((item) => item.id);
        const seenIds = getSeenNotificationIds();
        saveSeenNotificationIds([...seenIds, ...ids]);
        setUnreadCount(0);
      }

      return next;
    });
  };

  const handleCloseNotifications = () => {
    setShowNotifications(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("visitedCourses");
    localStorage.removeItem(NOTIFICATION_SEEN_KEY);

    // Full reload is the most reliable logout method
    window.location.href = "/";
  };

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    const raw = localStorage.getItem("user");

    if (!raw) {
      window.location.href = "/";
      return;
    }

    try {
      const user = JSON.parse(raw);

      setStudentName(user.name || "Student");
      setStudentEmail(user.email || "");

      const rawType = user.studentType || user.student_type || user.type || "";
      const normalizedType = rawType.toString().toLowerCase().trim();
      setStudentType(normalizedType === "paid" ? "paid" : "free");

      fetch("/api/student/course", {
        headers: { "x-user-email": user.email },
      })
        .then((res) => res.json())
        .then((data) => {
          setMyCourses(data || []);
        })
        .catch((err) => {
          console.error("ERROR FETCHING STUDENT COURSES:", err);
          setMyCourses([]);
        });

      fetch("/api/courses")
        .then((res) => res.json())
        .then((data) => {
          setAllCourses(data || []);
        })
        .catch((err) => {
          console.error("ERROR FETCHING COURSE CATALOG:", err);
          setAllCourses([]);
        })
        .finally(() => setLoading(false));

      fetchNotifications();

      interval = setInterval(() => {
        fetchNotifications();
      }, 20000);
    } catch (error) {
      console.error("INVALID USER DATA:", error);
      window.location.href = "/";
      return;
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [router]);

  /* ================= CALCULATED STATS ================= */
  const completedModules = myCourses.reduce((acc, curr) => acc + (curr.completed_modules || 0), 0);
  const averageProgress =
    myCourses.length > 0
      ? Math.round(myCourses.reduce((acc, curr) => acc + getChartProgress(curr), 0) / myCourses.length)
      : 0;

  const handleStart = (slug: string) => {
    const visited = JSON.parse(localStorage.getItem("visitedCourses") || "[]");
    if (!visited.includes(slug)) {
      visited.push(slug);
      localStorage.setItem("visitedCourses", JSON.stringify(visited));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-80 bg-slate-950 p-8 text-white sticky top-0 shadow-2xl">
        <div className="absolute inset-0 z-0">
          {/* Soft Radial Center Light */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(51,65,85,0.4)_0%,transparent_70%)]" />

          {/* Very Subtle Slate Grid */}
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)",
              backgroundSize: "50px 50px",
            }}
          />
        </div>
        <div className="mb-12 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <GraduationCap size={24} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Student<span className="text-indigo-400">Portal</span>
          </span>
        </div>

        <nav className="flex-1 space-y-2">
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-4 px-2">
            Dashboard
          </div>
          <button
            onClick={() => setActiveTab("all")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === "all"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Compass size={20} />
            <span className="font-semibold text-sm">Explore All</span>
          </button>
          <button
            onClick={() => setActiveTab("my")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === "my"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <LayoutDashboard size={20} />
            <span className="font-semibold text-sm">Enrolled Courses</span>
          </button>
        </nav>

        <div className="mt-8 space-y-3">
          {studentType === "paid" ? (
            <button
              onClick={() => setMeetModalOpen(true)}
              className="w-full flex items-center justify-between gap-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 hover:text-white transition-all px-4 py-3 rounded-2xl group"
            >
              <div className="flex items-center gap-2">
                <Compass size={16} className="text-indigo-400" />
                <div className="text-left">
                  <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                    Support
                  </p>
                  <p className="text-sm font-bold text-white leading-none">
                    Book A Meet with Mentors
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <button
              onClick={() => router.push("/enroll?type=expert")}
              className="w-full flex items-center justify-between gap-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-white transition-all px-4 py-3 rounded-2xl group"
            >
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-amber-400" />
                <div className="text-left">
                  <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                    Access
                  </p>
                  <p className="text-sm font-bold text-white leading-none">
                    Upgrade Your Access
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>

        <div className="mt-auto pt-8 border-t border-white/5">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/30">
              {studentName.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{studentName}</p>
              <p className="text-[10px] text-slate-500 truncate">{studentEmail}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-50 text-rose-500 hover:text-white transition-all py-3 rounded-xl text-xs font-bold border border-rose-500/20"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto h-screen p-6 lg:p-10 space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Welcome, {studentName.split(" ")[0]}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search records..."
                className="bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-6 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none w-full md:w-64 transition-all shadow-sm"
              />
            </div>

            <div className="relative">
              <button
                onClick={handleBellClick}
                className="relative w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 hover:bg-slate-50 shadow-sm transition-all"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <h4 className="text-sm font-bold text-slate-800">Notifications</h4>
                    <button
                      onClick={handleCloseNotifications}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                    >
                      Close
                    </button>
                  </div>

                  <div className="max-h-[50%] overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          className="px-4 py-3 border-b border-slate-50 last:border-b-0 hover:bg-slate-50 transition-colors"
                        >
                          <p className="text-sm font-bold text-slate-900">{item.title}</p>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.message}</p>
                          {item.created_at && (
                            <p className="text-[10px] text-slate-400 mt-2">
                              {new Date(item.created_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-10 text-center text-sm text-slate-500">
                        No notifications found.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-200/50 p-1.5 rounded-2xl w-fit shadow-inner">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all ${
              activeTab === "all" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Globe size={14} className={activeTab === "all" ? "text-blue-500" : ""} />
            All Courses
          </button>
          <button
            onClick={() => setActiveTab("my")}
            className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all ${
              activeTab === "my" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Zap size={14} className={activeTab === "my" ? "text-amber-500" : ""} />
            Enrolled Courses
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-300 gap-4 animate-pulse">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="font-bold text-xs uppercase tracking-widest">Fetching Records...</p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === "my" ? (
              <section>
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-slate-800">Your Current Progress</h3>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {myCourses.length} Enrolled
                  </div>
                </div>

                {myCourses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {myCourses.map((course) => {
                      const progress = getChartProgress(course);
                      const meta = courseMeta[course.course_slug?.toLowerCase().trim()] || {
                        gradient: "from-slate-400 to-slate-600",
                        color: "bg-slate-500",
                      };

                      return (
                        <Link
                          key={course.course_slug}
                          href={`/student/course/${encodeURIComponent(course.course_slug)}`}
                          onClick={() => handleStart(course.course_slug)}
                          className="group bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-pointer relative overflow-hidden block"
                        >
                          <div className="flex items-start justify-between mb-8">
                            <div
                              className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-500`}
                            >
                              <BookOpen size={24} />
                            </div>
                            <div className="relative w-16 h-16 flex items-center justify-center">
                              <svg className="w-full h-full transform -rotate-90">
                                <circle cx="32" cy="32" r="28" fill="none" stroke="#F1F5F9" strokeWidth="4" />
                                <circle
                                  cx="32"
                                  cy="32"
                                  r="28"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                  strokeDasharray={175.9}
                                  strokeDashoffset={175.9 - (175.9 * progress) / 100}
                                  strokeLinecap="round"
                                  className="transition-all duration-1000 ease-out text-indigo-500"
                                />
                              </svg>
                              <span className="absolute text-[11px] font-black">{progress}%</span>
                            </div>
                          </div>

                          <h4 className="text-lg font-bold text-slate-900 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">
                            {course.course_title}
                          </h4>

                          <div className="flex items-center gap-3 mt-6 pt-6 border-t border-slate-50">
                            <span className="text-[10px] font-black text-slate-400 uppercase">
                              {course.completed_modules || 0}/{course.total_modules || 0} Modules
                            </span>
                            <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                            <span
                              className={`text-[10px] font-black uppercase ${
                                progress === 100 ? "text-emerald-500" : "text-amber-500"
                              }`}
                            >
                              {progress === 100 ? "Completed" : "Active"}
                            </span>
                          </div>

                          <div className="mt-8 flex items-center justify-between text-slate-400 text-[10px] font-bold">
                            <div className="flex items-center gap-1.5">
                              <Clock size={12} />
                              {course.last_accessed ? new Date(course.last_accessed).toLocaleDateString() : "Never"}
                            </div>
                            <div className="flex items-center gap-1 text-indigo-500 group-hover:translate-x-1 transition-transform">
                              Continue <ChevronRight size={12} />
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] p-16 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                      <BookOpen size={32} />
                    </div>
                    <h4 className="text-lg font-bold text-slate-800 italic">No Enrolled Courses Found</h4>
                    <p className="text-slate-400 mt-2 mb-8 text-sm">
                      Please check the catalog to start your learning journey.
                    </p>
                    <button
                      onClick={() => setActiveTab("all")}
                      className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-600/20"
                    >
                      Browse Catalog
                    </button>
                  </div>
                )}
              </section>
            ) : (
              <section>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">All Available Courses</h3>
                    <p className="text-slate-500 text-sm mt-1">Explore our professional qualification tracks.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {allCourses.map((course) => {
                    const slug = course.course_slug?.toLowerCase().trim();
                    const meta = courseMeta[slug] || {
                      fee: 0,
                      description: "Professional ACCA qualification course.",
                      gradient: "from-slate-400 to-slate-600",
                    };
                    const isEnrolled = myCourses.some((c) => c.course_slug === course.course_slug);

                    return (
                      <div
                        key={course.course_slug}
                        className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 flex flex-col hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group"
                      >
                        <div className={`h-32 bg-gradient-to-br ${meta.gradient} relative p-8 flex items-end overflow-hidden`}>
                          <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md rounded-full px-4 py-1.5 text-[9px] text-white font-black uppercase tracking-widest border border-white/20">
                            Certified
                          </div>
                          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg transform translate-y-12 group-hover:translate-y-10 transition-transform duration-500">
                            <Award className="text-slate-800" size={28} />
                          </div>
                        </div>

                        <div className="p-8 pt-14 flex-1 flex flex-col">
                          <h4 className="text-xl font-black text-slate-900 mb-3 leading-tight group-hover:text-indigo-600 transition-colors">
                            {course.course_title}
                          </h4>
                          <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6 line-clamp-2">
                            {meta.description}
                          </p>

                          <div className="flex items-center gap-2 mb-8">
                            <div className="bg-slate-50 rounded-xl px-4 py-2 text-[10px] font-black text-slate-700 uppercase">
                              Fee: ₹{meta.fee.toLocaleString()}
                            </div>
                            <div className="bg-slate-50 rounded-xl px-4 py-2 text-[10px] font-black text-slate-700 uppercase">
                              12+ Modules
                            </div>
                          </div>

                          {isEnrolled ? (
                            <Link
                              href={`/student/course/${encodeURIComponent(course.course_slug)}`}
                              onClick={() => handleStart(course.course_slug)}
                              className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600"
                            >
                              <CheckCircle size={16} />
                              Currently Learning
                            </Link>
                          ) : (
                            <Link
                              href={`/student/course/${encodeURIComponent(course.course_slug)}`}
                              onClick={() => handleStart(course.course_slug)}
                              className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 bg-slate-900 text-white hover:bg-indigo-600 hover:shadow-xl hover:shadow-indigo-600/20"
                            >
                              View Details
                              <ArrowRight size={16} />
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
            <Modal isOpen={meetModalOpen} onClose={() => setMeetModalOpen(false)}>
              <BookingApp onSuccess={() => setMeetModalOpen(false)} />
            </Modal>
          </div>
        )}
      </main>
    </div>
  );
}