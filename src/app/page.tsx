"use client";

import React, { useState } from "react";
import { BookOpen, User, GraduationCap, Mail, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import AdminLoginForm from "@/components/AdminLoginForm";
import StudentLoginForm from "@/components/StudentLoginForm";

type LoginType = "admin" | "student";

export default function App(): React.ReactElement {
  const [loginType, setLoginType] = useState<LoginType>("admin");

  const [showFreeLogin, setShowFreeLogin] = useState(false);
  const [freeEmail, setFreeEmail] = useState("");
  const [loadingFree, setLoadingFree] = useState(false);
  const [freeError, setFreeError] = useState<string | null>(null);

  const router = useRouter();

  const handleFreeLoginSubmit = async () => {
    setFreeError(null);
    const cleanEmail = freeEmail.trim().toLowerCase();

    if (!cleanEmail) {
      setFreeError("Please enter your email.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setFreeError("Please enter a valid email address.");
      return;
    }

    setLoadingFree(true);

    try {
      const res = await fetch("/api/student/free-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();

      if (!res.ok || data?.error) {
        setFreeError(data?.error || "Something went wrong");
        setLoadingFree(false);
        return;
      }

      localStorage.setItem("user", JSON.stringify(data));
      localStorage.setItem("course_user_key", String(data.email ?? cleanEmail));

      router.push("/student");
    } catch (err) {
      setFreeError("Network error, please try again.");
    } finally {
      setLoadingFree(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f8f8fb]">

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
      <div className="w-full md:w-1/2 flex items-center justify-center p-6">
    <div className="w-full md:w-[]70%] p-8 md:p-16 flex flex-col justify-center">
             <div className="flex items-center gap-2 mb-10">
              <div className="bg-[#6c5ce7] text-white p-2 rounded-md">
                <BookOpen size={18} />
              </div>
              <span className="text-3xl font-bold text-[#6c5ce7]">
                ACCA <span className="text-xs text-red-500">LMS</span>
              </span>
            </div>
 
          {/* LOGIN SWITCH: Minimalist style */}
          <div className="mb-10">
            <div className="flex p-1 bg-gray-100 rounded-xl mb-8">
              <button
                onClick={() => setLoginType("admin")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${
                  loginType === "admin"
                    ? "bg-white text-[#404eed] shadow-md"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <User size={14} /> ADMIN
              </button>

              <button
                onClick={() => setLoginType("student")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${
                  loginType === "student"
                    ? "bg-white text-[#404eed] shadow-md"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <GraduationCap size={14} /> STUDENT
              </button>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              {loginType === "admin" ? "Admin Login" : "Student Login"}
            </h2>
            <p className="text-gray-500 text-sm mt-2">
              Enter your details to access your account.
            </p>
          </div>

          {/* FORMS */}
          <div className="space-y-6">
            {loginType === "admin" ? <AdminLoginForm /> : <StudentLoginForm />}

            {/* ⭐ FREE LOGIN SECTION: Updated to match theme colors */}
            <div className="pt-4 border-t border-gray-100">

              {!showFreeLogin && (
                <button
                  onClick={() => {
                    setFreeError(null);
                    setShowFreeLogin(true);
                  }}
                  className="text-gray-500 text-sm font-medium hover:text-[#404eed] transition flex items-center gap-2"
                >
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  Try with <span className="font-bold">Free Email Access</span>
                </button>
              )}

              {showFreeLogin && (
                <div className="space-y-4 mt-2">
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-3.5 text-gray-400" />
                    <input
                      type="email"
                      placeholder="name@company.com"
                      value={freeEmail}
                      onChange={(e) => setFreeEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#404eed]/20 focus:border-[#404eed] transition-all bg-gray-50"
                      disabled={loadingFree}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleFreeLoginSubmit();
                      }}
                    />
                  </div>

                  {freeError && <div className="text-xs font-medium text-red-500 ml-1">{freeError}</div>}

                  <button
                    onClick={handleFreeLoginSubmit}
                    className="w-full py-4 rounded-xl text-sm font-bold bg-[#404eed] text-white hover:bg-[#2d38be] shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                    disabled={loadingFree}
                  >
                    {loadingFree ? (
                      <>
                        <Loader2 className="animate-spin" size={18} /> Validating...
                      </>
                    ) : (
                      "Continue to Dashboard"
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}