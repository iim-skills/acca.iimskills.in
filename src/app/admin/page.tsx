"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Calendar,
  User2,
  Settings,
  ChevronRight,
  BarChart3,
  Ticket,
  FolderOpen,
  LogOut,
  Video,
  User,
  Menu,
  X,
  Bell,
} from "lucide-react";

import LMSPage from "./StudentLIst";
import DashboardHome from "./components/DashboardHome";
import ProfilePage from "./profile/page";
import BatchPage from "./batches/page";
import Quiz from "./quizzes/page";
import Course from "./course-builder/page";
import StudyMT from "./studyMT/page";
import CouponPage from "./coupons/page";
import MentorsBooking from "./MentorsBooking/page";
import Users from "./users/page";
import Videos from "./videos/page";
import { MdQuiz } from "react-icons/md";
import AdminNotificationPage from "./notifications/page";

/* ================= TYPES ================= */
export interface UserType {
  id: number;
  name: string;
  email?: string;
  role?: string;
}

/* ================= MAIN COMPONENT ================= */
export default function App() {
  const [active, setActive] = useState("dashboard");
  const [user, setUser] = useState<UserType | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const avatarRef = useRef<HTMLDivElement | null>(null);

  /* ---------- LOAD & PROTECT ADMIN ---------- */
  useEffect(() => {
    setLoadingUser(true);

    try {
      const storedRaw = sessionStorage.getItem("user") ?? localStorage.getItem("user");

      if (!storedRaw) {
        const fallback: UserType = {
          id: 1,
          name: "Admin User",
          email: "admin@iimskills.com",
          role: "Super Admin",
        };
        setUser(fallback);
        setLoadingUser(false);
        return;
      }

      const parsed = JSON.parse(storedRaw);

      if (parsed && parsed.loginType && parsed.loginType !== "admin") {
        setUser(null);
        setLoadingUser(false);
        return;
      }

      const mapped: UserType = {
        id: Number(parsed.id),
        name: parsed.name || "Admin User",
        email: parsed.email,
        role: parsed.role || "Admin",
      };

      setUser(mapped);
    } catch (err) {
      console.error("Error parsing stored user:", err);
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  /* ---------- CLOSE PROFILE DROPDOWN ON OUTSIDE CLICK ---------- */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ---------- LOADING STATE ---------- */
  if (loadingUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  /* ---------- NOT AUTHORIZED ---------- */
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 px-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Not authorized</h2>
          <p className="text-sm text-slate-500">No admin user found in session. Please login.</p>
        </div>
      </div>
    );
  }

  /* ---------- TABS ---------- */
  const tabs = [
    { key: "dashboard", name: "Dashboard", icon: <BarChart3 size={20} /> },
    { key: "coupon", name: "Coupons", icon: <Ticket size={20} /> },
    { key: "course", name: "Course", icon: <Ticket size={20} /> },
    { key: "quiz", name: "Quiz", icon: <MdQuiz size={20} /> },
    { key: "studyMT", name: "studyMT", icon: <MdQuiz size={20} /> },
    { key: "lms", name: "Students", icon: <FolderOpen size={20} /> },
    { key: "batch", name: "Batches", icon: <Calendar size={20} /> },
    { key: "notifications", name: "Notifications", icon: <Bell size={20} /> },
    { key: "mentors_booking", name: "Mentors Slots", icon: <User size={20} /> },
    { key: "users", name: "User", icon: <User size={20} /> },
    { key: "videos", name: "Videos", icon: <Video size={20} /> },
  ];

  const activeTabName = tabs.find((t) => t.key === active)?.name || "Dashboard";

  const handleTabChange = (key: string) => {
    setActive(key);
    setSidebarOpen(false);
    setProfileOpen(false);
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden">
      {/* BACKDROP FOR MOBILE SIDEBAR */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed lg:static z-50 top-0 left-0 h-full w-72 bg-[#0F172A] text-white flex flex-col shadow-2xl
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="p-6 lg:p-8 flex-1 overflow-y-auto hide-scrollbar">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                <Settings className="text-white" size={24} />
              </div>
              <h1 className="text-xl font-bold tracking-tight">IIM SKILLS</h1>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-300"
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>

          <div className="h-px w-full bg-slate-800 my-6" />

          {/* USER INFO CARD */}
          {/* <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 mb-8">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
              Administrator
            </p>
            <p className="text-sm font-semibold truncate text-blue-100">{user.name}</p>
            <p className="text-xs text-slate-400 mt-1">{user.role}</p>
          </div> */}

          {/* NAVIGATION */}
          <nav className="space-y-1.5">
            {tabs.map((tab) => {
              const isActive = active === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`
                    flex items-center w-full px-4 py-3 rounded-xl transition-all duration-200 group
                    ${
                      isActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }
                  `}
                >
                  <span
                    className={`${
                      isActive ? "text-white" : "text-slate-500 group-hover:text-blue-400"
                    } transition-colors`}
                  >
                    {tab.icon}
                  </span>
                  <span className="ml-3 font-medium text-sm">{tab.name}</span>
                  {isActive && <ChevronRight size={14} className="ml-auto opacity-60" />}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP HEADER */}
        <header className="h-16 sm:h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition"
              aria-label="Open sidebar"
            >
              <Menu size={22} />
            </button>

            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 capitalize">
              {activeTabName}
            </h2>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="h-8 w-px bg-slate-200 mx-1 sm:mx-2 hidden sm:block" />

            <div className="flex items-center gap-3">
              {/* USER INFO (HIDDEN ON SMALL SCREENS) */}
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800 leading-none">{user.name}</p>
                <p className="text-xs text-slate-500 mt-1">{user.role}</p>
              </div>

              {/* AVATAR + DROPDOWN */}
              <div ref={avatarRef} className="relative">
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  aria-haspopup="true"
                  aria-expanded={profileOpen}
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center text-white font-bold shadow-md focus:outline-none bg-gradient-to-tr from-blue-600 to-indigo-600"
                >
                  {user.name.charAt(0)}
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border ring-1 ring-black/5 z-20 overflow-hidden">
                    <button
                      onClick={() => {
                        setActive("profile");
                        setProfileOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50"
                    >
                      <User2 size={16} className="text-slate-600" />
                      <div>
                        <div className="text-sm font-medium text-slate-800">Profile</div>
                        <div className="text-xs text-slate-500">View your profile</div>
                      </div>
                    </button>

                    <div className="border-t border-slate-100" />

                    <button
                      onClick={() => {
                        sessionStorage.removeItem("user");
                        localStorage.removeItem("user");
                        window.location.href = "/";
                      }}
                      className="w-full text-left px-4 py-3 flex items-center gap-3 text-red-500 hover:bg-slate-50"
                    >
                      <LogOut size={16} />
                      <div className="text-sm font-medium">Logout</div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT CONTAINER */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            {active === "dashboard" && <DashboardHome />}
            {active === "coupon" && <CouponPage />}
            {active === "batch" && <BatchPage />}
            {active === "mentors_booking" && <MentorsBooking />}
            {active === "lms" && <LMSPage />}
            {active === "notifications" && <AdminNotificationPage />}
            {active === "videos" && <Videos />}
            {active === "profile" && <ProfilePage />}
            {active === "studyMT" && <StudyMT />}
            {active === "users" && user && <Users currentUser={user} />}

            {active === "course" && <Course />}
            {active === "quiz" && <Quiz />}
          </div>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .hide-scrollbar::-webkit-scrollbar {
  display: none;
}

.hide-scrollbar {
  -ms-overflow-style: none;  /* IE/Edge */
  scrollbar-width: none;     /* Firefox */
}
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #CBD5E1;
        }
      `}} />
    </div>
  );
}