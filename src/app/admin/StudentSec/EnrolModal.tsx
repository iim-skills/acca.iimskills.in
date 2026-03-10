"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  X,
  Loader2,
  User,
  Mail,
  Check,
  ChevronRight,
  Layers,
  ChevronDown,
  BookOpen,
  Users,
  Phone
} from "lucide-react";

type EnrolModalProps = {
  onClose: () => void;
  adminName?: string;
};

type Batch = {
  id: string | number;
  name: string;
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

  /* ================= COURSES ================= */
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseSlug, setSelectedCourseSlug] = useState("");
  const [modules, setModules] = useState<any[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [isModuleDropdownOpen, setIsModuleDropdownOpen] = useState(false);
  const moduleDropdownRef = useRef<HTMLDivElement>(null);

  /* ================= BATCHES ================= */
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | number | "">("");
  const [batchesFetching, setBatchesFetching] = useState(true);

  /* ================= FETCH COURSES ================= */
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await fetch("/api/admin/courses");
        if (!res.ok) throw new Error("Failed to fetch courses");

        const data = await res.json();
        if (!Array.isArray(data)) return;

        setCourses(data);

        if (data.length > 0) {
          setSelectedCourseSlug(data[0].slug);
          setModules(data[0].modules || []);
        }
      } catch (err) {
        console.error("Course load error:", err);
      }
    };

    loadCourses();
  }, []);

  /* ================= UPDATE MODULES WHEN COURSE CHANGES ================= */
  useEffect(() => {
    if (!selectedCourseSlug) return;

    const selectedCourse = courses.find(
      (c) => c.slug === selectedCourseSlug
    );

    setModules(selectedCourse?.modules || []);
    setSelectedModules([]);
  }, [selectedCourseSlug, courses]);

  /* ================= FETCH BATCHES ================= */
  useEffect(() => {
    const loadBatches = async () => {
      try {
        const res = await fetch("/api/admin/batches");
        if (!res.ok) throw new Error("Failed to fetch batches");

        const data: Batch[] = await res.json();

        const available = data.filter(
          (b) => Number(b.currentStudents) < Number(b.maxStudents)
        );

        available.sort(
          (a, b) =>
            new Date(a.startDate).getTime() -
            new Date(b.startDate).getTime()
        );

        setBatches(available);
        if (available.length > 0) setSelectedBatchId(available[0].id);
      } catch (err) {
        console.error("Batch load error:", err);
      } finally {
        setBatchesFetching(false);
      }
    };

    loadBatches();
  }, []);

  /* ================= TOGGLE MODULE ================= */
  const toggleModule = (moduleId: string) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((x) => x !== moduleId)
        : [...prev, moduleId]
    );
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    setError("");

    const selectedCourse = courses.find(
      (c) => c.slug === selectedCourseSlug
    );

    if (!selectedCourse) {
      setError("Please select a course.");
      return;
    }

    if (!selectedModules.length) {
      setError("Please select at least one module.");
      return;
    }

    if (!selectedBatchId) {
      setError("Please select a batch.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/lms/enrol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          courseSlug: selectedCourse.slug,
          courseTitle: selectedCourse.name,
          modules: selectedModules,
          enrolledBy: adminName || "Admin",
          batchId: selectedBatchId,
        }),
      });

      if (!res.ok) throw new Error("Enrollment failed");

      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moduleDropdownRef.current && !moduleDropdownRef.current.contains(event.target as Node)) {
        setIsModuleDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden font-sans">
      
      {/* HEADER */}
      <div className="bg-indigo-900 text-white p-6 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Student Enrollment</h2>
          <p className="text-indigo-200 text-sm">Fill in the details to register a new student</p>
        </div>

        {/* PROGRESS TRACKER */}
        <div className="flex items-center mt-6 gap-2">
            <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-indigo-400' : 'bg-indigo-800'}`}></div>
            <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-indigo-400' : 'bg-indigo-800'}`}></div>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input
                        placeholder="john@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
                <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r pr-2 border-slate-200">
                        <Phone className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <span className="text-sm font-medium text-slate-500">+91</span>
                    </div>
                    <input
                        type="tel"
                        placeholder="98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="w-full pl-20 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
                    />
                </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Course Dropdown */}
            <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Select Course</label>
                <div className="relative group">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <select
                        value={selectedCourseSlug}
                        onChange={(e) => setSelectedCourseSlug(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none transition-all shadow-sm cursor-pointer"
                    >
                        {courses.map((course) => (
                        <option key={course.slug} value={course.slug}>
                            {course.name}
                        </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                </div>
            </div>

            {/* Batch Dropdown */}
            <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Assign Batch</label>
                <div className="relative group">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <select
                        value={selectedBatchId}
                        onChange={(e) => setSelectedBatchId(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none transition-all shadow-sm cursor-pointer"
                    >
                        {batchesFetching ? (
                            <option>Loading batches...</option>
                        ) : batches.length === 0 ? (
                            <option>No available batches</option>
                        ) : (
                            batches.map((b) => (
                                <option key={b.id} value={String(b.id)}>
                                    {b.name} ({new Date(b.startDate).toLocaleDateString('en-GB')})
                                </option>
                            ))
                        )}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                </div>
            </div>

            {/* Custom Multi-select Dropdown for Modules */}
            <div className="space-y-1.5" ref={moduleDropdownRef}>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Select Modules</label>
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setIsModuleDropdownOpen(!isModuleDropdownOpen)}
                        className={`w-full flex items-center justify-between pl-4 pr-3 py-3 bg-white border rounded-xl transition-all shadow-sm hover:border-indigo-400 ${
                            isModuleDropdownOpen ? "ring-2 ring-indigo-500/20 border-indigo-500" : "border-slate-200"
                        }`}
                    >
                        <div className="flex items-center gap-2 overflow-hidden">
                            <Layers size={18} className="text-slate-400 shrink-0" />
                            <span className={`truncate ${selectedModules.length === 0 ? 'text-slate-400' : 'text-slate-700'}`}>
                                {selectedModules.length === 0 
                                    ? "Choose modules..." 
                                    : `${selectedModules.length} module(s) selected`}
                            </span>
                        </div>
                        <ChevronDown size={18} className={`text-slate-400 transition-transform ${isModuleDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isModuleDropdownOpen && (
                        <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 p-2 space-y-1">
                            {modules.length === 0 ? (
                                <p className="text-sm text-slate-500 p-4 text-center">No modules available for this course.</p>
                            ) : (
                                modules.map((m: any) => {
                                    const id = m.moduleId ?? m.id ?? m.slug ?? String(m.name);
                                    const isSelected = selectedModules.includes(id);

                                    return (
                                        <button
                                            key={id}
                                            type="button"
                                            onClick={() => toggleModule(id)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                                                isSelected 
                                                    ? "bg-indigo-50 text-indigo-700" 
                                                    : "hover:bg-slate-50 text-slate-700"
                                            }`}
                                        >
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                                isSelected ? "bg-indigo-600 border-indigo-600" : "border-slate-300 bg-white"
                                            }`}>
                                                {isSelected && <Check size={14} className="text-white" />}
                                            </div>
                                            <span className="text-sm font-medium">{m.name}</span>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="p-6 bg-white border-t border-slate-100">
        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg mb-4 text-sm font-medium animate-in slide-in-from-top-1">
            <X size={16} className="shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-3">
            {step === 2 && (
                <button
                    onClick={() => setStep(1)}
                    className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                >
                    Back
                </button>
            )}
            <button
                onClick={
                    step === 1
                    ? () => {
                        if (!name || !email || !phone) {
                            setError("Please fill all details.");
                            return;
                        }
                        setError("");
                        setStep(2);
                        }
                    : handleSubmit
                }
                disabled={loading}
                className={`flex-[2] flex items-center justify-center gap-2 bg-indigo-600 text-white p-3 font-semibold rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-200 disabled:opacity-70 disabled:pointer-events-none`}
            >
                {loading ? (
                    <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>Processing...</span>
                    </>
                ) : (
                    <>
                        <span>{step === 1 ? "Next Step" : "Complete Enrollment"}</span>
                        <ChevronRight size={18} />
                    </>
                )}
            </button>
        </div>
      </div>
    </div>
  );
}