"use client";

import React, { useEffect, useState } from "react";
import {
  BookOpen,
  User,
  GraduationCap,
  ChevronLeft,
  MoveRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import AdminLoginForm from "@/components/AdminLoginForm";
import StudentLoginForm from "@/components/StudentLoginForm";
import FreeLoginForm from "@/components/FreeLoginForm"; // ✅ NEW

type LoginType = "admin" | "student";

export default function App(): React.ReactElement {
  const [loginType, setLoginType] = useState<LoginType>("admin");
  const [showFreeLogin, setShowFreeLogin] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes bounce-slow {
        0%, 100% { transform: translateY(-5%); }
        50% { transform: translateY(0); }
      }
      .animate-bounce-slow {
        animation: bounce-slow 3s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-[#f8f9fd]">
      {/* LEFT SIDE */}
      <div className="hidden md:flex w-1/2 bg-[#f3eaea] items-center justify-center p-10">
        <div className="text-center max-w-sm">
          <img
            src="https://cdn-icons-png.flaticon.com/512/295/295128.png"
            alt="illustration"
            className="w-64 mx-auto mb-8 opacity-90"
          />

          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            ACCA Professional Education
          </h1>

          <p className="text-gray-500 text-sm leading-relaxed">
            Access your professional finance & accounting journey and manage your learning progress with ease.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-[480px]">

          {/* HEADER */}
          <div className="flex items-center gap-4 mb-8">
            <div className="h-14 w-14 bg-gradient-to-br from-[#404eed] to-[#6c5ce7] text-white flex items-center justify-center rounded-2xl shadow-lg shadow-indigo-200">
              <BookOpen size={28} />
            </div>

            {!showFreeLogin ? (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Welcome
                </h2>
                <p className="text-slate-500 text-sm">
                  Securely sign in to your educational portal
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Start Your Free Learning Journey
                </h2>
                <p className="text-slate-500 text-sm">
                  Unlock First 4 Topics For Free With 7 Days Free Trial
                </p>
              </div>
            )}
          </div>

          {/* MAIN CONTENT */}
          {!showFreeLogin ? (
            <div className="transition-all duration-300 ease-in-out">

              {/* LOGIN SWITCH */}
              <div className="bg-slate-100 p-1 rounded-xl flex mb-8 border border-slate-200/50">
                <button
                  onClick={() => setLoginType("admin")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all duration-300 ${
                    loginType === "admin"
                      ? "bg-white text-[#404eed] shadow-sm scale-[1.02]"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <User size={14} /> ADMIN PORTAL
                </button>

                <button
                  onClick={() => setLoginType("student")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all duration-300 ${
                    loginType === "student"
                      ? "bg-white text-[#404eed] shadow-sm scale-[1.02]"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <GraduationCap size={14} /> STUDENT PORTAL
                </button>
              </div>

              {/* FORMS */}
              <div className="space-y-8">
                <div className="rounded-2xl relative">
                  <div className={loginType === "admin" ? "block" : "hidden"}>
                    <AdminLoginForm />
                  </div>

                  <div className={loginType === "student" ? "block" : "hidden"}>
                    <StudentLoginForm />
                  </div>
                </div>

                {/* FREE LOGIN CTA */}
                <button
                  onClick={() => setShowFreeLogin(true)}
                  className="group w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 hover:border-emerald-200 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-6 w-6 bg-emerald-500 text-white rounded-full flex items-center justify-center">
                      <MoveRight size={15} />
                    </div>
                    <p className="text-sm font-medium">
                      Unlock <span className="font-bold text-emerald-700">First 4 Topics</span> for free (7 days)
                    </p>
                  </div>
                </button>

              </div>
            </div>
          ) : (
            <FreeLoginForm
              onBack={() => setShowFreeLogin(false)}
              onSuccess={(data, email) => {
                localStorage.setItem("user", JSON.stringify(data));
                localStorage.setItem("course_user_key", email);
                router.push("/student");
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}