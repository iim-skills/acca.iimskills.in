"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

type LoginResponse = { role?: string; error?: string; [k: string]: any; };

export default function AdminLoginForm(): React.ReactElement {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function safeFetchJson(res: Response) {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) return res.json();
    const txt = await res.text();
    throw new Error(txt || res.statusText || "Server error");
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data: LoginResponse = await safeFetchJson(res);
      if (!res.ok) throw new Error(data?.error || "Authentication failed. Check your credentials.");

      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
        localStorage.setItem("user", JSON.stringify({
          ...data,
          role: (data?.role || "admin").toLowerCase(),
          loginType: "admin"
        }));
      }

      router.push("/admin");
    } catch (err: any) {
      setError(err?.message || "Unable to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-300 text-red-600 text-xs font-medium">
          {error}
        </div>
      )}

      <div className="space-y-1.5 group">
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input
            type="email"
            required
            className="w-full bg-slate-50 border border-slate-300 rounded-xl py-3.5 pl-12 pr-4 text-slate-900"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5 group">
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input
            type={showPassword ? "text" : "password"}
            required
            className="w-full bg-slate-50 border border-slate-300 rounded-xl py-3.5 pl-12 pr-12 text-slate-900"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300"
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
        className="w-full flex items-center justify-center py-3.5 rounded-xl bg-white border-2 border-[#1e3799] text-[#1e3799] font-bold hover:bg-[#1e3799] hover:text-white transition-all active:scale-[0.98] disabled:opacity-50"
      >
        {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Login"}
      </button>
    </form>
  );
}
