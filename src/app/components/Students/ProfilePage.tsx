"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  User,
  Phone,
  Mail,
  BookOpen,
  Calendar,
  ShieldCheck,
  Loader2,
  Award,
  ChevronRight,
  Lock,
} from "lucide-react";

type Props = {
  email: string;
  courseSlug: string;
  courseTitle: string;
  progressPct: number;
  onClose: () => void;
  onName?: (name: string) => void;
};

type UserProfile = {
  name: string;
  email: string;
  phone?: string;
  enrolledAt?: string | null;
};

export default function ProfileModal({
  email,
  courseSlug,
  courseTitle,
  progressPct,
  onClose,
  onName,
}: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Password UI
  const [pwOpen, setPwOpen] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await fetch(
          `/api/lms/me?email=${encodeURIComponent(email)}&courseSlug=${encodeURIComponent(
            courseSlug
          )}`
        );

        const data = await res.json();
        if (!mounted) return;

        if (res.ok && data?.user) {
          const user: UserProfile = {
            name: data.user.name,
            email: data.user.email,
            phone: data.user.phone,
            enrolledAt: data.course?.enrolledAt || null, // ✅ FIX
          };

          setProfile(user);

          if (typeof onName === "function" && user.name) {
            onName(user.name);
          }
        } else {
          setErr(data?.error || "Failed to load profile");
        }
      } catch {
        setErr("Network error");
      } finally {
        setLoading(false);
      }
    }

    if (email) load();
    else {
      setErr("No email found in session");
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [email, courseSlug, onName]);

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (!newPw || newPw.length < 6) {
      setPwError("Password must be at least 6 characters.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/lms/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          newPassword: newPw,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPwError(data?.error || "Unable to change password");
      } else {
        setPwSuccess("Password updated successfully.");
        setNewPw("");
        if (typeof window !== "undefined") {
          localStorage.setItem("enrolledEmail", email);
        }
      }
    } catch {
      setPwError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      
      <div className="absolute inset-0" onClick={onClose} />

      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl relative overflow-hidden flex flex-col max-h-[90vh]">
         <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50">
          <h3 className="font-semibold text-slate-900">Student Profile</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          {loading ? (
            <div className="py-16 flex flex-col items-center text-slate-400 gap-3">
              <Loader2 className="animate-spin text-blue-600" size={32} />
              <span className="text-sm font-medium">Loading details...</span>
            </div>
          ) : err ? (
            <div className="py-8 text-center text-red-600 text-sm font-medium">
              {err}
            </div>
          ) : profile ? (
            <div className="space-y-8">
              {/* Identity */}
              <div className="flex items-start gap-5">
                <div className="w-20 h-20 rounded-2xl bg-slate-200 flex items-center justify-center">
                  <span className="text-2xl font-bold text-slate-600">
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    {profile.name}
                  </h2>
                  <div className="text-sm text-slate-500 flex flex-col gap-1 mt-1">
                    <div className="flex items-center gap-2">
                      <Mail size={14} /> {profile.email}
                    </div>
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded w-fit">
                      Active Student
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border">
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-400">
                    <Award size={14} /> Progress
                  </div>
                  <div className="text-2xl font-bold">{progressPct}%</div>
                  <div className="h-1.5 bg-slate-200 rounded mt-2">
                    <div
                      className="h-full bg-blue-500 rounded"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border">
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-400">
                    <BookOpen size={14} /> Course
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    {courseTitle}
                  </div>
                </div>
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-6 py-5 border-t border-b">
                <div>
                  <span className="text-xs text-slate-400 font-bold">
                    Phone
                  </span>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone size={14} />
                    {profile.phone || "Not provided"}
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-400 font-bold">
                    Joined On
                  </span>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={14} />
                    {profile.enrolledAt
                      ? new Date(profile.enrolledAt).toLocaleDateString(
                          undefined,
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )
                      : "-"}
                  </div>
                </div>
              </div>

              {/* Password */}
              {!pwOpen ? (
                <button
                  onClick={() => setPwOpen(true)}
                  className="w-full p-4 border rounded-xl flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={18} />
                    <span className="text-sm font-semibold">
                      Change Your Password
                    </span>
                  </div>
                  <ChevronRight size={18} />
                </button>
              ) : (
                <form
                  onSubmit={submitPassword}
                  className="p-4 border rounded-xl bg-slate-50"
                >
                  <div className="flex justify-between mb-3">
                    <span className="font-semibold flex items-center gap-2">
                      <Lock size={14} /> Update Password
                    </span>
                    <button
                      type="button"
                      onClick={() => setPwOpen(false)}
                      className="text-xs text-slate-500"
                    >
                      Cancel
                    </button>
                  </div>

                  <input
                    type="password"
                    minLength={6}
                    required
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="New password"
                    className="w-full px-3 py-2 border rounded mb-2 text-sm"
                  />

                  {pwError && (
                    <div className="text-xs text-red-600">{pwError}</div>
                  )}
                  {pwSuccess && (
                    <div className="text-xs text-emerald-600">
                      {pwSuccess}
                    </div>
                  )}

                  <button
                    disabled={saving}
                    className="mt-3 w-full py-2 bg-slate-900 text-white rounded text-sm flex justify-center gap-2"
                  >
                    {saving && (
                      <Loader2 size={14} className="animate-spin" />
                    )}
                    Save Changes
                  </button>
                </form>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
