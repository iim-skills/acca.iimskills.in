"use client";

import React, { useEffect, useState } from "react";
import { 
  Eye, 
  EyeOff, 
  User as UserIcon, 
  Mail, 
  Award, 
  BookOpen, 
  Briefcase, 
  Camera, 
  ShieldCheck, 
  Save, 
  X, 
  CheckCircle2, 
  ChevronRight,
  GraduationCap,
  Layout,
  Pencil,
  Image as ImageIcon,
  Sparkles,
  MapPin,
  Globe,
  ExternalLink,
  Bell,
  ShieldAlert,
  Settings,
  Lock
} from "lucide-react";

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
  banner?: string;
  password?: string;
  authordesig?: string;
}

export default function MePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "notifications" | "verification">("profile");

  const [formData, setFormData] = useState<Partial<User>>({});
  const [newPassword, setNewPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/users/me", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
        });

        if (res.status === 401) throw new Error("Unauthorized. Please login.");
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to load profile");
        }

        const data: User = await res.json();
        if (!mounted) return;
        setUser(data);

        const normalizedBio = typeof data.bio === "string" 
          ? data.bio 
          : data.bio?.paragraphs?.join("\n\n") || "";
          
        const normalizedExpertIn = Array.isArray(data.expertIn)
          ? data.expertIn.join(", ")
          : typeof data.expertIn === "string" ? data.expertIn : "";

        setFormData({
          name: data.name ?? "",
          email: data.email ?? "",
          bio: normalizedBio,
          expertIn: normalizedExpertIn,
          photo: data.photo ?? "",
          banner: data.banner ?? "",
          education: data.education ?? [],
          role: data.role ?? "",
          authordesig: (data as any).authordesig ?? "",
        });
      } catch (err: any) {
        if (!mounted) return;
        setError(err.message || "Failed to load profile");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchUser();
    return () => { mounted = false; };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (activeTab === "profile") return; // Block changes in profile tab
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    if (!user) return;
    
    // If only password should be changeable, ensure we don't send other data if modified locally
    if (activeTab === "profile") {
      setError("Profile information is currently locked.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (activeTab === "password" && !newPassword.trim()) {
      setError("Please enter a new password to save changes.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // Build payload focusing only on password or explicitly allowed fields
      const payload: any = {};
      
      if (newPassword.trim() !== "") {
        payload.password = newPassword;
      }

      const res = await fetch("/api/admin/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Update failed");

      const updated: User = await res.json();
      setUser(updated);
      setSuccessMsg("Security credentials updated successfully");
      setNewPassword("");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="w-12 h-12 border-3 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading settings...</p>
    </div>
  );

  if (!user) return <p className="p-12 text-center text-slate-500 font-medium">No user data available.</p>;

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Page Title */}
        <h1 className="text-xl font-bold text-slate-800 mb-8 ml-1">Account settings</h1>

        <div className="flex flex-col md:flex-row gap-6">
          
          {/* Sidebar Navigation */}
          <aside className="w-full md:w-64 space-y-1">
            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all relative ${
                activeTab === "profile" 
                  ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100" 
                  : "text-slate-500 hover:bg-white hover:shadow-sm"
              }`}
            >
              <UserIcon size={18} />
              Profile Details
              {activeTab === "profile" && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-600 rounded-l-full" />}
            </button>
            <button
              onClick={() => setActiveTab("password")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all relative ${
                activeTab === "password" 
                  ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100" 
                  : "text-slate-500 hover:bg-white hover:shadow-sm"
              }`}
            >
              <ShieldCheck size={18} />
              Security / Password
              {activeTab === "password" && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-600 rounded-l-full" />}
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all relative ${
                activeTab === "notifications" 
                  ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100" 
                  : "text-slate-500 hover:bg-white hover:shadow-sm"
              }`}
            >
              <Bell size={18} />
              Notifications
            </button>
            <button
              onClick={() => setActiveTab("verification")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all relative ${
                activeTab === "verification" 
                  ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100" 
                  : "text-slate-500 hover:bg-white hover:shadow-sm"
              }`}
            >
              <CheckCircle2 size={18} />
              Verification
            </button>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[600px] flex flex-col">
            
            <div className="p-8 md:p-12 flex-1">
              
              {activeTab === "profile" && (
                <div className="space-y-10 animate-in fade-in duration-500">
                  
                  {/* Avatar Section - Locked */}
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="relative group">
                      <img
                        src={user.photo || "/user.jpg"}
                        alt={user.name}
                        className="w-32 h-32 rounded-full object-cover border-2 border-slate-100 shadow-sm bg-slate-50 grayscale-[0.5]"
                      />
                      <div className="absolute bottom-0 right-0 p-2 bg-slate-400 text-white rounded-full border-4 border-white shadow-lg">
                        <Lock size={14} />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <h3 className="font-bold text-slate-800">Profile Identity</h3>
                      <p className="text-xs text-slate-400 font-medium">To change your profile picture, contact your administrator.</p>
                    </div>
                  </div>

                  {/* Form Grid - Read Only */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 ml-1 flex items-center gap-1.5 uppercase tracking-wider">
                        Full Name <Lock size={10} />
                      </label>
                      <input
                        type="text"
                        value={formData.name || ""}
                        readOnly
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-100 bg-slate-50/50 text-slate-500 font-medium cursor-not-allowed outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 ml-1 flex items-center gap-1.5 uppercase tracking-wider">
                        Expertise / ID <Lock size={10} />
                      </label>
                      <input
                        type="text"
                        value={formData.expertIn as string || ""}
                        readOnly
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-100 bg-slate-50/50 text-slate-500 font-medium cursor-not-allowed outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 ml-1 flex items-center gap-1.5 uppercase tracking-wider">
                        Email <Lock size={10} />
                      </label>
                      <input
                        type="email"
                        value={user.email}
                        readOnly
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 font-medium cursor-not-allowed outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 ml-1 flex items-center gap-1.5 uppercase tracking-wider">
                        Role / Designation <Lock size={10} />
                      </label>
                      <input
                        type="text"
                        value={formData.role || ""}
                        readOnly
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-100 bg-slate-50/50 text-slate-500 font-medium cursor-not-allowed outline-none"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-bold text-slate-400 ml-1 flex items-center gap-1.5 uppercase tracking-wider">
                        Professional Biography <Lock size={10} />
                      </label>
                      <div className="w-full px-5 py-4 rounded-xl border border-slate-100 bg-slate-50/50 text-slate-500 font-medium leading-relaxed min-h-[120px] cursor-not-allowed whitespace-pre-wrap">
                        {formData.bio as string || "No bio provided."}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "password" && (
                <div className="space-y-8 animate-in fade-in duration-500 max-w-md">
                   <div className="space-y-2">
                    <h2 className="text-lg font-bold text-slate-800">Change Password</h2>
                    <p className="text-sm text-slate-500 font-medium">Update your access credentials safely.</p>
                  </div>

                  <div className="space-y-6 pt-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">New Password</label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none font-semibold transition-all shadow-sm focus:ring-4 focus:ring-indigo-500/5"
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {newPassword && (
                        <div className="mt-2 flex items-center gap-2 px-1">
                          <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-500 ${
                              passwordStrength === "Strong" ? "w-full bg-emerald-500" :
                              passwordStrength === "Normal" ? "w-2/3 bg-yellow-500" : "w-1/3 bg-red-500"
                            }`} />
                          </div>
                          <span className="text-[10px] font-black uppercase text-slate-400">{passwordStrength}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {(activeTab === "notifications" || activeTab === "verification") && (
                <div className="h-64 flex flex-col items-center justify-center text-center">
                  <div className="p-4 bg-slate-50 rounded-full text-slate-300 mb-4">
                    <Settings size={40} />
                  </div>
                  <h3 className="text-slate-800 font-bold">Module Incoming</h3>
                  <p className="text-slate-500 text-sm max-w-xs mt-1">This section is currently being provisioned for your account tier.</p>
                </div>
              )}

            </div>

            {/* Footer Actions */}
            <div className="p-8 md:p-10 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
              <div className="flex-1 max-w-sm">
                {successMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-300">
                    <CheckCircle2 size={16} />
                    <span className="text-xs font-bold">{successMsg}</span>
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center gap-3">
                    <ShieldAlert size={16} />
                    <span className="text-xs font-bold">{error}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                {activeTab === "password" && (
                   <button
                    onClick={handleUpdate}
                    disabled={saving || !newPassword.trim()}
                    className="px-10 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Update Password</>
                    )}
                  </button>
                )}
                
                {activeTab === "profile" && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest px-4">
                    <Lock size={14} /> Sections Locked
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}