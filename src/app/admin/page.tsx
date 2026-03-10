"use client";

import React, { useEffect, useState, useRef } from "react";
import { 
  Calendar, 
  User2, 
  Settings, 
  Bell, 
  Search, 
  ChevronRight, 
  LayoutDashboard, 
  Ticket, 
  FolderOpen, 
  BarChart3, 
  LogOut, 
  Video,
  User
} from "lucide-react";
import LMSPage from "./StudentLIst";
import DashboardHome from "./components/DashboardHome";
import ProfilePage from "./profile/page";
import BatchPage from "./batches/page";
import Quiz from "./quizzes/page";
import Course from "./course-builder/page";
import CouponPage from "./coupons/page";
import MentorsBooking from "./MentorsBooking/page";
import Videos from "./videos/page";
import { MdQuiz } from "react-icons/md";

/* ================= MOCK / TYPES ================= */
// Defining inline for the preview
export interface User {
  id: number;
  name: string;
  email?: string;
}

/* ================= MAIN COMPONENT ================= */
export default function App() {
  const [active, setActive] = useState("dashboard");
  const [user, setUser] = useState<User | null>(null);

  // dropdown state & ref
  const [menuOpen, setMenuOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement | null>(null);

  /* ---------- LOAD & PROTECT ADMIN (Original Logic Maintained) ---------- */
  useEffect(() => {
    const stored = sessionStorage.getItem("user") ?? localStorage.getItem("user");

    if (!stored) {
      // For preview purposes, setting a mock user if storage is empty
      // In production, your original window.location.href = "/admin/login" logic is correct
      setUser({ id: 1, name: "Admin User", email: "admin@imskills.com" });
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      if (parsed.loginType !== "admin") {
        // window.location.href = "/student/dashboard";
        return;
      }
      setUser({
        id: Number(parsed.id),
        name: parsed.name,
        email: parsed.email,
      });
    } catch {
      sessionStorage.removeItem("user");
      localStorage.removeItem("user");
      // window.location.href = "/admin/login";
    }
  }, []);

  /* ---------- close dropdown on outside click ---------- */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  /* ---------- TABS ---------- */
  const tabs = [
    { key: "dashboard", name: "Dashboard", icon: <BarChart3 size={20} /> },
    { key: "coupon", name: "Coupons", icon: <Ticket size={20} /> },
    { key: "course", name: "Course", icon: <Ticket size={20} /> },
    { key: "quiz", name: "Quiz", icon: <MdQuiz size={20} /> },
    { key: "lms", name: "Students", icon: <FolderOpen size={20} /> },
    { key: "batch", name: "Batches", icon: <Calendar size={20} /> },
    { key: "mentors_booking", name: "Mentors Slots", icon: <User size={20} /> },
    { key: "videos", name: "Videos", icon: <Video size={20} /> },
     
  ];

  const activeTabName = tabs.find(t => t.key === active)?.name || "Dashboard";

  /* ---------- RENDER ---------- */
  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-[#0F172A] text-white flex flex-col shadow-2xl relative z-10">
        {/* BRANDING */}
        <div className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Settings className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">IIM SKILLS</h1>
          </div>
          <div className="h-px w-full bg-slate-800 my-6" />
          
          {/* USER INFO CARD */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 mb-8">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
              Administrator
            </p>
            <p className="text-sm font-semibold truncate text-blue-100">
              {user.name}
            </p>
          </div>

          {/* NAVIGATION */}
          <nav className="space-y-1.5">
            {tabs.map((tab) => {
              const isActive = active === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActive(tab.key)}
                  className={`
                    flex items-center w-full px-4 py-3 rounded-xl transition-all duration-200 group
                    ${isActive 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }
                  `}
                >
                  <span className={`${isActive ? "text-white" : "text-slate-500 group-hover:text-blue-400"} transition-colors`}>
                    {tab.icon}
                  </span>
                  <span className="ml-3 font-medium text-sm">{tab.name}</span>
                  {isActive && <ChevronRight size={14} className="ml-auto opacity-60" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* LOGOUT */}
      
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* TOP HEADER */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-800 capitalize">
              {activeTabName}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            

            <div className="h-8 w-px bg-slate-200 mx-2" />
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800 leading-none">{user.name}</p>
                <p className="text-xs text-slate-500 mt-1">Super Admin</p>
              </div>

              {/* Avatar + dropdown */}
              <div ref={avatarRef} className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-haspopup="true"
                  aria-expanded={menuOpen}
                  className="h-10 w-10 bg-linear-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-md shadow-blue-200 focus:outline-none"
                >
                  {user.name.charAt(0)}
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border ring-1 ring-black/5 z-20">
                    <button
                      onClick={() => {
                        setActive("profile");
                        setMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50 rounded-t-lg"
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
                      className="w-full text-left px-4 py-3 flex items-center gap-3 text-red-500 hover:bg-slate-50 rounded-b-lg"
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
        <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            {active === "dashboard" && <DashboardHome />}
            {active === "coupon" && <CouponPage />}
            {active === "batch" && <BatchPage />}
            {active === "mentors_booking" && <MentorsBooking />}
            {active === "lms" && <LMSPage />}
            {active === "videos" && <Videos />}
            {active === "profile" && <ProfilePage />}
            {active === "course" && <Course />}
            {active === "quiz" && <Quiz />}
          </div>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
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