"use client";

import React, { useEffect, useRef, useState } from "react";
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
  Phone,
  Search as IconSearch,
  ArrowLeft,
  Sparkles,
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

  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseSlugs, setSelectedCourseSlugs] = useState<string[]>([]);
  const [selectedModulesMap, setSelectedModulesMap] = useState<Record<string, string[]>>({});
  const [moduleDropdownOpenMap, setModuleDropdownOpenMap] = useState<Record<string, boolean>>({});

  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
  const courseDropdownRef = useRef<HTMLDivElement | null>(null);

  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | number | "">("");
  const [batchesFetching, setBatchesFetching] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await fetch("/api/admin/courses");
        if (!res.ok) throw new Error("Failed to fetch courses");
        const data = await res.json();
        if (!Array.isArray(data)) return;
        setCourses(data);
        if (data.length > 0 && selectedCourseSlugs.length === 0) {
          const first = data[0];
          setSelectedCourseSlugs([first.slug]);
          setSelectedModulesMap((prev) => ({ ...prev, [first.slug]: [] }));
        }
      } catch (err) {
        console.error("Course load error:", err);
      }
    };
    loadCourses();
  }, []);

  useEffect(() => {
    const loadBatches = async () => {
      try {
        const res = await fetch("/api/admin/batches");
        if (!res.ok) throw new Error("Failed to fetch batches");
        const data: Batch[] = await res.json();
        const available = data.filter((b) => Number(b.currentStudents) < Number(b.maxStudents));
        available.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (courseDropdownRef.current && !courseDropdownRef.current.contains(event.target as Node)) {
        setCourseDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getCourseBySlug = (slug: string) => courses.find((c) => c.slug === slug);
  const getModulesForCourse = (course: any) => course?.modules || course?.courseData?.modules || [];

  const toggleCourse = (slug: string) => {
    setSelectedCourseSlugs((prev) => {
      if (prev.includes(slug)) {
        const next = prev.filter((s) => s !== slug);
        setSelectedModulesMap((m) => {
          const copy = { ...m };
          delete copy[slug];
          return copy;
        });
        return next;
      } else {
        setSelectedModulesMap((m) => ({ ...m, [slug]: [] }));
        return [...prev, slug];
      }
    });
  };

  const toggleModuleForCourse = (courseSlug: string, moduleId: string) => {
    setSelectedModulesMap((prev) => {
      const arr = prev[courseSlug] || [];
      if (arr.includes(moduleId)) {
        return { ...prev, [courseSlug]: arr.filter((x) => x !== moduleId) };
      } else {
        return { ...prev, [courseSlug]: [...arr, moduleId] };
      }
    });
  };

  const isCourseSelected = (slug: string) => selectedCourseSlugs.includes(slug);
  const isModuleSelected = (courseSlug: string, moduleId: string) => (selectedModulesMap[courseSlug] || []).includes(moduleId);

  /* ========== NEW: select-all helpers ========== */
  const getModuleId = (m: any) => {
    if (m == null) return "";
    if (typeof m === "string") return m;
    return m.moduleId ?? m.id ?? String(m.name ?? "");
  };

  const setAllModulesForCourse = (courseSlug: string, modulesArr: any[], value: boolean) => {
    const ids = modulesArr.map((m: any) => getModuleId(m)).filter(Boolean);
    setSelectedModulesMap((prev) => {
      return { ...prev, [courseSlug]: value ? ids : [] };
    });
  };

  const areAllModulesSelected = (courseSlug: string, modulesArr: any[]) => {
    if (!modulesArr || modulesArr.length === 0) return false;
    const ids = modulesArr.map((m: any) => getModuleId(m)).filter(Boolean);
    const sel = selectedModulesMap[courseSlug] || [];
    return ids.length > 0 && ids.every((id) => sel.includes(id));
  };
  /* ============================================== */

  const goToStep2 = () => {
    setError("");
    if (!name || !email || !phone) {
      setError("Please fill all student details.");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    setError("");
    if (selectedCourseSlugs.length === 0) {
      setError("Please select at least one course.");
      return;
    }
    for (const slug of selectedCourseSlugs) {
      if (!(selectedModulesMap[slug] || []).length) {
        setError(`Please select modules for ${getCourseBySlug(slug)?.name}.`);
        return;
      }
    }
    if (!selectedBatchId) {
      setError("Please select a batch.");
      return;
    }
    setLoading(true);
    try {
      for (const slug of selectedCourseSlugs) {
        const course = getCourseBySlug(slug);
        const payload = {
          name, email, phone,
          courseSlug: course.slug,
          courseTitle: course.name,
          modules: selectedModulesMap[slug],
          enrolledBy: adminName || "Admin",
          batchId: selectedBatchId,
        };
        const res = await fetch("/api/lms/enrol", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Failed for ${course.name}`);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Enrollment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden font-sans selection:bg-indigo-100">
      {/* HEADER */}
      <div className="bg-slate-950 p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 blur-[100px] rounded-full -mr-20 -mt-20" />
        <button onClick={onClose} className="absolute right-6 top-6 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all z-10">
          <X size={20} />
        </button>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-4">
            <Sparkles size={14} />
            Registration
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Student Enrollment</h2>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto px-8 py-10">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="grid gap-6">
              <div className="group space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                  <input placeholder="Enter student name" value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none transition-all placeholder:text-slate-400 font-medium" />
                </div>
              </div>

              <div className="group space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                  <input placeholder="student@email.com" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none transition-all placeholder:text-slate-400 font-medium" />
                </div>
              </div>

              <div className="group space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Phone Number</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r-2 pr-3 border-slate-200">
                    <Phone className="text-slate-400" size={18} />
                    <span className="text-sm font-bold text-slate-600">+91</span>
                  </div>
                  {/* FIXED: Changed setName to setPhone */}
                  <input type="tel" placeholder="9876543210" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="w-full pl-24 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none transition-all placeholder:text-slate-400 font-medium tracking-widest" />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-3" ref={courseDropdownRef}>
              <label className="text-sm font-bold text-slate-700 ml-1">Academic Path</label>
              <button type="button" onClick={() => setCourseDropdownOpen(!courseDropdownOpen)}
                className={`w-full flex items-center justify-between px-5 py-4 bg-white border-2 rounded-2xl transition-all ${courseDropdownOpen ? "border-indigo-600 ring-4 ring-indigo-50" : "border-slate-100"}`}>
                <div className="flex items-center gap-3 overflow-hidden text-left">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0"><BookOpen size={20} /></div>
                    <div className="truncate">
                      <div className="text-sm font-bold text-slate-900 leading-none mb-1">{selectedCourseSlugs.length === 0 ? "Browse Courses" : `${selectedCourseSlugs.length} Selected`}</div>
                      <div className="text-[11px] text-slate-500 truncate">{selectedCourseSlugs.length === 0 ? "Select programs" : selectedCourseSlugs.map(s => getCourseBySlug(s)?.name).join(", ")}</div>
                    </div>
                </div>
                <ChevronDown size={20} className={`text-slate-400 transition-transform ${courseDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {courseDropdownOpen && (
                <div className="absolute z-50 w-[calc(100%-64px)] mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 max-h-64 overflow-auto">
                  {courses.map(c => (
                    <div key={c.slug} onClick={() => toggleCourse(c.slug)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer ${isCourseSelected(c.slug) ? "bg-indigo-50" : "hover:bg-slate-50"}`}>
                       <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isCourseSelected(c.slug) ? "bg-indigo-600 border-indigo-600" : "border-slate-200"}`}>
                        {isCourseSelected(c.slug) && <Check size={12} className="text-white" />}
                       </div>
                       <span className="text-sm font-bold text-slate-700">{c.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              {selectedCourseSlugs.map(slug => {
                const c = getCourseBySlug(slug);
                const modules = getModulesForCourse(c);
                return (
                  <div key={slug} className="border-2 border-slate-100 rounded-3xl p-5">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">{c?.name}</span>

                        {/* SELECT ALL CHECKBOX (added) */}
                        <label className="ml-2 flex items-center gap-2 text-[12px] font-medium">
                          <input
                            type="checkbox"
                            checked={areAllModulesSelected(slug, modules)}
                            onChange={(e) => setAllModulesForCourse(slug, modules, e.target.checked)}
                            disabled={!modules || modules.length === 0}
                            className="w-4 h-4"
                          />
                          <span className="text-[10px] uppercase text-slate-600 font-bold">Select all</span>
                        </label>
                      </div>

                      <button onClick={() => setSelectedModulesMap(m => ({...m, [slug]: []}))} className="text-[10px] font-bold text-slate-400 uppercase">Clear</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {modules.map((m: any) => {
                        const id = m.moduleId ?? m.id ?? String(m.name);
                        const sel = isModuleSelected(slug, id);
                        return (
                          <div key={id} onClick={() => toggleModuleForCourse(slug, id)} className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${sel ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-slate-50 border-transparent text-slate-600"}`}>
                            <span className="text-xs font-bold truncate block">{m.name}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 ml-1">Assign Batch</label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select value={selectedBatchId} onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full pl-12 pr-10 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none appearance-none font-bold text-slate-700 cursor-pointer">
                  {batchesFetching ? <option>Loading...</option> : batches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({new Date(b.startDate).toLocaleDateString()})</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="p-8 bg-slate-50 border-t border-slate-200">
        {error && <div className="mb-4 p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl">{error}</div>}
        <div className="flex gap-4">
          {step === 2 && (
            <button onClick={() => setStep(1)} className="px-6 py-4 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all flex items-center gap-2">
              <ArrowLeft size={18} /> Back
            </button>
          )}
          <button onClick={step === 1 ? goToStep2 : handleSubmit} disabled={loading}
            className="flex-1 flex items-center justify-center gap-3 bg-indigo-600 text-white py-4 font-black rounded-2xl hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-200 transition-all disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" /> : <><span className="uppercase tracking-widest text-sm">{step === 1 ? "Next" : "Enroll Now"}</span><ChevronRight size={20} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}