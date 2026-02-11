"use client";

import React, { useState } from "react";
import { BookOpen, User, GraduationCap, Mail, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import AdminLoginForm from "@/components/AdminLoginForm";
import StudentLoginForm from "@/components/StudentLoginForm";

type LoginType = "admin" | "student";

export default function App(): React.ReactElement {
  const [loginType, setLoginType] = useState<LoginType>("admin");

  // ⭐ FREE LOGIN STATES
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
        const msg = data?.error || `Server returned ${res.status}`;
        setFreeError(String(msg));
        setLoadingFree(false);
        return;
      }

      // Save session locally
      try {
        localStorage.setItem("user", JSON.stringify(data));
        localStorage.setItem("course_user_key", String(data.email ?? cleanEmail));
      } catch (err) {
        console.warn("localStorage error:", err);
      }

      // Navigate to dashboard
      // prefer router.push to avoid full reload
      router.push("/student/dashboard");
    } catch (err) {
      console.error("Free login request failed:", err);
      setFreeError("Network error, please try again.");
    } finally {
      setLoadingFree(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-[#b8c1ec] via-[#dff9fb] to-[#c56cf0]/20 font-sans">
      <div className="w-full max-w-4xl bg-white rounded-[2rem] overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[550px]">

        {/* LEFT SIDE */}
        <div className="w-full md:w-[45%] bg-gradient-to-b from-[#1e3799] to-[#0c2461] p-10 flex flex-col justify-between text-white relative">
          <div>
            <div className="flex items-center gap-2 mb-12">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                <BookOpen className="text-white w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight">ACCA IIM SKILLS</span>
            </div>

            <h1 className="text-4xl font-extrabold leading-tight">
              ACCA Professional <br /> Education
            </h1>

            <p className="text-blue-100/70 text-sm mt-4 max-w-[250px]">
              Access your professional finance & accounting journey and manage your learning progress with ease.
            </p>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="w-full md:w-[55%] p-8 md:p-12 flex flex-col justify-center bg-white">

          {/* LOGIN SWITCH */}
          <div className="mb-8">
            <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
              <button
                onClick={() => setLoginType("admin")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg ${
                  loginType === "admin"
                    ? "bg-white text-[#1e3799] shadow-sm"
                    : "text-slate-500"
                }`}
              >
                <User size={16} /> Admin
              </button>

              <button
                onClick={() => setLoginType("student")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg ${
                  loginType === "student"
                    ? "bg-white text-[#1e3799] shadow-sm"
                    : "text-slate-500"
                }`}
              >
                <GraduationCap size={16} /> Student
              </button>
            </div>

            <h2 className="text-2xl font-bold text-slate-800">
              {loginType === "admin" ? "Admin Login" : "Student Login"}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Please enter your credentials to proceed
            </p>
          </div>

          {/* FORMS */}
          <div className="space-y-5">
            {loginType === "admin" ? <AdminLoginForm /> : <StudentLoginForm />}

            {/* ⭐ FREE LOGIN SECTION */}
            <div className="pt-0 border-t border-slate-100">

              {/* MAIN BUTTON */}
              {!showFreeLogin && (
                <button
                  onClick={() => {
                    setFreeError(null);
                    setShowFreeLogin(true);
                  }}
                  className="text-gray-700 text-sm font-semibold hover:underline transition"
                >
                  🚀 Continue with <span className="text-blue-700">Free Email Login</span>
                </button>
              )}

              {/* EMAIL INPUT APPEARS HERE */}
              {showFreeLogin && (
                <div className="space-y-3">
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={freeEmail}
                      onChange={(e) => setFreeEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      disabled={loadingFree}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleFreeLoginSubmit();
                      }}
                    />
                  </div>

                  {freeError && <div className="text-sm text-rose-600">{freeError}</div>}

                  <button
                    onClick={handleFreeLoginSubmit}
                    className="w-full py-3 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center justify-center gap-2"
                    disabled={loadingFree}
                  >
                    {loadingFree ? (
                      <>
                        <Loader2 className="animate-spin" size={16} /> Processing...
                      </>
                    ) : (
                      "Continue Free"
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
