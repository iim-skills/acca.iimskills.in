"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  CheckCircle2,
  XCircle,
  Search,
  BookOpen,
  User,
  Layers,
  Clock,
  ChevronDown,
  Loader2,
  Sparkles,
  RotateCcw,
  Check,
  Video,
  FileQuestion,
  FileText,
  Radio,
  GraduationCap,
  Award,
  AlertCircle,
  ExternalLink,
  FolderTree,
  ListOrdered,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ================= TYPES ================= */

type TopicItem = {
  id: string;
  itemId: string;
  type: "video" | "quiz" | "pdf" | "live" | string;
  name: string;
  duration?: number;
  url?: string;
  globalIndex?: number | null;
  quizId?: string;
  pdfId?: string;
};

type Submodule = {
  submoduleId: string;
  title: string;
  description?: string;
  items: TopicItem[];
};

type Module = {
  moduleId: string;
  name: string;
  description?: string;
  submodules: Submodule[];
  liveSessions?: TopicItem[];
};

type Course = {
  id: string | number;
  courseId: string;
  slug: string;
  name: string;
  description?: string;
  modulesCount: number;
  modules: Module[];
};

type StudentCourse = {
  course_slug?: string;
  course_title?: string;
  slug?: string;
  name?: string;
  courseId?: string;
  id?: string | number;
};

type Student = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  studentType?: string;
  status: string;
  enrolledAt?: string;
  courses: StudentCourse[];
  progress?: Record<string, any>;
};

type ProgressItemEntry = {
  positionSeconds?: number;
  duration?: number;
  completed?: boolean | number;
  updated_at?: string;
};

type SelectOption = {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeColor?: string;
};

/* ================= SEARCHABLE SELECT COMPONENT ================= */

