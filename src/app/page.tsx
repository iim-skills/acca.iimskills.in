"use client";

import React, { useEffect, useState } from "react";
import {
  BookOpen,
  User,
  GraduationCap,
  Mail,
  Loader2,
  ChevronLeft,
  Sparkles,
  RefreshCw,
  MoveRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import AdminLoginForm from "@/components/AdminLoginForm";
import StudentLoginForm from "@/components/StudentLoginForm";

type LoginType = "admin" | "student";

function generateCaptcha(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function App(): React.ReactElement {
  const [loginType, setLoginType] = useState<LoginType>("admin");
  const [showFreeLogin, setShowFreeLogin] = useState(false);
  const [freeEmail, setFreeEmail] = useState("");
  const [loadingFree, setLoadingFree] = useState(false);
  const [freeError, setFreeError] = useState<string | null>(null);

  const [captchaCode, setCaptchaCode] = useState(() => generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState("");

  const router = useRouter();

  const refreshCaptcha = () => {
    setCaptchaCode(generateCaptcha());
    setCaptchaInput("");
  };

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

    if (captchaInput.trim() !== captchaCode) {
      setFreeError("Invalid CAPTCHA. Please try again.");
      refreshCaptcha();
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
        return;
      }

      localStorage.setItem("user", JSON.stringify(data));
      localStorage.setItem("course_user_key", String(data.email ?? cleanEmail));

      router.push("/student");
    } catch (err) {
      console.error(err);
      setFreeError("Network error, please try again.");
    } finally {
      setLoadingFree(false);
    }
  };

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

  // ADD THIS just above return (inside component)
const isCaptchaValid = captchaInput.trim() === captchaCode;
const isFormValid = freeEmail.trim() && isCaptchaValid;

  return (
    <div className="flex min-h-screen bg-[#f8f9fd]">
      {/* LEFT SIDE - Branding & Illustration */}
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

      {/* RIGHT SIDE - Form Area */}
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

          {/* MAIN LOGIN AREA */}
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

                {/* FREE LOGIN PROMO SECTION */}
                <button
                  onClick={() => {
                    setFreeError(null);
                    setShowFreeLogin(true);
                    refreshCaptcha();
                  }}
                  className="group w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 hover:border-emerald-200 transition-all text-left relative overflow-hidden"
                >
                  <div className="relative z-10 flex items-center gap-4">
                    <div className="h-6 w-6 bg-emerald-500 text-white rounded-full flex items-center justify-center shrink-0">
                      <MoveRight size={15} />
                    </div>
                    <div>
                      <p className="text-slate-700 text-sm font-medium leading-tight">
                        Unlock{" "}
                        <span className="font-bold text-emerald-700">
                          First 4 Topics
                        </span>{" "}
                        For Free With{" "}
                        <span className="font-bold text-emerald-700">
                          7 Days Free Trial
                        </span>
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="transition-all duration-300 ease-in-out">
               
                <div className="bg-white p-4 rounded-2xl">
              {/* FREE LOGIN FORM */}
              <div className="space-y-5">
                <div className="space-y-2.5 ">
                  <label className="text-xs font-bold text-slate-700 ml-1 mb-[20px]">
                    Email Address
                  </label>
                  <div className="relative group mt-5">
                    <Mail
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#404eed] transition-colors"
                    />
                    <input
                      type="email"
                      placeholder="e.g. student@acca.com"
                      value={freeEmail}
                      onChange={(e) => setFreeEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#404eed] transition-all bg-slate-50/50"
                      disabled={loadingFree}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleFreeLoginSubmit()
                      }
                    />
                  </div>
                </div>

                {/* CAPTCHA */}
                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Verification Code
                    </span>
                    <button
                      type="button"
                      onClick={refreshCaptcha}
                      className="text-[11px] text-[#404eed] font-bold hover:underline flex items-center gap-1"
                    >
                      <RefreshCw size={10} /> Refresh
                    </button>
                  </div>
<div className="flex gap-2">
                  <div className="w-full bg-white border border-slate-200 rounded-xl py-2 text-center font-mono text-base font-black tracking-[0.4em] text-slate-700 select-none shadow-sm italic">
                    {captchaCode}
                  </div>

                  <input
                    type="text"
                    placeholder="Enter the code"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    className="w-full px-2 py-2 text-base rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#404eed] transition-all bg-white text-center font-bold tracking-widest"
                    disabled={loadingFree}
                  />
                </div>

                {freeError && (
                  <div className="bg-red-50 text-red-600 text-xs font-semibold p-3 rounded-lg border border-red-100">
                    {freeError}
                  </div>
                )}
</div>
              <button
  onClick={handleFreeLoginSubmit}
  className="w-full py-4 rounded-xl text-sm font-bold bg-[#404eed] text-white hover:bg-[#2d38be] shadow-xl shadow-blue-900/10 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
  disabled={loadingFree || !isFormValid}
>
                  {loadingFree ? (
                    <>
                      <Loader2 className="animate-spin" size={20} /> Validating Credentials...
                    </>
                  ) : (
                    "Claim Free Trial Access"
                  )}
                </button>

                <button
                  onClick={() => {
                    setShowFreeLogin(false);
                    setFreeError(null);
                    setFreeEmail("");
                    setCaptchaInput("");
                  }}
                  className="w-full py-2 rounded-xl text-sm font-bold  text-slate-600 hover:bg-slate-50 transition-all flex items-cente justify-start gap-2"
                >
                  <ChevronLeft size={16} />
                  Back to <span className="font-bold text-emerald-700">Standard Login</span> 
                </button>
              </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}