"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Loader2,
  Pencil,
  Layers,
  Calendar,
  User,
  Mail,
  Phone,
  Check,
  BookOpen,
  Users,
  ChevronRight,
  Info,
  Square,
  CheckSquare
} from "lucide-react";

/* ================= TYPES ================= */
type Props = {
  studentId: number;
  onClose: () => void;
  onSaved?: () => void;
};

type Batch = {
  id: string | number;
  name: string;
  startDate?: string;
};

type Module = {
  id?: string | number;
  moduleId?: string | number;
  slug?: string;
  name?: string;
  summary?: string;
};

export default function EditEnrolPanel({ studentId, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /* ===== student fields ===== */
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [editingField, setEditingField] = useState<"name" | "email" | "phone" | null>(null);

  /* ===== modules ===== */
  const [allCourseModules, setAllCourseModules] = useState<Module[]>([]);
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);

  /* ===== batches ===== */
  const [batches, setBatches] = useState<Batch[]>([]);
  const [currentBatchName, setCurrentBatchName] = useState<string | null>(null);
  const [editingBatch, setEditingBatch] = useState(false);
  const [allowMultiBatches, setAllowMultiBatches] = useState(false);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);

  /* =====================================================
      HELPERS: module key detection
  ===================================================== */
  const moduleKeyFrom = (m: Module | string | null) => {
    if (m == null) return "";
    if (typeof m === "string") return m;
    return String(m.moduleId ?? m.id ?? m.slug ?? m.name ?? "");
  };

  /* =====================================================
      LOAD DATA
  ===================================================== */
  useEffect(() => {
    if (!studentId) return;

    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const [studentRes, courseRes, batchRes] = await Promise.all([
          fetch(`/api/admin/studentSec/enrol/${studentId}`),
          fetch("/api/admin/courses"),
          fetch("/api/admin/batches"),
        ]);

        if (!studentRes.ok) throw new Error("Failed to load student");

        const sj = await studentRes.json();
        const stud = sj.student;

        if (!mounted) return;

        setName(stud.name ?? "");
        setEmail(stud.email ?? "");
        setPhone(stud.phone ?? "");
        
        // Initialize selected modules from assigned modules
        const initialModules = Array.isArray(stud.modules) 
          ? stud.modules.map((m: Module | string) => moduleKeyFrom(m)) 
          : [];
        setSelectedModuleIds(initialModules);

        // Handle potentially multiple batches from API
        const batchIds = stud.batch_ids 
          ? stud.batch_ids.map(String) 
          : stud.batch_id ? [String(stud.batch_id)] : [];
        
        setSelectedBatchIds(batchIds);
        setCurrentBatchName(stud.batch_name ?? null);
        setAllowMultiBatches(batchIds.length > 1);

        /* ===== Load Course Modules ===== */
        if (courseRes.ok) {
          const courses = await courseRes.json();
          const arr = Array.isArray(courses) ? courses : [];
          const picked = arr.find((c: any) => c.slug === stud.course_slug) ?? arr[0] ?? null;

          let mods: Module[] = [];
          if (picked?.courseData) {
            try {
              const data = typeof picked.courseData === 'string' ? JSON.parse(picked.courseData) : picked.courseData;
              mods = data?.modules || picked.modules || [];
            } catch {
              mods = picked.modules || [];
            }
          } else {
            mods = picked?.modules || [];
          }
          setAllCourseModules(mods);
        }

        /* ===== batches ===== */
        if (batchRes.ok) {
          const bj = await batchRes.json();
          setBatches(Array.isArray(bj) ? bj : []);
        }
      } catch (err: any) {
        setError(err.message || "Load failed");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [studentId]);

  /* =====================================================
      HANDLERS
  ===================================================== */
  const toggleModule = (id: string) => {
    setSelectedModuleIds((prev: string[]) => 
      prev.includes(id) ? prev.filter((x: string) => x !== id) : [...prev, id]
    );
  };

  const toggleBatch = (id: string | number) => {
    const idStr = String(id);
    setSelectedBatchIds((prev: string[]) => {
      if (allowMultiBatches) {
        return prev.includes(idStr) ? prev.filter((x: string) => x !== idStr) : [...prev, idStr];
      }
      return [idStr];
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      // Find names for selected batches to send descriptive info
      const selectedBatchObjects = batches.filter((b: Batch) => selectedBatchIds.includes(String(b.id)));
      const combinedNames = selectedBatchObjects.map(b => b.name).join(", ");

      const res = await fetch(`/api/admin/studentSec/enrol/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modules: selectedModuleIds,
          batchIds: selectedBatchIds, // Sending array
          batchId: allowMultiBatches ? null : (selectedBatchIds[0] || null), // Legacy support
          batchName: combinedNames || null,
          name,
          email,
          phone,
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Save failed");
      }

      onSaved?.();
      onClose();
    } catch (err: any) {
      setError(err.message || "Save error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-50 flex justify-end" 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
      >
        <motion.div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="relative w-full max-w-xl bg-slate-50 shadow-2xl flex flex-col h-full"
        >
          {/* HEADER */}
          <div className="bg-indigo-900 text-white p-6 relative shrink-0">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold tracking-tight">Edit Enrollment</h3>
              <p className="text-indigo-200 text-sm">Update student details, modules, or batch</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-40 space-y-3 text-slate-500">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
                <p className="font-medium">Fetching student data...</p>
              </div>
            ) : (
              <>
                {error && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl text-sm font-medium border border-red-100">
                    <Info size={18} />
                    {error}
                  </div>
                )}

                {/* BASIC INFO */}
                <div className="space-y-5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <User size={14} /> Personal Information
                  </h4>
                  <div className="grid gap-5">
                    <EditableField 
                      label="Full Name" 
                      value={name} 
                      icon={<User size={18}/>}
                      editing={editingField === "name"} 
                      onEdit={() => setEditingField("name")} 
                      onCancel={() => setEditingField(null)} 
                      onChange={setName} 
                    />
                    <EditableField 
                      label="Email Address" 
                      value={email} 
                      icon={<Mail size={18}/>}
                      editing={editingField === "email"} 
                      onEdit={() => setEditingField("email")} 
                      onCancel={() => setEditingField(null)} 
                      onChange={setEmail} 
                    />
                    
                    <div className="space-y-1.5 relative group">
                      <label className="text-xs font-semibold text-slate-500 ml-1">Phone Number</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r pr-2 border-slate-200">
                          <Phone className="text-slate-400" size={18} />
                          <span className="text-sm font-medium text-slate-500">+91</span>
                        </div>
                        <input
                          type="tel"
                          disabled={editingField !== "phone"}
                          value={phone}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          className={`w-full pl-20 pr-12 py-3 border rounded-xl outline-none transition-all shadow-sm ${
                            editingField === "phone" ? "bg-white border-indigo-500 ring-2 ring-indigo-500/10" : "bg-slate-100 border-transparent cursor-not-allowed text-slate-600"
                          }`}
                        />
                        <button 
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors"
                          onClick={() => setEditingField(editingField === "phone" ? null : "phone")}
                        >
                          <Pencil size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* MODULE MANAGEMENT */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Layers size={14} /> Course Modules
                    </h4>
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                      {selectedModuleIds.length} SELECTED
                    </span>
                  </div>

                  <div className="grid gap-2">
                    {allCourseModules.length === 0 ? (
                      <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm">
                        No modules found for this course.
                      </div>
                    ) : (
                      allCourseModules.map((m: Module) => {
                        const id = moduleKeyFrom(m);
                        const isSelected = selectedModuleIds.includes(id);

                        return (
                          <button
                            key={`mod-${id}`}
                            onClick={() => toggleModule(id)}
                            className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all group ${
                              isSelected 
                                ? "bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200" 
                                : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                            }`}
                          >
                            <div className={`shrink-0 w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
                              isSelected ? "bg-indigo-600 border-indigo-600" : "bg-white border-slate-300"
                            }`}>
                              {isSelected && <Check size={14} className="text-white" />}
                            </div>
                            <div className="flex-1">
                              <div className={`font-semibold text-sm ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                                {m.name || id}
                              </div>
                              {m.summary && (
                                <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">{m.summary}</div>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* BATCH MANAGEMENT */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Calendar size={14} /> Batch Assignment
                    </h4>
                    <button 
                      onClick={() => setEditingBatch(!editingBatch)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      <Pencil size={12} /> {editingBatch ? "Cancel" : "Change Batch"}
                    </button>
                  </div>

                  {!editingBatch ? (
                    <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                        <Users size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-slate-700">
                          {selectedBatchIds.length > 0 
                            ? batches.filter(b => selectedBatchIds.includes(String(b.id))).map(b => b.name).join(", ")
                            : "Not Assigned"}
                        </div>
                        <div className="text-[11px] text-slate-400 uppercase font-medium">
                          {selectedBatchIds.length > 1 ? "Assigned batches" : "Current active batch"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      {/* Multiple Batch Toggle */}
                      <label className="flex items-center gap-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl cursor-pointer group">
                        <input 
                          type="checkbox" 
                          className="hidden"
                          checked={allowMultiBatches}
                          onChange={(e) => {
                            setAllowMultiBatches(e.target.checked);
                            // If switching to single mode, keep only the first selected batch
                            if (!e.target.checked && selectedBatchIds.length > 1) {
                              setSelectedBatchIds([selectedBatchIds[0]]);
                            }
                          }}
                        />
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          allowMultiBatches ? "bg-indigo-600 border-indigo-600" : "bg-white border-slate-300"
                        }`}>
                          {allowMultiBatches && <Check size={14} className="text-white" />}
                        </div>
                        <span className="text-xs font-bold text-indigo-900 uppercase tracking-tight">Allow Multiple Batch Assignment</span>
                      </label>

                      <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {batches.map((b: Batch) => {
                          const isSelected = selectedBatchIds.includes(String(b.id));
                          return (
                            <button
                              key={`batch-${b.id}`}
                              onClick={() => toggleBatch(b.id)}
                              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                                isSelected
                                  ? "bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500/20"
                                  : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {allowMultiBatches ? (
                                  <div className={`shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                    isSelected ? "bg-indigo-600 border-indigo-600" : "bg-white border-slate-300"
                                  }`}>
                                    {isSelected && <Check size={14} className="text-white" />}
                                  </div>
                                ) : (
                                  <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                                )}
                                <div className="text-left">
                                  <div className="text-sm font-bold text-slate-700">{b.name}</div>
                                  {b.startDate && (
                                    <div className="text-xs text-slate-400">Starts: {new Date(b.startDate).toLocaleDateString()}</div>
                                  )}
                                </div>
                              </div>
                              {isSelected && !allowMultiBatches && <Check size={16} className="text-indigo-600" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* FOOTER */}
          <div className="p-6 bg-white border-t border-slate-100 flex gap-3 shrink-0">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex-[2] flex items-center justify-center gap-2 bg-indigo-600 text-white p-3 font-bold rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-100 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>Save Changes</span>
                  <Check size={18} />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ===== BEAUTIFIED FIELD COMPONENT ===== */
function EditableField({ label, value, icon, editing, onEdit, onCancel, onChange }: any) {
  return (
    <div className="space-y-1.5 relative group">
      <label className="text-xs font-semibold text-slate-500 ml-1">{label}</label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </div>
        <input
          value={value}
          readOnly={!editing}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          className={`w-full pl-10 pr-12 py-3 border rounded-xl outline-none transition-all shadow-sm ${
            editing ? "bg-white border-indigo-500 ring-2 ring-indigo-500/10" : "bg-slate-100 border-transparent cursor-not-allowed text-slate-600"
          }`}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {editing ? (
            <button onClick={onCancel} className="px-2 py-1 text-[10px] font-bold text-red-600 hover:bg-red-50 rounded uppercase">Cancel</button>
          ) : (
            <button onClick={onEdit} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors"><Pencil size={14} /></button>
          )}
        </div>
      </div>
    </div>
  );
}