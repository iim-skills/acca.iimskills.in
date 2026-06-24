"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Loader2,
  Pencil,
  Calendar,
  User,
  Mail,
  Phone,
  Check,
  BookOpen,
  Users,
  ChevronRight,
  Info,
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

type Submodule = {
  submoduleId?: string | number;
  title?: string;
};

type Module = {
  id?: string | number;
  moduleId?: string | number;
  slug?: string;
  name?: string;
  summary?: string;
  submodules?: Submodule[];
  items?: any[];
};

type Course = {
  id?: string | number;
  slug?: string;
  name?: string;
  modules?: Module[] | any;
  courseData?: any;
};

/* ================= COMPONENT ================= */
export default function EditEnrolPanel({ studentId, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /* ===== student fields ===== */
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [studentType, setStudentType] = useState<"paid" | "free">("paid");
  const [editingField, setEditingField] = useState<"name" | "email" | "phone" | null>(null);

  /* ===== courses & modules ===== */
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
  const courseDropdownRef = useRef<HTMLDivElement | null>(null);

  const [selectedCourseSlugs, setSelectedCourseSlugs] = useState<string[]>([]);
  const [selectedModulesMap, setSelectedModulesMap] = useState<Record<string, string[]>>({});
  const [selectedSubmodulesMap, setSelectedSubmodulesMap] = useState<Record<string, Record<string, string[]>>>({});
  const [newModuleInputMap, setNewModuleInputMap] = useState<Record<string, string>>({});

  /* ===== batches ===== */
  const [batches, setBatches] = useState<Batch[]>([]);
  const [editingBatch, setEditingBatch] = useState(false);
  const [allowMultiBatches, setAllowMultiBatches] = useState(false);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);

  /* =====================================================
      HELPERS
  ===================================================== */
  const moduleKeyFrom = (m: Module | string | null): string => {
    if (m == null) return "";
    if (typeof m === "string") return m;
    return String(m.moduleId ?? m.id ?? m.slug ?? m.name ?? "");
  };

  const submoduleKeyFrom = (sm: Submodule | string | null): string => {
    if (sm == null) return "";
    if (typeof sm === "string") return sm;
    return String(sm.submoduleId ?? sm.title ?? "");
  };

  const getCourseBySlug = (slug?: string) =>
    courses.find((c) => String(c.slug ?? c.id ?? c.name) === slug);

  const getModulesForCourse = (course?: Course): Module[] => {
    if (!course) return [];
    if (course.modules && Array.isArray(course.modules)) return course.modules;
    if (course.courseData) {
      try {
        const data =
          typeof course.courseData === "string"
            ? JSON.parse(course.courseData)
            : course.courseData;
        return data?.modules || [];
      } catch {
        return course.modules || [];
      }
    }
    return [];
  };

  const getSubmodulesForModule = (module?: Module): Submodule[] => {
    if (!module) return [];
    if (module.submodules && Array.isArray(module.submodules)) return module.submodules;
    if (module.items && Array.isArray(module.items)) {
      return module.items.filter((item) => item.type === "submodule");
    }
    return [];
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
        setStudentType(stud.student_type === "free" ? "free" : "paid");

        const initialCourseSlugs: string[] = [];
        const initialModulesMap: Record<string, string[]> = {};
        const initialSubmodulesMap: Record<string, Record<string, string[]>> = {};
        const collectedBatchIds: string[] = [];

        if (Array.isArray(stud.courses) && stud.courses.length) {
          for (const c of stud.courses) {
            const slug = String(c.course_slug ?? c.slug ?? c.id ?? c.name ?? "");
            if (!slug) continue;
            initialCourseSlugs.push(slug);

            const mods =
              Array.isArray(c.modules)
                ? c.modules.map((m: any) => moduleKeyFrom(m))
                : typeof c.modules === "string" && c.modules.includes("[")
                ? JSON.parse(c.modules).map((m: any) => moduleKeyFrom(m))
                : [];

            if (stud.student_type === "free" && c.submodules && typeof c.submodules === "object") {
              const submods =
                typeof c.submodules === "string" ? JSON.parse(c.submodules) : c.submodules;
              initialSubmodulesMap[slug] = Object.keys(submods).reduce(
                (acc, key) => {
                  acc[key] = (submods[key] || []).map(submoduleKeyFrom);
                  return acc;
                },
                {} as Record<string, string[]>
              );
            }

            initialModulesMap[slug] = mods;
            if (c.batch_id) collectedBatchIds.push(String(c.batch_id));
          }
        } else {
          if (stud.course_slug) {
            const slug = String(stud.course_slug);
            initialCourseSlugs.push(slug);
            if (Array.isArray(stud.modules)) {
              initialModulesMap[slug] = stud.modules.map((m: any) => moduleKeyFrom(m));
            } else if (typeof stud.modules === "string" && stud.modules.includes("[")) {
              try {
                initialModulesMap[slug] = (JSON.parse(stud.modules) as any[]).map((m: any) =>
                  moduleKeyFrom(m)
                );
              } catch {
                initialModulesMap[slug] = [];
              }
            } else {
              initialModulesMap[slug] = [];
            }
            if (stud.batch_id) collectedBatchIds.push(String(stud.batch_id));
          }
        }

        setSelectedCourseSlugs(initialCourseSlugs);
        setSelectedModulesMap(initialModulesMap);
        setSelectedSubmodulesMap(initialSubmodulesMap);

        if (courseRes.ok) {
          const courseList = await courseRes.json();
          setCourses(Array.isArray(courseList) ? courseList : []);
        }

        if (batchRes.ok) {
          const bj = await batchRes.json();
          setBatches(Array.isArray(bj) ? bj : []);
        }

        const batchIdsFromStud = Array.isArray(stud.batch_ids)
          ? stud.batch_ids.map(String)
          : stud.batch_id
          ? [String(stud.batch_id)]
          : [];
        const mergedBatchIds = Array.from(new Set([...batchIdsFromStud, ...collectedBatchIds]));
        setSelectedBatchIds(mergedBatchIds);
        setAllowMultiBatches(mergedBatchIds.length > 1);
      } catch (err: any) {
        setError(err.message || "Load failed");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [studentId]);

  /* =====================================================
      CLICK OUTSIDE FOR COURSE DROPDOWN
  ===================================================== */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        courseDropdownRef.current &&
        !courseDropdownRef.current.contains(event.target as Node)
      ) {
        setCourseDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* =====================================================
      HANDLERS
  ===================================================== */
  const toggleCourse = (slug: string) => {
    setSelectedCourseSlugs((prev) => {
      if (prev.includes(slug)) {
        setSelectedModulesMap((m) => {
          const copy = { ...m };
          delete copy[slug];
          return copy;
        });
        setSelectedSubmodulesMap((sm) => {
          const copy = { ...sm };
          delete copy[slug];
          return copy;
        });
        setNewModuleInputMap((m) => {
          const copy = { ...m };
          delete copy[slug];
          return copy;
        });
        return prev.filter((s) => s !== slug);
      } else {
        setSelectedModulesMap((m) => ({ ...m, [slug]: m[slug] ?? [] }));
        setSelectedSubmodulesMap((sm) => ({ ...sm, [slug]: sm[slug] ?? {} }));
        return [...prev, slug];
      }
    });
  };

  const toggleModuleForCourse = (courseSlug: string, moduleId: string) => {
    setSelectedModulesMap((prev) => {
      const arr = prev[courseSlug] || [];
      const isSelected = arr.includes(moduleId);

      if (isSelected) {
        setSelectedSubmodulesMap((sm) => {
          const courseSubmodules = sm[courseSlug] ?? {};
          if (courseSubmodules[moduleId]) {
            const { [moduleId]: _, ...rest } = courseSubmodules;
            return { ...sm, [courseSlug]: rest };
          }
          return sm;
        });
        return { ...prev, [courseSlug]: arr.filter((x) => x !== moduleId) };
      } else {
        setSelectedSubmodulesMap((sm) => ({
          ...sm,
          [courseSlug]: {
            ...(sm[courseSlug] || {}),
            [moduleId]: sm[courseSlug]?.[moduleId] || [],
          },
        }));
        return { ...prev, [courseSlug]: [...arr, moduleId] };
      }
    });
  };

  const toggleSubmodule = (courseSlug: string, moduleId: string, submoduleId: string) => {
    setSelectedSubmodulesMap((prev) => {
      const courseMap = prev[courseSlug] ?? {};
      const moduleMap = courseMap[moduleId] ?? [];
      const newModuleMap = moduleMap.includes(submoduleId)
        ? moduleMap.filter((id) => id !== submoduleId)
        : [...moduleMap, submoduleId];
      return {
        ...prev,
        [courseSlug]: {
          ...courseMap,
          [moduleId]: newModuleMap,
        },
      };
    });
  };

  const isModuleSelected = (courseSlug: string, moduleId: string) =>
    (selectedModulesMap[courseSlug] || []).includes(moduleId);

  const addModule = (courseSlug: string) => {
    const val = (newModuleInputMap[courseSlug] || "").trim();
    if (!val) return;
    setSelectedModulesMap((prev) => {
      const arr = prev[courseSlug] || [];
      if (arr.includes(val)) return prev;
      return { ...prev, [courseSlug]: [...arr, val] };
    });
    setNewModuleInputMap((m) => ({ ...m, [courseSlug]: "" }));
  };

  const toggleBatch = (id: string | number) => {
    const idStr = String(id);
    setSelectedBatchIds((prev: string[]) => {
      if (allowMultiBatches) {
        return prev.includes(idStr) ? prev.filter((x) => x !== idStr) : [...prev, idStr];
      }
      return [idStr];
    });
  };

  const setAllModulesForCourse = (courseSlug: string, modulesArr: any[], value: boolean) => {
    const ids = modulesArr.map((m: any) => moduleKeyFrom(m)).filter(Boolean);
    setSelectedModulesMap((prev) => ({ ...prev, [courseSlug]: value ? ids : [] }));
  };

  const areAllModulesSelected = (courseSlug: string, modulesArr: any[]) => {
    if (!modulesArr || modulesArr.length === 0) return false;
    const ids = modulesArr.map((m: any) => moduleKeyFrom(m)).filter(Boolean);
    const sel = selectedModulesMap[courseSlug] || [];
    return ids.length > 0 && ids.every((id) => sel.includes(id));
  };

  /* =====================================================
      SAVE
  ===================================================== */
  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      const selectedBatchObjects = batches.filter((b: Batch) =>
        selectedBatchIds.includes(String(b.id))
      );
      const combinedNames = selectedBatchObjects.map((b) => b.name).join(", ");

      const payload = {
        modules: ([] as string[]).concat(...Object.values(selectedModulesMap)),
        courseSlugs: selectedCourseSlugs,
        modulesMap: selectedModulesMap,
        submodulesMap: studentType === "free" ? selectedSubmodulesMap : {},
        batchIds: selectedBatchIds,
        batchId: allowMultiBatches ? null : selectedBatchIds[0] || null,
        batchName: combinedNames || null,
        name,
        email,
        phone,
        studentType,
      };

      const res = await fetch(`/api/admin/studentSec/enrol/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  /* =====================================================
      UI
  ===================================================== */
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex justify-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={onClose}
        />

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
                      icon={<User size={18} />}
                      editing={editingField === "name"}
                      onEdit={() => setEditingField("name")}
                      onCancel={() => setEditingField(null)}
                      onChange={setName}
                    />
                    <EditableField
                      label="Email Address"
                      value={email}
                      icon={<Mail size={18} />}
                      editing={editingField === "email"}
                      onEdit={() => setEditingField("email")}
                      onCancel={() => setEditingField(null)}
                      onChange={setEmail}
                    />

                    {/* PHONE */}
                    <div className="space-y-1.5 relative group">
                      <label className="text-xs font-semibold text-slate-500 ml-1">
                        Phone Number
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r pr-2 border-slate-200">
                          <Phone className="text-slate-400" size={18} />
                          <span className="text-sm font-medium text-slate-500">+91</span>
                        </div>
                        <input
                          type="tel"
                          disabled={editingField !== "phone"}
                          value={phone}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                          }
                          className={`w-full pl-20 pr-12 py-3 border rounded-xl outline-none transition-all shadow-sm ${
                            editingField === "phone"
                              ? "bg-white border-indigo-500 ring-2 ring-indigo-500/10"
                              : "bg-slate-100 border-transparent cursor-not-allowed text-slate-600"
                          }`}
                        />
                        <button
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors"
                          onClick={() =>
                            setEditingField(editingField === "phone" ? null : "phone")
                          }
                        >
                          <Pencil size={14} />
                        </button>
                      </div>
                    </div>

                    {/* STUDENT TYPE */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 ml-1">
                        User Type
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setStudentType("paid")}
                          className={`rounded-xl border px-4 py-3 text-left transition-all ${
                            studentType === "paid"
                              ? "border-indigo-500 bg-indigo-50 text-indigo-900"
                              : "border-slate-200 bg-white text-slate-700"
                          }`}
                        >
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Paid
                          </div>
                          <div className="mt-1 text-sm font-bold">Full access user</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setStudentType("free")}
                          className={`rounded-xl border px-4 py-3 text-left transition-all ${
                            studentType === "free"
                              ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                              : "border-slate-200 bg-white text-slate-700"
                          }`}
                        >
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Free
                          </div>
                          <div className="mt-1 text-sm font-bold">Admin-managed free user</div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* COURSE & MODULE MANAGEMENT */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <BookOpen size={14} /> Academic Path
                    </h4>
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                      {selectedCourseSlugs.length} COURSES
                    </span>
                  </div>

                  {/* Course dropdown */}
                  <div ref={courseDropdownRef} className="space-y-2 relative">
                    <button
                      type="button"
                      onClick={() => setCourseDropdownOpen(!courseDropdownOpen)}
                      className={`w-full flex items-center justify-between px-5 py-3 bg-white border-2 rounded-2xl transition-all ${
                        courseDropdownOpen
                          ? "border-indigo-600 ring-4 ring-indigo-50"
                          : "border-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden text-left">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                          <BookOpen size={18} />
                        </div>
                        <div className="truncate">
                          <div className="text-sm font-bold text-slate-900 leading-none mb-1">
                            {selectedCourseSlugs.length === 0
                              ? "Browse Courses"
                              : `${selectedCourseSlugs.length} Selected`}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {selectedCourseSlugs.length === 0
                              ? "Select programs"
                              : selectedCourseSlugs
                                  .map((s) => getCourseBySlug(s)?.name)
                                  .join(", ")}
                          </div>
                        </div>
                      </div>
                      <ChevronRight
                        size={20}
                        className={`text-slate-400 transition-transform ${
                          courseDropdownOpen ? "rotate-90" : ""
                        }`}
                      />
                    </button>

                    {courseDropdownOpen && (
                      <div className="absolute z-50 w-[calc(100%-32px)] mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 max-h-64 overflow-auto">
                        {courses.map((c) => {
                          const slug = String(c.slug ?? c.id ?? c.name);
                          const selected = selectedCourseSlugs.includes(slug);
                          return (
                            <div
                              key={slug}
                              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer ${
                                selected ? "bg-indigo-50" : "hover:bg-slate-50"
                              }`}
                            >
                              <div
                                onClick={() => toggleCourse(slug)}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                  selected
                                    ? "bg-indigo-600 border-indigo-600"
                                    : "border-slate-200"
                                }`}
                              >
                                {selected && <Check size={12} className="text-white" />}
                              </div>
                              <span className="text-sm font-bold text-slate-700">{c.name}</span>
                              <div className="ml-auto text-xs text-slate-400">{c.id}</div>
                            </div>
                          );
                        })}
                        {courses.length === 0 && (
                          <div className="p-3 text-slate-500 text-sm">No courses available</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Per-course module selection */}
                  <div className="space-y-3">
                    {selectedCourseSlugs.length === 0 ? (
                      <div className="p-4 text-sm text-slate-500 border-2 border-dashed rounded-xl">
                        No course selected.
                      </div>
                    ) : (
                      selectedCourseSlugs.map((slug) => {
                        const course = getCourseBySlug(slug);
                        const modules = getModulesForCourse(course);
                        const assigned = selectedModulesMap[slug] ?? [];

                        return (
                          <div
                            key={`course-${slug}`}
                            className="border-2 border-slate-100 rounded-3xl p-5"
                          >
                            {/* Course header */}
                            <div className="flex justify-between items-center mb-4">
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">
                                  {course?.name ?? slug}
                                </span>
                                <label className="ml-2 flex items-center gap-2 text-[12px] font-medium">
                                  <input
                                    type="checkbox"
                                    checked={areAllModulesSelected(slug, modules)}
                                    onChange={(e) =>
                                      setAllModulesForCourse(slug, modules, e.target.checked)
                                    }
                                    disabled={!modules || modules.length === 0}
                                    className="w-4 h-4"
                                  />
                                  <span className="text-[10px] uppercase text-slate-600 font-bold">
                                    Select all
                                  </span>
                                </label>
                              </div>
                              <button
                                onClick={() =>
                                  setSelectedModulesMap((m) => ({ ...m, [slug]: [] }))
                                }
                                className="text-[10px] font-bold text-slate-400 uppercase"
                              >
                                Clear
                              </button>
                            </div>

                            {/* Module grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {modules.length === 0 && (
                                <div className="p-4 text-sm text-slate-500 border-2 border-dashed rounded-xl">
                                  No modules found for this course.
                                </div>
                              )}
                              {modules.map((m: any) => {
                                const id = moduleKeyFrom(m);
                                const sel = isModuleSelected(slug, id);
                                return (
                                  <div
                                    key={`${slug}-${id}`}
                                    onClick={() => toggleModuleForCourse(slug, id)}
                                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                                      sel
                                        ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100"
                                        : "bg-slate-50 border-transparent text-slate-600"
                                    }`}
                                  >
                                    <span className="text-xs font-bold truncate block">
                                      {m.name ?? id}
                                    </span>
                                    {m.summary && (
                                      <div className="text-[11px] mt-1 text-slate-300">
                                        {m.summary}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Submodules for FREE users */}
                            {studentType === "free" && assigned.length > 0 && (
                              <div className="mt-4 space-y-3 pt-4 border-t border-slate-200">
                                {modules
                                  .filter((m: any) => assigned.includes(moduleKeyFrom(m)))
                                  .map((m: any) => {
                                    const submodules = getSubmodulesForModule(m);
                                    if (submodules.length === 0) return null;
                                    const moduleId = moduleKeyFrom(m);
                                    return (
                                      <div
                                        key={`sub-for-mod-${moduleId}`}
                                        className="p-3 bg-slate-50 rounded-xl"
                                      >
                                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                          Sub-modules for:{" "}
                                          <span className="text-indigo-700">{m.name}</span>
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                          {submodules.map((sm: any) => {
                                            const smId = submoduleKeyFrom(sm);
                                            const isSubSelected = (
                                              selectedSubmodulesMap[slug]?.[moduleId] ?? []
                                            ).includes(smId);
                                            return (
                                              <div
                                                key={`${slug}-${moduleId}-${smId}`}
                                                onClick={() =>
                                                  toggleSubmodule(slug, moduleId, smId)
                                                }
                                                className={`p-2 rounded-lg border-2 transition-all cursor-pointer text-xs ${
                                                  isSubSelected
                                                    ? "bg-blue-500 border-blue-500 text-white"
                                                    : "bg-white border-transparent text-slate-500"
                                                }`}
                                              >
                                                {sm.title ?? smId}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            )}
                          </div> // ← closes <div key={`course-${slug}`}>
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
                            ? batches
                                .filter((b) => selectedBatchIds.includes(String(b.id)))
                                .map((b) => b.name)
                                .join(", ")
                            : "Not Assigned"}
                        </div>
                        <div className="text-[11px] text-slate-400 uppercase font-medium">
                          {selectedBatchIds.length > 1
                            ? "Assigned batches"
                            : "Current active batch"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <label className="flex items-center gap-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl cursor-pointer group">
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={allowMultiBatches}
                          onChange={(e) => {
                            setAllowMultiBatches(e.target.checked);
                            if (!e.target.checked && selectedBatchIds.length > 1) {
                              setSelectedBatchIds([selectedBatchIds[0]]);
                            }
                          }}
                        />
                        <div
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                            allowMultiBatches
                              ? "bg-indigo-600 border-indigo-600"
                              : "bg-white border-slate-300"
                          }`}
                        >
                          {allowMultiBatches && <Check size={12} className="text-white" />}
                        </div>
                        <span className="text-xs font-bold text-indigo-900 uppercase tracking-tight">
                          Allow Multiple Batch Assignment
                        </span>
                      </label>

                      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
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
                                  <div
                                    className={`shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                      isSelected
                                        ? "bg-indigo-600 border-indigo-600"
                                        : "bg-white border-slate-300"
                                    }`}
                                  >
                                    {isSelected && <Check size={12} className="text-white" />}
                                  </div>
                                ) : (
                                  <div
                                    className={`w-2 h-2 rounded-full ${
                                      isSelected ? "bg-indigo-600" : "bg-slate-300"
                                    }`}
                                  />
                                )}
                                <div className="text-left">
                                  <div className="text-sm font-bold text-slate-700">{b.name}</div>
                                  {b.startDate && (
                                    <div className="text-xs text-slate-400">
                                      Starts: {new Date(b.startDate).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {isSelected && !allowMultiBatches && (
                                <Check size={16} className="text-indigo-600" />
                              )}
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

/* ===== EDITABLE FIELD COMPONENT ===== */
function EditableField({
  label,
  value,
  icon,
  editing,
  onEdit,
  onCancel,
  onChange,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5 relative group">
      <label className="text-xs font-semibold text-slate-500 ml-1">{label}</label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>
        <input
          value={value}
          readOnly={!editing}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          className={`w-full pl-10 pr-12 py-3 border rounded-xl outline-none transition-all shadow-sm ${
            editing
              ? "bg-white border-indigo-500 ring-2 ring-indigo-500/10"
              : "bg-slate-100 border-transparent cursor-not-allowed text-slate-600"
          }`}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {editing ? (
            <button
              onClick={onCancel}
              className="px-2 py-1 text-[10px] font-bold text-red-600 hover:bg-red-50 rounded uppercase"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={onEdit}
              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}