function SearchableSelect({
  label,
  stepNumber,
  icon,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  value,
  options,
  onChange,
  disabled = false,
  headerRight,
  emptyMessage = "No matching options found",
}: {
  label: string;
  stepNumber: number;
  icon: React.ReactNode;
  placeholder?: string;
  searchPlaceholder?: string;
  value: string;
  options: SelectOption[];
  onChange: (val: string) => void;
  disabled?: boolean;
  headerRight?: React.ReactNode;
  emptyMessage?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search box when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q)) ||
        (opt.badge && opt.badge.toLowerCase().includes(q))
    );
  }, [options, query]);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} className="space-y-1.5 relative">
      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-black">
            {stepNumber}
          </span>
          {label}
        </span>
        {headerRight}
      </div>

      {/* Button to toggle dropdown */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full text-left pl-3.5 pr-8 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold flex items-center gap-2.5 transition shadow-2xs relative disabled:opacity-50 disabled:cursor-not-allowed ${
          isOpen
            ? "border-blue-500 ring-2 ring-blue-500/20 bg-white"
            : "border-slate-200 hover:border-blue-300 hover:bg-slate-100/60"
        }`}
      >
        <span className="text-slate-400 shrink-0">{icon}</span>
        <span className="truncate flex-1">
          {selectedOption ? (
            <span className="text-slate-900 font-bold">{selectedOption.label}</span>
          ) : (
            <span className="text-slate-400 font-normal">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          size={15}
          className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-blue-600" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu with Search Box */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden min-w-[260px]"
          >
            {/* Search Input Box */}
            <div className="p-2 border-b border-slate-100 bg-slate-50/80">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={searchPlaceholder}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-0.5"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Options List */}
            <div className="max-h-56 overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
              {filtered.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400 font-medium">
                  {emptyMessage}
                </div>
              ) : (
                filtered.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-start gap-2 group ${
                        isSelected
                          ? "bg-blue-50 text-blue-950 font-bold"
                          : "text-slate-700 hover:bg-slate-100 font-medium"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 justify-between">
                          <span className="truncate">{opt.label}</span>
                          {opt.badge && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase shrink-0 ${
                                opt.badgeColor || "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        {opt.sublabel && (
                          <p className="text-[10px] text-slate-400 truncate mt-0.5 font-normal">
                            {opt.sublabel}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <Check size={14} className="text-blue-600 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================= MAIN COMPONENT ================= */

export default function MarkCompletionPage() {
  /* ---------- STATE ---------- */
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Cascading Dropdown Selections
  const [selectedCourseSlug, setSelectedCourseSlug] = useState<string>("");
  const [selectedStudentEmail, setSelectedStudentEmail] = useState<string>("");
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [selectedSubmoduleId, setSelectedSubmoduleId] = useState<string>("");

  // Student toggle
  const [showAllStudents, setShowAllStudents] = useState(false);

  // Progress Matrix & Duration Overrides
  const [progressMap, setProgressMap] = useState<Record<string, ProgressItemEntry>>({});
  const [customDurations, setCustomDurations] = useState<Record<string, number>>({});
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  /* ---------- FETCH INITIAL DATA ---------- */
  const fetchData = async () => {
    try {
      setLoadingInitial(true);
      const res = await fetch("/api/admin/completion");
      const data = await res.json();

      if (data.success) {
        const fetchedCourses: Course[] = data.courses || [];
        const fetchedStudents: Student[] = data.students || [];

        setCourses(fetchedCourses);
        setStudents(fetchedStudents);

        // Auto-select first course if available
        if (fetchedCourses.length > 0) {
          const firstCourse = fetchedCourses[0];
          setSelectedCourseSlug(firstCourse.slug);

          if (firstCourse.modules?.length > 0) {
            const firstMod = firstCourse.modules[0];
            setSelectedModuleId(firstMod.moduleId);

            if (firstMod.submodules?.length > 0) {
              setSelectedSubmoduleId(firstMod.submodules[0].submoduleId);
            }
          }
        }
      } else {
        showToast("error", data.error || "Failed to load courses and students");
      }
    } catch (err: any) {
      console.error("fetchData error:", err);
      showToast("error", "Network error loading courses/students");
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ---------- HELPER: SHOW TOAST ---------- */
  const showToast = (type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => {
      setNotification((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  /* ---------- CURRENT COURSE OBJECT ---------- */
  const selectedCourse = useMemo(() => {
    if (!selectedCourseSlug) return null;
    return courses.find(
      (c) =>
        c.slug.toLowerCase() === selectedCourseSlug.toLowerCase() ||
        String(c.courseId) === String(selectedCourseSlug) ||
        String(c.id) === String(selectedCourseSlug)
    ) || null;
  }, [courses, selectedCourseSlug]);

  // Check if student is enrolled in the selected course
  const isStudentEnrolledInCourse = (st: Student, course: Course): boolean => {
    if (!Array.isArray(st.courses)) return false;
    const targetSlug = course.slug.toLowerCase();
    const targetTitle = course.name.toLowerCase();

    return st.courses.some((c) => {
      const cSlug = String(c.course_slug ?? c.slug ?? "").toLowerCase();
      const cTitle = String(c.course_title ?? c.name ?? "").toLowerCase();
      return (
        cSlug === targetSlug ||
        cTitle === targetTitle ||
        (targetSlug && cSlug.includes(targetSlug)) ||
        (targetTitle && cTitle.includes(targetTitle))
      );
    });
  };

  /* ---------- FILTERED STUDENTS FOR SELECTED COURSE ---------- */
  const availableStudents = useMemo(() => {
    let list = students;

    if (selectedCourse && !showAllStudents) {
      list = list.filter((st) => isStudentEnrolledInCourse(st, selectedCourse));
    }

    return list;
  }, [students, selectedCourse, showAllStudents]);

  const selectedStudent = useMemo(() => {
    if (!selectedStudentEmail) return null;
    return students.find((s) => s.email.toLowerCase() === selectedStudentEmail.toLowerCase()) || null;
  }, [students, selectedStudentEmail]);

  // When Course changes: update modules & auto-select first student & module & submodule
  const handleCourseChange = (newSlug: string) => {
    setSelectedCourseSlug(newSlug);
    const courseObj = courses.find((c) => c.slug === newSlug);

    // Auto select first module
    if (courseObj && courseObj.modules.length > 0) {
      const firstMod = courseObj.modules[0];
      setSelectedModuleId(firstMod.moduleId);

      if (firstMod.submodules.length > 0) {
        setSelectedSubmoduleId(firstMod.submodules[0].submoduleId);
      } else if (firstMod.liveSessions && firstMod.liveSessions.length > 0) {
        setSelectedSubmoduleId("__live_sessions__");
      } else {
        setSelectedSubmoduleId("");
      }
    } else {
      setSelectedModuleId("");
      setSelectedSubmoduleId("");
    }
  };

  // When Course or available students change: auto-select first student if current not valid
  useEffect(() => {
    if (availableStudents.length > 0) {
      const currentExists = availableStudents.some(
        (s) => s.email.toLowerCase() === selectedStudentEmail.toLowerCase()
      );
      if (!currentExists) {
        setSelectedStudentEmail(availableStudents[0].email);
      }
    } else {
      setSelectedStudentEmail("");
    }
  }, [availableStudents]);

  /* ---------- CURRENT MODULE OBJECT ---------- */
  const selectedModule = useMemo(() => {
    if (!selectedCourse || !selectedModuleId) return null;
    return selectedCourse.modules.find((m) => m.moduleId === selectedModuleId) || null;
  }, [selectedCourse, selectedModuleId]);

  // When Module changes: update submodule
  const handleModuleChange = (newModId: string) => {
    setSelectedModuleId(newModId);
    const modObj = selectedCourse?.modules.find((m) => m.moduleId === newModId);

    if (modObj && modObj.submodules.length > 0) {
      setSelectedSubmoduleId(modObj.submodules[0].submoduleId);
    } else if (modObj && modObj.liveSessions && modObj.liveSessions.length > 0) {
      setSelectedSubmoduleId("__live_sessions__");
    } else {
      setSelectedSubmoduleId("");
    }
  };

  /* ---------- CURRENT SUBMODULE OBJECT & TOPICS ---------- */
  const selectedSubmodule = useMemo(() => {
    if (!selectedModule || !selectedSubmoduleId) return null;
    if (selectedSubmoduleId === "__live_sessions__") {
      return {
        submoduleId: "__live_sessions__",
        title: "Live Recording Sessions",
        description: "Recorded live video sessions for this module",
        items: selectedModule.liveSessions || [],
      };
    }
    return selectedModule.submodules.find((s) => s.submoduleId === selectedSubmoduleId) || null;
  }, [selectedModule, selectedSubmoduleId]);

  const activeTopicsList: TopicItem[] = useMemo(() => {
    if (!selectedSubmodule) return [];
    return selectedSubmodule.items || [];
  }, [selectedSubmodule]);

  /* ---------- FETCH STUDENT PROGRESS WHEN STUDENT / COURSE CHANGES ---------- */
  const fetchStudentProgress = async () => {
    if (!selectedStudentEmail || !selectedCourse) {
      setProgressMap({});
      return;
    }

    try {
      const query = new URLSearchParams({
        studentEmail: selectedStudentEmail,
        courseSlug: selectedCourse.slug,
        courseId: selectedCourse.courseId || selectedCourse.slug,
      });

      const res = await fetch(`/api/admin/completion?${query.toString()}`);
      const data = await res.json();

      if (data.success && data.detailedProgress) {
        const rawProgress = data.detailedProgress;
        const normalized: Record<string, ProgressItemEntry> = {};

        Object.entries(rawProgress).forEach(([k, v]: [string, any]) => {
          if (k === "updated_at") return;
          if (k === "videos" && typeof v === "object") {
            Object.entries(v).forEach(([vk, vv]: [string, any]) => {
              normalized[vk] = {
                positionSeconds: Number(vv.position_sec ?? vv.positionSeconds ?? 0),
                duration: Number(vv.duration ?? 0),
                completed: Boolean(vv.completed),
                updated_at: vv.updated_at,
              };
            });
          } else if (v && typeof v === "object") {
            normalized[k] = {
              positionSeconds: Number(v.positionSeconds ?? v.position_sec ?? 0),
              duration: Number(v.duration ?? 0),
              completed: Boolean(v.completed),
              updated_at: v.updated_at,
            };
          }
        });

        setProgressMap(normalized);
      } else {
        setProgressMap({});
      }
    } catch (err) {
      console.error("fetchStudentProgress error:", err);
    }
  };

  useEffect(() => {
    fetchStudentProgress();
  }, [selectedStudentEmail, selectedCourseSlug]);

  /* ---------- HELPER: CHECK IF AN ITEM IS COMPLETED ---------- */
  const isItemCompleted = (item: TopicItem): boolean => {
    const keys = [
      item.id,
      item.itemId,
      item.quizId,
      item.quizId ? `quiz_${item.quizId}` : null,
      item.type === "quiz" && !item.id.startsWith("quiz_") ? `quiz_${item.id}` : null,
      item.type === "quiz" && item.id.startsWith("quiz_") ? item.id.replace("quiz_", "") : null,
      item.globalIndex !== null && item.globalIndex !== undefined ? `idx_${item.globalIndex}` : null,
      item.globalIndex !== null && item.globalIndex !== undefined ? `global_${item.globalIndex}` : null,
    ].filter(Boolean) as string[];

    for (const k of keys) {
      const entry = progressMap[k];
      if (entry && (entry.completed === true || entry.completed === 1)) {
        return true;
      }
    }
    return false;
  };

  const getItemProgressEntry = (item: TopicItem): ProgressItemEntry | null => {
    const keys = [
      item.id,
      item.itemId,
      item.quizId,
      item.quizId ? `quiz_${item.quizId}` : null,
      item.globalIndex !== null && item.globalIndex !== undefined ? `idx_${item.globalIndex}` : null,
    ].filter(Boolean) as string[];

    for (const k of keys) {
      if (progressMap[k]) return progressMap[k];
    }
    return null;
  };

  /* ---------- DURATION HELPERS ---------- */
  const getItemDuration = (item: TopicItem): number => {
    if (customDurations[item.id] !== undefined) {
      return customDurations[item.id];
    }
    const entry = getItemProgressEntry(item);
    if (entry?.duration && entry.duration > 0) {
      return entry.duration;
    }
    return item.duration && item.duration > 0 ? item.duration : 600; // 10 min default
  };

  const formatDurationText = (sec: number): string => {
    if (!sec || sec <= 0) return "0s";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}s`;
    if (s === 0) return `${m}m`;
    return `${m}m ${s}s`;
  };

  const handleDurationChange = (itemId: string, minutes: number) => {
    const sec = Math.max(0, Math.floor(minutes * 60));
    setCustomDurations((prev) => ({ ...prev, [itemId]: sec }));
  };

  /* ---------- ACTION: TOGGLE / MARK SINGLE TOPIC COMPLETE ---------- */
  const handleMarkItem = async (item: TopicItem, complete: boolean) => {
    if (!selectedStudent || !selectedCourse) {
      showToast("error", "Please select a course and student first");
      return;
    }

    const duration = getItemDuration(item);
    setUpdatingItemId(item.id);

    try {
      const payload = {
        studentEmail: selectedStudent.email,
        studentId: selectedStudent.id,
        courseSlug: selectedCourse.slug,
        courseId: selectedCourse.courseId || selectedCourse.slug,
        action: complete ? "mark_items" : "unmark_items",
        items: [
          {
            itemId: item.id,
            type: item.type,
            globalIndex: item.globalIndex,
            quizId: item.quizId,
            completed: complete,
            duration,
            positionSeconds: complete ? duration : 0,
          },
        ],
        defaultDuration: duration,
      };

      const res = await fetch("/api/admin/completion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        showToast("success", `${complete ? "Completed ✓" : "Reset"}: "${item.name}"`);
        fetchStudentProgress();
      } else {
        showToast("error", data.error || "Failed to update item status");
      }
    } catch (err: any) {
      console.error("handleMarkItem error:", err);
      showToast("error", "Network error updating completion status");
    } finally {
      setUpdatingItemId(null);
    }
  };

  /* ---------- ACTION: BULK MARK ALL IN CURRENT SUBMODULE ---------- */
  const handleMarkAllInSubmodule = async (complete: boolean) => {
    if (!selectedStudent || !selectedCourse || activeTopicsList.length === 0) return;

    if (
      !confirm(
        `Are you sure you want to mark all ${activeTopicsList.length} topics in "${selectedSubmodule?.title}" as ${
          complete ? "COMPLETED" : "INCOMPLETE"
        } for ${selectedStudent.name || selectedStudent.email}?`
      )
    ) {
      return;
    }

    setBulkUpdating(true);

    try {
      const itemsPayload = activeTopicsList.map((item) => {
        const duration = getItemDuration(item);
        return {
          itemId: item.id,
          type: item.type,
          globalIndex: item.globalIndex,
          quizId: item.quizId,
          completed: complete,
          duration,
          positionSeconds: complete ? duration : 0,
        };
      });

      const payload = {
        studentEmail: selectedStudent.email,
        studentId: selectedStudent.id,
        courseSlug: selectedCourse.slug,
        courseId: selectedCourse.courseId || selectedCourse.slug,
        action: complete ? "mark_items" : "unmark_items",
        items: itemsPayload,
      };

      const res = await fetch("/api/admin/completion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        showToast("success", `Marked ${activeTopicsList.length} topics as ${complete ? "completed" : "incomplete"}`);
        fetchStudentProgress();
      } else {
        showToast("error", data.error || "Failed to bulk update topics");
      }
    } catch (err: any) {
      console.error("handleMarkAllInSubmodule error:", err);
      showToast("error", "Network error during bulk update");
    } finally {
      setBulkUpdating(false);
    }
  };

  /* ---------- STATS FOR SUBMODULE ---------- */
  const submoduleCompletedCount = useMemo(() => {
    return activeTopicsList.filter((it) => isItemCompleted(it)).length;
  }, [activeTopicsList, progressMap]);

  const submoduleTotalCount = activeTopicsList.length;
  const submodulePercent = submoduleTotalCount > 0 ? Math.round((submoduleCompletedCount / submoduleTotalCount) * 100) : 0;

  /* ---------- OPTIONS BUILDERS FOR THE 4 DROPDOWNS ---------- */

  // 1. Course Options
  const courseOptions: SelectOption[] = useMemo(() => {
    return courses.map((c) => ({
      value: c.slug,
      label: c.name,
      sublabel: `Slug: ${c.slug}`,
      badge: `${c.modulesCount} modules`,
      badgeColor: "bg-blue-100 text-blue-800",
    }));
  }, [courses]);

  // 2. Student Options
  const studentOptions: SelectOption[] = useMemo(() => {
    return availableStudents.map((st) => ({
      value: st.email,
      label: st.name,
      sublabel: `${st.email}${st.phone ? ` • 📞 ${st.phone}` : ""}`,
      badge: st.studentType || "paid",
      badgeColor: st.studentType === "free" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700",
    }));
  }, [availableStudents]);

  // 3. Module Options
  const moduleOptions: SelectOption[] = useMemo(() => {
    if (!selectedCourse) return [];
    return selectedCourse.modules.map((m, idx) => ({
      value: m.moduleId,
      label: `Module ${idx + 1}: ${m.name}`,
      sublabel: m.description || `${m.submodules.length} submodules`,
      badge: `${m.submodules.length} subs`,
      badgeColor: "bg-indigo-100 text-indigo-800",
    }));
  }, [selectedCourse]);

  // 4. Submodule Options
  const submoduleOptions: SelectOption[] = useMemo(() => {
    if (!selectedModule) return [];
    const list: SelectOption[] = selectedModule.submodules.map((s, idx) => ({
      value: s.submoduleId,
      label: `Sub ${idx + 1}: ${s.title}`,
      sublabel: s.description || `${s.items.length} topics`,
      badge: `${s.items.length} topics`,
      badgeColor: "bg-slate-100 text-slate-700",
    }));

    if (selectedModule.liveSessions && selectedModule.liveSessions.length > 0) {
      list.push({
        value: "__live_sessions__",
        label: "Live Recording Sessions",
        sublabel: `${selectedModule.liveSessions.length} live recordings`,
        badge: "Live 🔴",
        badgeColor: "bg-rose-100 text-rose-800",
      });
    }

    return list;
  }, [selectedModule]);

  /* ---------- LOADING INITIAL ---------- */
  if (loadingInitial) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500">
        <Loader2 size={36} className="animate-spin text-blue-600" />
        <p className="font-medium text-sm">Loading course completion dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl font-medium text-sm border backdrop-blur-md ${
              notification.type === "success"
                ? "bg-emerald-600/95 text-white border-emerald-500 shadow-emerald-600/20"
                : "bg-rose-600/95 text-white border-rose-500 shadow-rose-600/20"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 size={18} className="shrink-0" />
            ) : (
              <AlertCircle size={18} className="shrink-0" />
            )}
            <span>{notification.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-xs font-semibold tracking-wide text-blue-200">
              <Sparkles size={13} className="text-amber-300" />
              Direct Session Completion Manager
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Mark Student Topic & Session Complete
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Use the 4 searchable dropdowns below to quickly find and select Course ➔ Student ➔ Module ➔ Submodule, then mark individual or all topics completed with watch durations.
            </p>
          </div>

          {selectedStudent && (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15 flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-inner">
                <GraduationCap size={22} />
              </div>
              <div>
                <p className="text-[11px] text-blue-200 font-semibold uppercase">Active Student</p>
                <p className="text-sm font-bold text-white leading-tight">{selectedStudent.name}</p>
                <p className="text-[11px] text-slate-300 truncate max-w-[160px]">{selectedStudent.email}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================
          THE 4 SEARCHABLE DROPDOWNS CARD
         ========================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
              <ListOrdered size={16} />
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Step-by-Step Searchable Selectors
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Type in search box inside any dropdown to filter instantly
          </span>
        </div>

        {/* DROPDOWNS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1st SEARCHABLE DROPDOWN: SELECT COURSE */}
          <SearchableSelect
            stepNumber={1}
            label="Select Course"
            icon={<BookOpen size={16} />}
            placeholder="Select a course..."
            searchPlaceholder="Search course name or slug..."
            value={selectedCourseSlug}
            options={courseOptions}
            onChange={handleCourseChange}
            headerRight={
              <span className="text-[10px] font-semibold text-slate-400">
                {courses.length} courses
              </span>
            }
          />

          {/* 2nd SEARCHABLE DROPDOWN: SELECT STUDENT */}
          <SearchableSelect
            stepNumber={2}
            label="Select Student"
            icon={<User size={16} />}
            placeholder="Select a student..."
            searchPlaceholder="Search name, email, phone..."
            value={selectedStudentEmail}
            options={studentOptions}
            onChange={(val) => setSelectedStudentEmail(val)}
            headerRight={
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAllStudents((prev) => !prev);
                }}
                className="text-[10px] text-blue-600 hover:underline font-semibold"
              >
                {showAllStudents ? "Enrolled Only" : "Show All"}
              </button>
            }
            emptyMessage={
              availableStudents.length === 0
                ? "No enrolled students found (click 'Show All' to view all)"
                : "No matching students found"
            }
          />

          {/* 3rd SEARCHABLE DROPDOWN: SELECT MODULE */}
          <SearchableSelect
            stepNumber={3}
            label="Select Module"
            icon={<Layers size={16} />}
            placeholder="Select a module..."
            searchPlaceholder="Search module name..."
            value={selectedModuleId}
            options={moduleOptions}
            onChange={handleModuleChange}
            disabled={!selectedCourse || moduleOptions.length === 0}
            headerRight={
              <span className="text-[10px] font-semibold text-slate-400">
                {moduleOptions.length} modules
              </span>
            }
            emptyMessage="No modules in this course"
          />

          {/* 4th SEARCHABLE DROPDOWN: SELECT SUBMODULE */}
          <SearchableSelect
            stepNumber={4}
            label="Select Submodule"
            icon={<FolderTree size={16} />}
            placeholder="Select a submodule..."
            searchPlaceholder="Search submodule..."
            value={selectedSubmoduleId}
            options={submoduleOptions}
            onChange={(val) => setSelectedSubmoduleId(val)}
            disabled={!selectedModule || submoduleOptions.length === 0}
            headerRight={
              <span className="text-[10px] font-semibold text-slate-400">
                {submoduleOptions.length} submodules
              </span>
            }
            emptyMessage="No submodules in this module"
          />
        </div>
      </div>

      {/* =========================================================
          TOPICS LIST & COMPLETION PANEL
         ========================================================= */}
      {selectedCourse && selectedStudent && selectedSubmodule ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden p-5 sm:p-7 space-y-6">
          {/* SUBMODULE SUMMARY & QUICK BULK ACTION HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase">
                  {selectedModule?.name}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-bold text-slate-500">
                  Submodule Topics List
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                {selectedSubmodule.title}
              </h2>
              {selectedSubmodule.description && (
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedSubmodule.description}
                </p>
              )}
            </div>

            {/* Submodule Progress & Bulk Complete Button */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-800">
                  {submoduleCompletedCount} / {submoduleTotalCount} Completed
                </p>
                <div className="w-32 h-2 bg-slate-100 rounded-full mt-1 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      submodulePercent === 100 ? "bg-emerald-500" : "bg-blue-600"
                    }`}
                    style={{ width: `${submodulePercent}%` }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleMarkAllInSubmodule(true)}
                disabled={bulkUpdating || activeTopicsList.length === 0}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {bulkUpdating ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                Mark All Complete
              </button>

              <button
                type="button"
                onClick={() => handleMarkAllInSubmodule(false)}
                disabled={bulkUpdating || activeTopicsList.length === 0}
                className="px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 text-xs font-bold rounded-xl transition disabled:opacity-50"
                title="Reset all topics in this submodule"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>

          {/* TOPICS LIST */}
          {activeTopicsList.length === 0 ? (
            <div className="text-center py-12 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <FileText size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No topics found in this submodule</p>
              <p className="text-xs text-slate-400 mt-1">Select another submodule from the dropdown above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeTopicsList.map((item, itemIdx) => {
                const completed = isItemCompleted(item);
                const isUpdating = updatingItemId === item.id;
                const currentDurSec = getItemDuration(item);
                const currentDurMin = Math.round(currentDurSec / 60);

                return (
                  <div
                    key={item.id || itemIdx}
                    className={`p-4 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      completed
                        ? "bg-emerald-50/50 border-emerald-200 shadow-2xs hover:bg-emerald-50/80"
                        : "bg-slate-50/60 border-slate-200 hover:bg-white hover:border-blue-200 hover:shadow-xs"
                    }`}
                  >
                    {/* Topic Icon + Info */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 shrink-0 mt-0.5">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-black">
                          {itemIdx + 1}
                        </span>

                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            item.type === "video"
                              ? "bg-blue-100 text-blue-700 shadow-xs shadow-blue-500/10"
                              : item.type === "quiz"
                              ? "bg-purple-100 text-purple-700 shadow-xs shadow-purple-500/10"
                              : item.type === "live"
                              ? "bg-rose-100 text-rose-700 shadow-xs shadow-rose-500/10"
                              : "bg-amber-100 text-amber-700 shadow-xs shadow-amber-500/10"
                          }`}
                        >
                          {item.type === "video" && <Video size={17} />}
                          {item.type === "quiz" && <FileQuestion size={17} />}
                          {item.type === "live" && <Radio size={17} />}
                          {item.type === "pdf" && <FileText size={17} />}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 leading-snug">
                            {item.name}
                          </h4>
                          {typeof item.globalIndex === "number" && (
                            <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded shrink-0">
                              #vid_{item.globalIndex}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center flex-wrap gap-2 mt-1.5 text-xs text-slate-500">
                          <span className="uppercase font-extrabold text-[10px] tracking-wider px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-700">
                            {item.type}
                          </span>
                          <span>•</span>
                          <span>Duration: <strong>{formatDurationText(currentDurSec)}</strong></span>
                          {item.url && (
                            <>
                              <span>•</span>
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:underline flex items-center gap-0.5 font-medium"
                              >
                                Preview <ExternalLink size={11} />
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge + Duration Adjuster + Mark Complete Action */}
                    <div className="flex items-center flex-wrap gap-3 shrink-0 self-end sm:self-center">
                      {/* Duration Minutes Input */}
                      <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600 shadow-2xs">
                        <Clock size={13} className="text-slate-400" />
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Dur:</span>
                        <input
                          type="number"
                          min={1}
                          max={300}
                          value={currentDurMin || 10}
                          onChange={(e) =>
                            handleDurationChange(item.id, Number(e.target.value))
                          }
                          className="w-10 text-center font-bold text-slate-800 focus:outline-none"
                          title="Set recorded duration in minutes"
                        />
                        <span className="text-[10px] text-slate-400 font-semibold">min</span>
                      </div>

                      {/* Status & Toggle Button */}
                      {completed ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs">
                            <CheckCircle2 size={14} />
                            Completed
                          </span>
                          <button
                            type="button"
                            onClick={() => handleMarkItem(item, false)}
                            disabled={isUpdating}
                            title="Mark as Incomplete"
                            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition disabled:opacity-50 shadow-2xs"
                          >
                            {isUpdating ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : (
                              <XCircle size={15} />
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-500 text-xs font-semibold">
                            <Clock size={12} />
                            Pending
                          </span>

                          <button
                            type="button"
                            onClick={() => handleMarkItem(item, true)}
                            disabled={isUpdating}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
                          >
                            {isUpdating ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Check size={14} />
                            )}
                            Mark Completed
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200">
          <BookOpen size={36} className="mx-auto text-slate-300 mb-2" />
          <p className="text-base font-bold text-slate-800">Select All 4 Dropdowns Above</p>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Choose Course ➔ Student ➔ Module ➔ Submodule to view and mark completion status for that topic list.
          </p>
        </div>
      )}
    </div>
  );
}
