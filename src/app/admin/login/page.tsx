"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  BookOpen,
  ArrowRight,
  Loader2,
  User,
  GraduationCap,
} from "lucide-react";

type LoginResponse = {
  role?: string;
  error?: string;
  [key: string]: any;
};

type LoginType = "admin" | "student";

export default function App(): React.ReactElement {
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [loginType, setLoginType] = useState<LoginType>("admin");

  const navigateTo = (path: string): void => {
    router.push(path);
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const endpoint =
      loginType === "admin" ? "/api/admin/login" : "/api/student/login";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data: LoginResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed. Check your credentials.");
      }

      const role = (data.role || "").toLowerCase();
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("user", JSON.stringify({ ...data, role, loginType }));
      }

      // Role-based redirection logic
      if (loginType === "admin") {
        if (["admin", "manager", "author"].includes(role)) {
          navigateTo("/admin");
        } else {
          setError("Unauthorized access. Admin credentials required.");
        }
      } else {
        // Student redirection
        navigateTo("/dashboard");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to connect to the server.");
      }
    } finally {
      setIsLoading(false);
    }
  };

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

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs font-medium animate-in fade-in duration-300">
                {error}
              </div>
            )}

            <div className="space-y-1.5 group">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1e3799] transition-colors" size={18} />
                <input
                  type="email"
                  required
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3.5 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e3799]/10 focus:border-[#1e3799] transition-all"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5 group">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1e3799] transition-colors" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3.5 pl-12 pr-12 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e3799]/10 focus:border-[#1e3799] transition-all"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer select-none">
                <input type="checkbox" className="rounded text-[#1e3799] focus:ring-[#1e3799]" />
                Remember me
              </label>
              <button type="button" className="text-xs font-bold text-[#1e3799] hover:underline">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center py-3.5 rounded-xl bg-white border-2 border-[#1e3799] text-[#1e3799] font-bold hover:bg-[#1e3799] hover:text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                "Login"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
