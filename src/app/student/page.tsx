"use client";

import React, { useEffect, useState } from "react";
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
  UserCircle,
  Bell,
  MoreVertical,
  Calendar,
  MessageSquare,
  Zap,
  PlayCircle
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

/* ================= MOCK ROUTER ================= */
const useRouter = () => {
  return {
    push: (url: string) => {
      console.log("Navigating to:", url);
      window.location.href = url;
    },
  };
};

/* ================= COURSE CONFIG ================= */
const courseMeta: Record<
  string,
  { fee: number; description: string; enrollUrl: string; color: string }
> = {
  "acca-applied-knowledge": {
    fee: 49900,
    description: "Learn fundamentals of accounting, business & finance.",
    enrollUrl: "/enroll?course=aak&type=expert",
    color: "bg-blue-500",
  },
  "acca-applied-skills-level": {
    fee: 149900,
    description: "Build strong accounting, taxation & audit skills.",
    enrollUrl: "/enroll?course=aas&type=expert",
    color: "bg-purple-500",
  },
  "acca-professional-level": {
    fee: 99900,
    description: "Advanced strategic professional level with case studies.",
    enrollUrl: "/enroll?course=asp&type=expert",
    color: "bg-pink-500",
  },
};

export default function StudentPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"my" | "all">("my");
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [studentName, setStudentName] = useState("Student");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
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

  const getChartProgress = (course: Course) => {
    const directProgress =
      typeof course.progress === "number" ? course.progress : 0;

    const moduleProgress =
      course.total_modules && course.total_modules > 0
        ? Math.round(
            ((course.completed_modules || 0) / course.total_modules) * 100
          )
        : 0;

    const value = directProgress > 0 ? directProgress : moduleProgress;

    return Math.max(8, Math.min(100, value));
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
    setStudentPhone(user.phone || user.mobile || user.phone_number || "N/A");
    setStudentType(user.type || "user");

    // Fetching Original Data
    fetch("/api/student/course", {
      headers: { "x-user-email": user.email },
    })
      .then((res) => res.json())
      .then((data) => {
        // 🔥 LOGGING STUDENT COURSE DATA
        console.log("-----------------------------------------");
        console.log("API FETCH: /api/student/course");
        console.log("FOR EMAIL:", user.email);
        console.log("RECEIVED DATA:", data);
        console.log("-----------------------------------------");
        setMyCourses(data || []);
      })
      .catch((err) => {
        console.error("ERROR FETCHING STUDENT COURSES:", err);
        setMyCourses([]);
      });

    fetch("/api/courses")
      .then((res) => res.json())
      .then((data) => {
        // 🔥 LOGGING ALL COURSES DATA
        console.log("-----------------------------------------");
        console.log("API FETCH: /api/courses");
        console.log("RECEIVED DATA:", data);
        console.log("-----------------------------------------");
        setAllCourses(data || []);
      })
      .catch((err) => {
        console.error("ERROR FETCHING COURSE CATALOG:", err);
        setAllCourses([]);
      })
      .finally(() => setLoading(false));
  }, []);

  /* ================= CALCULATED STATS ================= */
  const totalModules = myCourses.reduce((acc, curr) => acc + (curr.total_modules || 0), 0);
  const completedModules = myCourses.reduce((acc, curr) => acc + (curr.completed_modules || 0), 0);
  const averageProgress = myCourses.length > 0 
    ? Math.round(myCourses.reduce((acc, curr) => acc + (curr.progress || 0), 0) / myCourses.length) 
    : 0;

  // Identify most recently accessed course for the "Feature Card"
  const recentCourse = [...myCourses].sort((a, b) => 
    new Date(b.last_accessed || 0).getTime() - new Date(a.last_accessed || 0).getTime()
  )[0];

  const courses = activeTab === "my" ? myCourses : allCourses;

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

  return (
    <div className="min-h-screen bg-[#F1F3F9] flex gap-6 font-sans">
      
      
      {/* SIDEBAR - LEFT PANEL (Based on unique image style) */}
      <aside className="hidden lg:flex flex-col w-[300px] bg-[#0F172A] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="z-10 h-full flex flex-col">
          <div className="flex items-center gap-2 mb-10">
            <span className="text-2xl">😍</span>
            <div>
              <p className="text-indigo-200 text-xs font-medium opacity-70">Welcome</p>
              <h1 className="text-xl font-bold">{studentName}</h1>
              <p className="text-indigo-200 text-xs font-medium">{studentEmail}</p>
            </div>
          </div>

          {/* DYNAMIC STATS FROM API */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="bg-white/10 backdrop-blur-md rounded-[24px] p-5 flex flex-col gap-1 border border-white/5">
              <div className="w-8 h-8 rounded-lg bg-orange-400/20 flex items-center justify-center text-orange-400 mb-1">
                <BookOpen size={16} />
              </div>
              <p className="text-xl font-black">{myCourses.length}</p>
              <p className="text-[9px] text-indigo-200 uppercase font-bold tracking-widest">Courses</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-[24px] p-5 flex flex-col gap-1 border border-white/5">
              <div className="w-8 h-8 rounded-lg bg-pink-400/20 flex items-center justify-center text-pink-400 mb-1">
                <Award size={16} />
              </div>
              <p className="text-xl font-black">{completedModules}</p>
              <p className="text-[9px] text-indigo-200 uppercase font-bold tracking-widest">Modules</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-[24px] p-5 flex flex-col gap-1 border border-white/5">
              <div className="w-8 h-8 rounded-lg bg-cyan-400/20 flex items-center justify-center text-cyan-400 mb-1">
                <Zap size={16} />
              </div>
              <p className="text-xl font-black">{averageProgress}%</p>
              <p className="text-[9px] text-indigo-200 uppercase font-bold tracking-widest">Progress</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-[24px] p-5 flex flex-col gap-1 border border-white/5">
              <div className="w-8 h-8 rounded-lg bg-green-400/20 flex items-center justify-center text-green-400 mb-1">
                <CheckCircle size={16} />
              </div>
              <p className="text-xl font-black">{totalModules}</p>
              <p className="text-[9px] text-indigo-200 uppercase font-bold tracking-widest">Total</p>
            </div>
          </div>

          {/* ACTIVE TRACKS (Based on Original Data) */}
          <div className="mt-6">
            <h3 className="font-bold text-sm text-indigo-100 uppercase tracking-widest mb-6 opacity-60">Active Tracks</h3>
            <div className="space-y-5">
              {myCourses.slice(0, 3).map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${courseMeta[c.course_slug]?.color || 'bg-indigo-400'} flex items-center justify-center text-white shadow-lg`}>
                    <PlayCircle size={18} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-bold truncate">{c.course_title}</p>
                    <p className="text-[9px] text-indigo-300 font-bold">{c.progress}% Completed</p>
                  </div>
                </div>
              ))}
              {myCourses.length === 0 && <p className="text-xs text-indigo-300 italic">No active enrollments</p>}
            </div>
          </div>
          
          <div className="mt-auto pt-8 border-t border-white/10">
            <button 
              onClick={() => { localStorage.removeItem("user"); router.push("/"); }}
              className="flex items-center gap-3 text-indigo-300 hover:text-white transition-colors text-sm font-bold"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>
        
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-400/10 blur-3xl rounded-full translate-x-10 -translate-y-10"></div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col gap-6 p-6 overflow-hidden">
        
        {/* HEADER */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-full shadow-sm border border-slate-100">
            <Search className="text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search your records..." 
              className="bg-transparent border-none outline-none text-sm w-48 lg:w-64 font-medium"
            />
          </div>

          
        </header>

        {/* WIDGETS */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* ACTIVITY CHART - BASED ON ORIGINAL COURSE DATA */}
            <div className="xl:col-span-2 bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-extrabold text-slate-800 tracking-tight">Your Course Progress</h3>
                <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                  <span className="px-4 py-1.5 text-[10px] font-black rounded-xl bg-white shadow-sm text-[#3B38A4] uppercase">Live Data</span>
                </div>
              </div>
              
              <div className="flex items-end justify-around h-[260px] px-4 gap-4">
                {myCourses.length > 0 ? (
                  myCourses.map((c, i) => {
                    const chartProgress = getChartProgress(c);
                    const barHeight = `${chartProgress}%`;
                    const barColor =
                      courseMeta[c.course_slug]?.color || "bg-[#3B38A4]";

                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                        <div className="relative w-full flex items-end justify-center h-[220px]">
                          <div
                            className={`w-full max-w-[52px] ${barColor} rounded-t-2xl rounded-b-lg transition-all duration-700 opacity-90 group-hover:opacity-100 shadow-lg`}
                            style={{ height: barHeight, minHeight: "14px" }}
                          >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {chartProgress}%
                            </div>
                          </div>
                        </div>

                        <span className="text-[9px] font-black text-slate-400 truncate w-full text-center uppercase tracking-tighter">
                          {c.course_title.split(" ")[0]}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full text-slate-300">
                    <BookOpen size={48} className="mb-4 opacity-10" />
                    <p className="text-sm font-bold opacity-30">No enrollment data to graph</p>
                  </div>
                )}
              </div>
            </div>

            {/* FEATURED CONTINUE CARD - BASED ON last_accessed */}
            <div className="bg-[#E4E9FF] rounded-[40px] p-8 relative overflow-hidden flex flex-col border border-indigo-100">
              <div className="inline-block bg-[#FF8A9A] text-white text-[10px] font-black px-4 py-1.5 rounded-full mb-6 self-start uppercase tracking-widest shadow-md">
                Resume Learning
              </div>
              
              {recentCourse ? (
                <>
                  <p className="text-4xl font-black text-[#3B38A4] mb-2 leading-none">
                    {recentCourse.progress}%<span className="text-lg opacity-50 ml-1">Done</span>
                  </p>
                  <h4 className="text-xl font-bold text-[#3B38A4] mt-4 mb-4 leading-tight">{recentCourse.course_title}</h4>
                  <p className="text-sm text-indigo-400 font-bold mb-6">Last accessed: {new Date(recentCourse.last_accessed || "").toLocaleDateString()}</p>
                  
                  <div className="mt-auto">
                    <button 
                      onClick={() => handleStart(recentCourse.course_slug)}
                      className="w-full bg-[#3B38A4] text-white py-4 rounded-3xl shadow-xl shadow-indigo-200 font-black text-sm flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform"
                    >
                      Continue Now
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col justify-center items-center text-center">
                   <p className="text-[#3B38A4] font-black text-lg mb-4">Start Your Journey</p>
                   <button 
                    onClick={() => setActiveTab('all')}
                    className="bg-[#3B38A4] text-white px-8 py-3 rounded-2xl font-bold"
                   >
                     Browse All
                   </button>
                </div>
              )}

              <div className="absolute top-4 right-4 w-24 h-24 opacity-5 pointer-events-none">
                <GraduationCap size={96} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-12">
            {/* COURSE LIST WITH ORIGINAL DATA */}
            <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-extrabold text-slate-800 tracking-tight">Your Original Enrollment</h3>
                <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
                  <button 
                    onClick={() => setActiveTab('my')}
                    className={`px-5 py-2 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${activeTab === 'my' ? 'bg-white shadow-md text-[#3B38A4]' : 'text-slate-400'}`}
                  >
                    My Tracks
                  </button>
                  <button 
                    onClick={() => setActiveTab('all')}
                    className={`px-5 py-2 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${activeTab === 'all' ? 'bg-white shadow-md text-[#3B38A4]' : 'text-slate-400'}`}
                  >
                    Explore
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {loading ? (
                  <div className="text-center py-10 animate-pulse text-slate-300 font-black tracking-[0.2em]">FETCHING API RECORDS...</div>
                ) : courses.length > 0 ? (
                  courses.map((course) => {
                    const processedSlug = course.course_slug?.toLowerCase().trim();
                    const meta = courseMeta[processedSlug] || { color: "bg-slate-200" };
                    const progress = course.progress || 0;
                    
                    return (
                      <div key={course.course_slug} className="flex items-center gap-5 group cursor-pointer" onClick={() => handleStart(course.course_slug)}>
                        <div className={`w-14 h-14 rounded-2xl ${meta.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                          <BookOpen size={24} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <h4 className="text-sm font-black text-slate-800 truncate">{course.course_title}</h4>
                          <div className="flex items-center gap-3 mt-1.5">
                             <span className="text-[10px] text-slate-400 font-black uppercase">
                                {course.completed_modules || 0}/{course.total_modules || 0} Modules
                             </span>
                             <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                             <span className={`text-[9px] font-black uppercase ${progress === 100 ? 'text-green-500' : 'text-[#FF8A9A]'}`}>
                                {progress === 100 ? "Verified Done" : "In Progress"}
                             </span>
                          </div>
                        </div>
                        <div className="relative w-14 h-14 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="28" cy="28" r="22" fill="none" stroke="#F1F3F9" strokeWidth="5" />
                            <circle cx="28" cy="28" r="22" fill="none" stroke={meta.color.replace('bg-', '') === 'blue-500' ? '#3b82f6' : (meta.color.replace('bg-', '') === 'purple-500' ? '#a855f7' : '#ec4899')} strokeWidth="5" 
                              strokeDasharray={138.2} 
                              strokeDashoffset={138.2 - (138.2 * progress) / 100}
                              strokeLinecap="round"
                              className="transition-all duration-1000 ease-out"
                            />
                          </svg>
                          <span className="absolute text-[10px] font-black">{progress}%</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                     <p className="text-slate-400 text-xs font-bold italic">No records found for current student</p>
                  </div>
                )}
              </div>
            </div>

            {/* TRACKING TIMELINE - BASED ON PRESENT COURSE TITLES */}
            <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-10">
                <h3 className="font-extrabold text-slate-800 tracking-tight">Access Log</h3>
                <Clock size={18} className="text-[#3B38A4] opacity-40" />
              </div>

              <div className="relative flex flex-col gap-8">
                {myCourses.length > 0 ? myCourses.slice(0, 4).map((c, i) => {
                   return (
                    <div key={i} className="flex items-start gap-6 group">
                      <div className="w-12 pt-1 flex flex-col items-end">
                         <span className="text-[10px] font-black text-slate-900 leading-none">Recent</span>
                         <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Access</span>
                      </div>
                      <div className="flex-1 h-[1px] bg-slate-100 mt-3 relative">
                        <div 
                          className={`absolute top-[-14px] left-0 ${courseMeta[c.course_slug]?.color || 'bg-indigo-500'} text-white px-5 py-2.5 rounded-2xl text-[10px] font-black shadow-lg shadow-indigo-100 flex items-center justify-between w-[90%] group-hover:w-full transition-all`}
                        >
                          <span className="truncate pr-4">{c.course_title}</span>
                          <ChevronRight size={14} className="flex-shrink-0" />
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="py-12 text-center text-slate-300 font-bold italic text-xs">
                    No access logs available
                  </div>
                )}
                <div className="absolute left-[64px] top-0 bottom-0 w-[1px] bg-slate-100 opacity-50"></div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}