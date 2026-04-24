"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Loader2, RefreshCw } from "lucide-react";

type LoginResponse = {
  success?: boolean;
  message?: string;
  student?: {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    studentType?: string;
    courses?: any[] | string;
  };
};

function generateCaptcha(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function StudentLoginForm(): React.ReactElement {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState(generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const showCaptcha = email && password;
  const isCaptchaValid = captchaInput === captcha;

  async function safeFetchJson(res: Response) {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) return res.json();
    throw new Error(await res.text());
  }

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
    setCaptchaInput("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!isCaptchaValid) {
      setError("Invalid CAPTCHA");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/student/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data: LoginResponse = await safeFetchJson(res);

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Invalid email or password");
      }

      localStorage.setItem("user", JSON.stringify(data.student));
      router.push("/student");
    } catch (err: any) {
      setError(err.message);
      refreshCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4.5 w-full mx-auto p-8 bg-white rounded-2xl shadow-sm border border-slate-100">
      
      {error && (
        <div className="text-[11px] bg-red-50 text-red-600 px-3 py-2 rounded-lg font-medium border border-red-100">
          {error}
        </div>
      )}

      {/* EMAIL */}
      <div className="relative group">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1e3799] transition-colors" size={16} />
        <input
          type="email"
          required
          className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-3 text-sm outline-none focus:bg-white focus:border-[#1e3799] transition-all"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {/* PASSWORD */}
      <div className="relative group">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1e3799] transition-colors" size={16} />
        <input
          type={showPassword ? "text" : "password"}
          required
          className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-10 text-sm outline-none focus:bg-white focus:border-[#1e3799] transition-all"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {/* COMPACT CAPTCHA */}
      {showCaptcha && (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Verify Code</span>
            <button type="button" onClick={refreshCaptcha} className="text-[#1e3799] hover:rotate-180 transition-transform duration-500">
              <RefreshCw size={12} />
            </button>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-center font-mono font-bold text-slate-700 tracking-widest text-sm shadow-sm select-none">
              {captcha}
            </div>
           <input
  type="text"
  required
  autoComplete="off"
  className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm outline-none focus:border-[#1e3799] placeholder:normal-case font-medium"
  placeholder="Type the code"
  value={captchaInput}
  onChange={(e) => setCaptchaInput(e.target.value)}
/>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={!isCaptchaValid || isLoading}
        className="w-full py-2.5 rounded-lg bg-[#1e3799] text-white text-sm font-semibold hover:bg-[#162a7a] active:scale-[0.98] transition-all disabled:opacity-40 flex justify-center items-center shadow-md shadow-blue-900/10"
      >
        {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Login"}
      </button>

      {/* <div className="text-center">
        <button type="button" className="text-[11px] text-slate-400 hover:text-[#1e3799] transition-colors">
          Forgot password?
        </button>
      </div> */}
    </form>
  );
}