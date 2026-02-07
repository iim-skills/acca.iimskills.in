"use client";

import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff, BookOpen, Loader2, User, GraduationCap } from "lucide-react";
import AdminLoginForm from "@/components/AdminLoginForm";
import StudentLoginForm from "@/components/StudentLoginForm";

type LoginType = "admin" | "student";

export default function App(): React.ReactElement {
  const [loginType, setLoginType] = useState<LoginType>("admin");

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-[#b8c1ec] via-[#dff9fb] to-[#c56cf0]/20 font-sans">
      <div className="w-full max-w-4xl bg-white rounded-[2rem] overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[550px]">
        <div className="w-full md:w-[45%] bg-gradient-to-b from-[#1e3799] to-[#0c2461] p-10 flex flex-col justify-between text-white relative">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-12">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                <BookOpen className="text-white w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight">ACCA IIM SKILLS</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold leading-tight">
                ACCA Professional  <br />
                Education
              </h1>
              <p className="text-blue-100/70 text-sm leading-relaxed max-w-[250px]">
                Access your professional finance & accounting journey and manage your learning progress with ease.
              </p>
            </div>
          </div>

          <div className="relative z-10">
            <button className="px-6 py-2 rounded-full border border-white/30 text-xs font-semibold hover:bg-white/10 transition-colors">
              Learn More
            </button>
          </div>

          <div className="absolute top-0 right-0 h-full w-full opacity-10 pointer-events-none">
             <svg viewBox="0 0 400 600" className="h-full w-full" preserveAspectRatio="none">
                <path d="M0,100 C150,200 250,0 400,150 L400,600 L0,600 Z" fill="white" />
             </svg>
          </div>
        </div>

        <div className="w-full md:w-[55%] p-8 md:p-12 flex flex-col justify-center bg-white">
          <div className="mb-8">
            <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
              <button
                onClick={() => setLoginType("admin")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all ${loginType === "admin" ? "bg-white text-[#1e3799] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                <User size={16} /> Admin
              </button>
              <button
                onClick={() => setLoginType("student")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all ${loginType === "student" ? "bg-white text-[#1e3799] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                <GraduationCap size={16} /> Student
              </button>
            </div>

            <h2 className="text-2xl font-bold text-slate-800">
              {loginType === "admin" ? "Admin Login" : "Student Login"}
            </h2>
            <p className="text-slate-400 text-sm mt-1">Please enter your credentials to proceed</p>
          </div>

          {/* Render the selected form component (keeps UI/design unchanged) */}
          <div className="space-y-5">
            {loginType === "admin" ? <AdminLoginForm /> : <StudentLoginForm />}
          </div>
        </div>
      </div>
    </div>
  );
}
