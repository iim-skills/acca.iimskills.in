"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Loader2,
  CheckCircle2,
  User,
  Mail,
  Phone as PhoneIcon,
  BookOpen,
  Check,
  ChevronRight,
  GraduationCap,
  Sparkles,
  Layers,
  Calendar,
  Users2
} from "lucide-react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

type EnrolModalProps = {
  onClose: () => void;
  adminName?: string;
};

type Batch = {
  id: string | number;
  name: string;
  level?: string;
  type?: string;
  startDate: string;
  maxStudents: number;
  currentStudents: number;
};

export default function EnrolModal({ onClose, adminName }: EnrolModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const skillsSlug = "acca-skills-level";

  const [availableCourse, setAvailableCourse] = useState<any | null>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | number | "">("");
  const [batchesFetching, setBatchesFetching] = useState<boolean>(true);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await fetch("/api/admin/courses");
        if (!res.ok) throw new Error("Failed to load courses");
        const data = await res.json();
        const arr = Array.isArray(data) ? data : [];
        const skills = arr.find((c: any) => c?.slug === skillsSlug) ?? null;

        if (skills) {
          let mods: any[] = [];
          if (skills.courseData) {
            if (typeof skills.courseData === "string") {
              try {
                const parsed = JSON.parse(skills.courseData);
                mods = Array.isArray(parsed?.modules) ? parsed.modules : parsed?.modules ?? [];
              } catch {
                mods = Array.isArray(skills.modules) ? skills.modules : [];
              }
            } else if (Array.isArray(skills.courseData?.modules)) {
              mods = skills.courseData.modules;
            } else {
              mods = Array.isArray(skills.modules) ? skills.modules : [];
            }
          } else {
            mods = Array.isArray(skills.modules) ? skills.modules : [];
          }
          setAvailableCourse(skills);
          setModules(mods || []);
        }
      } catch (err) {
        console.error("Error:", err);
      }
    };
    loadCourses();
  }, []);

  useEffect(() => {
    const loadBatches = async () => {
      setBatchesFetching(true);
      try {
        const res = await fetch("/api/admin/batches");
        if (!res.ok) throw new Error("Failed to fetch batches");
        const data: Batch[] = await res.json();
        const available = Array.isArray(data)
          ? data.filter((b) => Number(b.currentStudents) < Number(b.maxStudents))
          : [];
        available.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        setBatches(available);
        if (available.length > 0) setSelectedBatchId(available[0].id);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setBatchesFetching(false);
      }
    };
    loadBatches();
  }, []);

  const toggleModule = (moduleId: string) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((x) => x !== moduleId) : [...prev, moduleId]
    );
  };

  const handleSubmit = async () => {
    setError("");
    if (!availableCourse || availableCourse.slug !== skillsSlug) {
      setError("Active course modules not loaded.");
      return;
    }
    if (!selectedModules.length) {
      setError("Please select at least one module");
      return;
    }
    if (!selectedBatchId) {
      setError("Please select a batch to assign the learner to.");
      return;
    }

    setLoading(true);
    try {
      const batch = batches.find((b) => String(b.id) === String(selectedBatchId));
      const res = await fetch("/api/lms/enrol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email, phone,
          courseSlug: availableCourse.slug,
          courseTitle: availableCourse.name,
          modules: selectedModules,
          enrolledBy: adminName || "Admin",
          batchId: selectedBatchId,
          batchName: batch?.name ?? null,
        }),
      });
      if (!res.ok) throw new Error("Enrollment failed");
      onClose();
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden font-sans">
      {/* Premium Header */}
      <div className="relative bg-[#0f172a] pt-10 pb-8 px-8 text-white">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-indigo-500 rounded-full blur-[80px]" />
          <div className="absolute bottom-[-20%] left-[-10%] w-40 h-40 bg-emerald-500 rounded-full blur-[60px]" />
        </div>

        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/5"
        >
          <X size={20} />
        </button>

        <div className="relative flex items-center gap-5">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative p-4 bg-[#1e293b] rounded-2xl border border-white/10 shadow-2xl">
              <GraduationCap size={32} className="text-indigo-400" />
            </div>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300/80">
                LMS Internal Systems
              </p>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white leading-tight">
              Quick <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Enrol</span>
            </h2>
          </div>
        </div>

        {/* <div className="mt-8 flex items-center justify-between bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Process Phase</span>
            <span className="text-sm font-semibold text-indigo-200">
              {step === 1 ? "Authentication & Profile" : "Curriculum Setup"}
            </span>
          </div>
          <div className="flex -space-x-2">
            {[1, 2].map((i) => (
              <div 
                key={i}
                className={`w-8 h-8 rounded-full border-2 border-[#0f172a] flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                  step >= i ? "bg-indigo-500 text-white" : "bg-slate-700 text-slate-400"
                }`}
              >
                {step > i ? <Check size={14} /> : i}
              </div>
            ))}
          </div>
        </div> */}
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar space-y-8 bg-slate-50/50">
        
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
            <div className="space-y-1.5">
              <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <User size={16} className="text-indigo-500" /> Identity Details
              </h4>
              <p className="text-xs text-slate-500">Enter the learner's official communication info.</p>
            </div>

            <div className="space-y-4">
              <div className="group">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Full Name</label>
                <div className="relative transition-all duration-300">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                  <input
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border-2 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none text-slate-900 font-semibold transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Work Email</label>
                <div className="relative transition-all duration-300">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                  <input
                    placeholder="email Id"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border-2 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none text-slate-900 font-semibold transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Contact Number</label>
                <PhoneInput
                  country={"in"}
                  value={phone}
                  onChange={(val) => setPhone(val)}
                  containerClass="!rounded-2xl shadow-sm !border-2 !border-slate-100 focus-within:!border-indigo-500 transition-all bg-white"
                  inputClass="!w-full !h-[58px] !border-none !text-slate-900 !font-semibold !bg-transparent"
                  buttonClass="!bg-slate-50 !border-r !border-slate-100 !px-0"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
            {/* Batch Card Selection */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar size={16} className="text-indigo-500" /> Intake Batch
                </h4>
                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full uppercase">Required</span>
              </div>

              {batchesFetching ? (
                <div className="h-24 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-white">
                  <Loader2 className="animate-spin text-indigo-400 mr-2" />
                  <span className="text-sm font-medium text-slate-400">Syncing Batches...</span>
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-white border-2 border-slate-100 focus:border-indigo-500 outline-none font-bold text-slate-800 appearance-none shadow-sm transition-all"
                  >
                    {batches.map((b) => (
                       <option key={b.id} value={String(b.id)}>
                        {b.name} — Starts {new Date(b.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronRight size={20} className="rotate-90" />
                  </div>
                </div>
              )}

              {selectedBatchId && !batchesFetching && (
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white shadow-xl shadow-indigo-200">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Users2 size={20} />
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Live Capacity</p>
                      <p className="text-xl font-black">
                        {batches.find(x => String(x.id) === String(selectedBatchId))?.currentStudents}
                        <span className="text-indigo-300 font-medium text-sm ml-1">/ {batches.find(x => String(x.id) === String(selectedBatchId))?.maxStudents}</span>
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-400 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${(Number(batches.find(x => String(x.id) === String(selectedBatchId))?.currentStudents) / Number(batches.find(x => String(x.id) === String(selectedBatchId))?.maxStudents)) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </section>

            {/* Modules Grid */}
            <section className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers size={16} className="text-indigo-500" /> Module Configuration
              </h4>
              <div className="grid grid-cols-1 gap-3">
                {modules.map((m: any) => {
                  const id = m.moduleId ?? m.id ?? m.slug ?? String(m.name);
                  const isSelected = selectedModules.includes(id);
                  return (
                    <button
                      key={id}
                      onClick={() => toggleModule(id)}
                      className={`group flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 ${
                        isSelected 
                        ? "bg-white border-indigo-600 shadow-md translate-x-1" 
                        : "bg-white border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                        isSelected ? "bg-indigo-600 border-indigo-600 text-white" : "bg-slate-50 border-slate-200"
                      }`}>
                        {isSelected && <Check size={14} strokeWidth={3} />}
                      </div>
                      <span className={`text-sm font-bold flex-1 text-left ${isSelected ? "text-indigo-900" : "text-slate-600"}`}>
                        {m.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="p-8 bg-white border-t border-slate-100">
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold flex items-center gap-3 animate-bounce">
            <X size={16} className="bg-red-600 text-white rounded-full p-0.5" />
            {error}
          </div>
        )}

        <div className="flex gap-4">
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="px-8 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-all active:scale-95"
            >
              Back
            </button>
          )}
          
          <button
            onClick={step === 1 ? () => {
              if (!name || !email || !phone) {
                setError("Incomplete learner profile details.");
                return;
              }
              setError("");
              setStep(2);
            } : handleSubmit}
            disabled={loading}
            className={`flex-1 py-4 rounded-2xl font-black text-white flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl ${
              step === 1 
              ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100" 
              : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100"
            } disabled:opacity-50`}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                {step === 1 ? (
                  <>Next Phase <ChevronRight size={20} /></>
                ) : (
                  <>Complete Enrollment <CheckCircle2 size={20} /></>
                )}
              </>
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}