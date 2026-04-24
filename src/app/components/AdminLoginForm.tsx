"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Loader2, RefreshCw } from "lucide-react";

type LoginResponse = { role?: string; error?: string; [k: string]: any };

function generateCaptcha(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function AdminLoginForm(): React.ReactElement {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [captchaCode, setCaptchaCode] = useState(() => generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState("");

  async function safeFetchJson(res: Response) {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) return res.json();
    const txt = await res.text();
    throw new Error(txt || res.statusText || "Server error");
  }

  const refreshCaptcha = () => {
    setCaptchaCode(generateCaptcha());
    setCaptchaInput("");
  };

  const isCaptchaValid = captchaInput.trim() === captchaCode;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!isCaptchaValid) {
      setError("Invalid CAPTCHA code.");
      refreshCaptcha();
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data: LoginResponse = await safeFetchJson(res);
      if (!res.ok) throw new Error(data?.error || "Authentication failed.");

      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...data,
            role: (data?.role || "admin").toLowerCase(),
            loginType: "admin",
          })
        );
      }

      router.push("/admin");
    } catch (err: any) {
      setError(err?.message || "Connection error.");
      refreshCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4.5 w-full mx-auto p-8 bg-white rounded-2xl shadow-sm border border-slate-100"
    >
      {error && (
        <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[11px] font-semibold animate-in fade-in slide-in-from-top-1">
          {error}
        </div>
      )}

      {/* EMAIL */}
      <div className="relative group">
        <Mail
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1e3799] transition-colors"
          size={16}
        />
        <input
          type="email"
          required
          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:bg-white focus:border-[#1e3799] focus:ring-4 focus:ring-blue-50 transition-all"
          placeholder="Admin Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {/* PASSWORD */}
      <div className="relative group">
        <Lock
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1e3799] transition-colors"
          size={16}
        />
        <input
          type={showPassword ? "text" : "password"}
          required
          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-10 text-sm outline-none focus:bg-white focus:border-[#1e3799] focus:ring-4 focus:ring-blue-50 transition-all"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {/* COMPACT CAPTCHA BOX */}
      <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
            Verify Code
          </span>
          <button
            type="button"
            onClick={refreshCaptcha}
            className="text-[#1e3799] hover:rotate-180 transition-transform duration-500"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 px-0.5">
          <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-mono font-bold tracking-widest text-slate-700 text-sm shadow-sm select-none whitespace-nowrap">
            {captchaCode}
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

      {/* SUBMIT BUTTON */}
      <button
        type="submit"
        disabled={isLoading || !isCaptchaValid}
        className="w-full flex items-center justify-center py-3 rounded-xl bg-[#1e3799] text-white font-bold text-sm hover:bg-[#162a7a] shadow-lg shadow-blue-900/10 transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Sign In to Admin"}
      </button>
    </form>
  );
}