"use client";

import React, { useEffect, useState } from "react";
import { 
  X, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  User, 
  Mail, 
  Phone as PhoneIcon, 
  BookOpen, 
  Check, 
  ChevronRight, 
  GraduationCap,
  Sparkles
} from "lucide-react";

// react-phone-input-2
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

type EnrolModalProps = {
  onClose: () => void;
  adminName?: string;
};

export default function EnrolModal({ onClose, adminName }: EnrolModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // STEP 1 - student details
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Programs (only second is active internally)
  const skillsSlug = "acca-skills-level";

  // STEP 2 - course & modules
  const [availableCourse, setAvailableCourse] = useState<any | null>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  /* -------- LOAD COURSES / MODULES -------- */
  useEffect(() => {
    fetch("/api/admin/courses")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load courses");
        return res.json();
      })
      .then((data) => {
        const skills = Array.isArray(data) ? data.find((c: any) => c.slug === skillsSlug) : null;
        if (skills) {
          setAvailableCourse(skills);
          setModules(Array.isArray(skills.modules) ? skills.modules : []);
        } else {
          setAvailableCourse(null);
          setModules([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching courses:", err);
        setAvailableCourse(null);
        setModules([]);
      });
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

    setLoading(true);
    try {
      const res = await fetch("/api/lms/enrol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          courseSlug: availableCourse.slug,
          courseTitle: availableCourse.name,
          modules: selectedModules,
          enrolledBy: adminName || "Admin",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Enrollment failed");
      onClose();
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      {/* Modal Container */}
      <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl relative overflow-hidden transition-all transform animate-in fade-in zoom-in duration-300">
        
        {/* Header Section */}
        <div className="bg-[#0f172a] p-10 text-white relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 -left-20 w-40 h-40 bg-blue-600/10 rounded-full blur-[60px]" />
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>

          
           <div className="flex items-center gap-4 mb-8">
              <div className="p-3.5 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl shadow-xl shadow-indigo-500/30 border border-white/10">
                <GraduationCap size={32} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-indigo-300/90">LMS Internal Systems</p>
                </div>
                <h2 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                  Quick Enrol
                </h2>
              </div>
            </div>
           
          
             <div className="space-y-1">
              <h3 className="text-xl font-bold flex items-center gap-2">
                {step === 1 ? (
                  <><User size={20} className="text-indigo-400" /> Learner Profile</>
                ) : (
                  <><Sparkles size={20} className="text-indigo-400" />
                  {/* <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-tighter">Current Course</div> */}
                  <div className="font-bold text-lg">{availableCourse?.name ?? "ACCA Skills Level"}</div>
                  </>
                )}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed max-w-[90%]">
                {step === 1 
                  ? "Initialize the learning path by creating a student record." 
                  : "Assign modules for the Student Requirements."}
              </p>
            </div>
        </div>

        {/* Progress Bar */}
        <div className="px-8 flex gap-2 my-6">
          <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-indigo-600' : 'bg-gray-100'}`} />
          <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-100'}`} />
        </div>

        <div className="px-8 pb-8">
          {/* ---------- STEP 1 ---------- */}
          {step === 1 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-4">
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                  <input
                    placeholder="Full Student Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all outline-none text-gray-900 font-medium"
                  />
                </div>

                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                  <input
                    placeholder="Academic Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all outline-none text-gray-900 font-medium"
                  />
                </div>

                {/* Updated Phone input: react-phone-input-2 with flags & country codes */}
                <div className="relative group">
                  {/* removed the previous absolute Phone icon to avoid overlap with flag */}
                  <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 opacity-0 pointer-events-none" size={18} />
                  <div className="w-full">
                    <PhoneInput
                      country={"in"}
                      value={phone}
                      onChange={(value: string) => setPhone(value)}
                      enableSearch
                      // show country code dropdown with flags
                      // styling props: containerClass, inputClass, buttonClass to integrate with tailwind styles
                      containerClass="p-2 rounded-2xl bg-slate-50 border border-red-100 text-red-600 text-[13px] font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2"
                      buttonClass="react-phone-button !border-0"
                      inputClass="!py-2 !text-gray-400 !border-none !bg-transparent focus:!bg-transparent focus:!border-none focus:ring-0"
                      dropdownClass="react-phone-dropdown !border-0"
                      // optional: make country code editable if you like (default true)
                      // countryCodeEditable={false}
                      placeholder="Contact Number"
                      // supply inputProps for accessibility / name
                      inputProps={{
                        name: "phone",
                        required: true,
                        autoFocus: false,
                      }}
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="">
                   <div className="w-1 h-4 bg-gray-600 rounded-full" />
                   {error}
                </div>
              )}

              <button
                onClick={() => {
                  if (!name || !email || !phone) {
                    setError("Complete all identity fields to proceed");
                    return;
                  }
                  setError("");
                  setStep(2);
                }}
                className="w-full py-4 mt-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
              >
                Configure Modules <ChevronRight size={20} />
              </button>
            </div>
          )}

          {/* ---------- STEP 2 ---------- */}
          {step === 2 && (
            <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
              {/* <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Selected Track</span>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                  {availableCourse?.slug === skillsSlug ? "ACCA Skills" : "LMS Standard"}
                </span>
              </div> */}

              {/* <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between group">
                <div>
                  <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-tighter">Current Course</div>
                  <div className="font-bold text-lg">{availableCourse?.name ?? "ACCA Skills Level"}</div>
                </div>
                <BookOpen className="text-indigo-400 opacity-20 group-hover:opacity-100 transition-opacity" size={24} />
              </div> */}

              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-2 custom-scrollbar">
                {modules.length ? (
                  <div className="grid grid-cols-1 gap-3">
                    {modules.map((m: any) => {
                      const id = m.moduleId ?? m.id ?? m.slug ?? String(m.name);
                      const isSelected = selectedModules.includes(id);
                      return (
                        <button
                          key={id}
                          onClick={() => toggleModule(id)}
                          className={`flex items-center gap-4 p-2 rounded-2xl border-2 text-left transition-all ${
                            isSelected 
                              ? "bg-indigo-50 border-indigo-600 ring-2 ring-indigo-600/10" 
                              : "bg-white border-gray-100 hover:border-gray-200"
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-gray-200"
                          }`}>
                            {isSelected && <Check size={14} strokeWidth={4} />}
                          </div>
                          <div className="flex-1">
                            <div className={`font-bold text-sm ${isSelected ? "text-indigo-900" : "text-gray-700"}`}>
                              {m.name}
                            </div>
                            {/* <div className={`text-[10px] font-mono mt-0.5 ${isSelected ? "text-indigo-400" : "text-gray-400"}`}>
                              ID: {id}
                            </div> */}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                       <BookOpen className="text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-400 font-medium italic">Scanning for available modules...</p>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-semibold flex items-center gap-2">
                   <div className="w-1 h-4 bg-red-600 rounded-full" />
                   {error}
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-4 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-500 font-bold transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-50 flex-1 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      Complete Enrollment
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }

        /* small overrides for react-phone-input-2 to better match tailwind look */
        // .react-phone-container .react-tel-input {
        //   width: 100%;
        // }
        // .react-phone-container {
        //   height: auto;
        // }
        // .react-phone-container .flag-dropdown {
        //   border-radius: 0.75rem 0 0 0.75rem;
        //   border: none;
        // }
        // .react-phone-container .selected-flag {
        //   padding-left: 0.6rem;
        // }
        // .react-phone-button {
        //   border-radius: 0.75rem;
        // }
      `}</style>
    </div>
  );
}
