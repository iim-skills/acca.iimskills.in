"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  KeyRound,
} from "lucide-react";

type LoginModalProps = {
  slug: string;
  onClose: () => void;
  onSuccess?: (email: string) => void;
};

export default function LoginModal({
  slug,
  onClose,
  onSuccess,
}: LoginModalProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Lock body scroll
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    try {
      const res = await fetch("/api/lms/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErr(data?.error || "Invalid login");
        return;
      }

      localStorage.setItem("enrolledEmail", email);
      onSuccess?.(email);
      onClose();
      router.replace(`/free-courses/${slug}`);
    } catch (e) {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">

      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-50 w-full max-w-md bg-white rounded-3xl shadow-2xl">

        {/* Header */}
        <div className="px-8 pt-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold mb-4">
            <Lock size={14} /> Secure Access
          </div>

          <h2 className="text-2xl font-bold text-slate-900">
            Welcome Back
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Login to continue
          </p>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="px-8 py-6">

          {/* Email */}
          <label className="text-xs font-bold text-slate-500 uppercase">
            Email Address
          </label>
          <div className="relative mt-1 mb-5">
            <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
            <input
              required
              type="email"
              className="w-full pl-10 pr-3 py-3 rounded-xl border bg-slate-50"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password */}
          <label className="text-xs font-bold text-slate-500 uppercase">
            Password
          </label>
          <div className="relative mt-1 mb-4">
            <KeyRound className="absolute left-3 top-3.5 text-slate-400" size={18} />
            <input
              required
              type={showPassword ? "text" : "password"}
              className="w-full pl-10 pr-10 py-3 rounded-xl border bg-slate-50"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute right-3 top-3.5 text-gray-500"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {err && <p className="text-red-600 text-sm mb-3">{err}</p>}

          {/* Actions */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 rounded-xl"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} /> Logging in
              </>
            ) : (
              <>
                <LogIn size={18} /> Login
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full mt-3 text-sm text-slate-500 hover:text-slate-800"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
