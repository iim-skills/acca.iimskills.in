"use client";

import React, { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface Education {
  degree: string;
  institute: string;
}

interface BioSection {
  paragraphs?: string[];
  books?: string[];
  sections?: { type: "list" | "text"; items?: string[]; content?: string }[];
  closing?: string | string[];
}

interface User {
  id: number;
  username?: string;
  name: string;
  email: string;
  role: string;
  education?: Education[] | string[];
  expertIn?: string[] | string;
  bio?: string | BioSection;
  photo?: string;
  password?: string;
  authordesig?: string;
}

export default function MePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState<Partial<User>>({});
  const [newPassword, setNewPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // password strength helper
  const checkPasswordStrength = (pwd: string) => {
    if (!pwd) return "";
    const hasLetter = /[a-zA-Z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);

    if (pwd.length > 7 && hasLetter && hasNumber && hasSpecial) return "Strong";
    if ((hasLetter && hasNumber) || (hasLetter && hasSpecial)) return "Normal";
    return "Weak";
  };

  useEffect(() => {
    setPasswordStrength(checkPasswordStrength(newPassword));
  }, [newPassword]);

  // Fetch profile from server (uses cookie set by login)
  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/users/me", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin", // ensure cookie is sent
        });

        if (res.status === 401) {
          // unauthorized — show friendly message (caller can redirect if desired)
          throw new Error("Unauthorized. Please login.");
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to load profile");
        }

        const data: User = await res.json();

        if (!mounted) return;
        setUser(data);

        // normalize formData for controlled inputs
        const normalizedBio =
          typeof data.bio === "string"
            ? data.bio
            : data.bio?.paragraphs?.join(" ") || "";
        const normalizedExpertIn = Array.isArray(data.expertIn)
          ? data.expertIn.join(", ")
          : typeof data.expertIn === "string"
          ? data.expertIn
          : "";

        setFormData({
          name: data.name ?? "",
          email: data.email ?? "",
          bio: normalizedBio,
          expertIn: normalizedExpertIn,
          photo: data.photo ?? "",
          education: data.education ?? [],
          role: data.role ?? "",
          authordesig: (data as any).authordesig ?? "",
        });
      } catch (err: any) {
        if (!mounted) return;
        console.error("Fetch profile error:", err);
        setError(err.message || "Failed to load profile");
        setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchUser();
    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    // keep expertIn as string while editing
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // Build payload
      const payload: any = {
        // identify user on server via cookie (email); include only updatable fields
        bio: typeof formData.bio === "string" ? formData.bio : "",
        photo: formData.photo ?? user.photo,
        role: formData.role ?? user.role,
        authordesig: (formData as any).authordesig ?? (user as any).authordesig,
        education: formData.education ?? user.education ?? [],
      };

      // expertIn: convert comma-separated string -> array
      const expertStr = (formData.expertIn as any) ?? "";
      if (typeof expertStr === "string" && expertStr.trim().length > 0) {
        payload.expertIn = expertStr
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      } else {
        payload.expertIn = user.expertIn ?? [];
      }

      if (newPassword.trim() !== "") {
        payload.password = newPassword;
      }

      const res = await fetch("/api/admin/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        throw new Error("Unauthorized. Please login again.");
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update profile");
      }

      const updated: User = await res.json();

      // normalize returned user and update state
      const normalizedBio =
        typeof updated.bio === "string"
          ? updated.bio
          : updated.bio?.paragraphs?.join(" ") || "";
      const normalizedExpertIn = Array.isArray(updated.expertIn)
        ? updated.expertIn.join(", ")
        : typeof updated.expertIn === "string"
        ? updated.expertIn
        : "";

      setUser(updated);
      setFormData({
        ...formData,
        name: updated.name ?? "",
        email: updated.email ?? "",
        bio: normalizedBio,
        expertIn: normalizedExpertIn,
        photo: updated.photo ?? "",
        education: updated.education ?? [],
      });

      setNewPassword("");
      setPasswordStrength("");
      setShowPassword(false);
      setIsEditing(false);
      setSuccessMsg("Profile updated successfully.");
    } catch (err: any) {
      console.error("Update profile error:", err);
      setError(err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-6 text-center">Loading profile…</p>;
  if (error) return <p className="p-6 text-center text-red-600">{error}</p>;
  if (!user) return <p className="p-6 text-center">No user data available.</p>;

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden mt-6">
      {/* Header */}
      <div className="flex items-center gap-4 p-6 bg-gray-50">
        <img
          src={user.photo || "/user.jpg"}
          alt={user.name}
          className="w-24 h-24 rounded-full object-cover border"
        />
        <div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-gray-600">{user.email}</p>
          <p className="mt-1 text-sm px-2 py-1 bg-blue-100 text-blue-700 inline-block rounded">
            {user.role}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-4 text-gray-700">
        {!isEditing ? (
          <>
            {/* Bio */}
            {user.bio && (
              <div>
                <strong>Bio:</strong>
                <p className="mt-1 text-gray-600">
                  {typeof user.bio === "string"
                    ? user.bio
                    : user.bio.paragraphs?.join(" ")}
                </p>
              </div>
            )}

            {/* Education */}
            {user.education && (user.education as any[]).length > 0 && (
              <div>
                <strong>Education:</strong>
                <ul className="mt-1 list-disc list-inside">
                  {(user.education as any[]).map((edu: any, idx: number) =>
                    typeof edu === "string" ? (
                      <li key={idx}>{edu}</li>
                    ) : (
                      <li key={idx}>
                        {edu.degree} - {edu.institute}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            {/* Expertise */}
            {user.expertIn && (user.expertIn as any[]).length > 0 && (
              <div>
                <strong>Expertise:</strong>
                <div className="flex flex-wrap gap-2 mt-1">
                  {(user.expertIn as any[]).map((skill: any, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Edit Button */}
            <button
              onClick={() => {
                setIsEditing(true);
                setSuccessMsg(null);
              }}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Edit Profile
            </button>
          </>
        ) : (
          <>
            {/* Name & Email (readonly) */}
            <div>
              <label className="block text-sm font-medium">Full Name</label>
              <input
                type="text"
                name="name"
                value={(formData.name as string) || ""}
                readOnly
                className="w-full p-2 border rounded bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                name="email"
                value={(formData.email as string) || ""}
                readOnly
                className="w-full p-2 border rounded bg-gray-100 cursor-not-allowed"
              />
            </div>

            {/* Editable Bio */}
            <div>
              <label className="block text-sm font-medium">Bio</label>
              <textarea
                name="bio"
                value={(formData.bio as string) || ""}
                onChange={handleChange}
                rows={4}
                className="w-full p-2 border rounded"
              />
            </div>

            {/* Editable Expertise */}
            <div>
              <label className="block text-sm font-medium">
                Expertise (comma separated)
              </label>
              <input
                type="text"
                name="expertIn"
                value={(formData.expertIn as string) || ""}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>

            {/* Password Change */}
            <div>
              <label className="block text-sm font-medium">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2 border rounded pr-10"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {newPassword && (
                <p
                  className={`mt-1 text-sm ${
                    passwordStrength === "Strong"
                      ? "text-green-600"
                      : passwordStrength === "Normal"
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  Password strength: {passwordStrength}
                </p>
              )}
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleUpdate}
                disabled={saving}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Update"}
              </button>
              <button
                onClick={() => {
                  // cancel -> restore from user
                  const normalizedBio =
                    typeof user.bio === "string"
                      ? user.bio
                      : user.bio?.paragraphs?.join(" ") || "";
                  const normalizedExpertIn = Array.isArray(user.expertIn)
                    ? user.expertIn.join(", ")
                    : typeof user.expertIn === "string"
                    ? user.expertIn
                    : "";

                  setFormData({
                    ...formData,
                    bio: normalizedBio,
                    expertIn: normalizedExpertIn,
                    name: user.name ?? "",
                    email: user.email ?? "",
                    photo: user.photo ?? "",
                    education: user.education ?? [],
                  });
                  setNewPassword("");
                  setPasswordStrength("");
                  setShowPassword(false);
                  setIsEditing(false);
                  setSuccessMsg(null);
                }}
                className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
            {successMsg && (
              <p className="text-green-600 mt-2">{successMsg}</p>
            )}
            {error && <p className="text-red-600 mt-2">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
