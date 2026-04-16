"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FaUserGraduate, FaBook } from "react-icons/fa";
import {
  Calendar,
  Mail,
  Pencil,
  Plus,
  Trash2,
  Search,
  ChevronDown,
  Check,
  Loader2,
  Users,
} from "lucide-react";
import EnrolModal from "@/admin/StudentSec/EnrolModal";
import EditEnrolPanel from "./StudentSec/enrol/edit/page";
import { motion, AnimatePresence } from "framer-motion";

/* ================= TYPES ================= */
type CourseItem = {
  course_slug: string;
  course_title: string;
  modules?: string[];
  progress?: Record<string, any>;
  batch_id?: number | string | null;
  batch_name?: string;
  enrolled_at?: string | null;
};

type Student = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  courses?: CourseItem[];
  course?: string;
  assignedModules?: string[];
  status?: string;
  enrolledAt?: string | null;
};

/* ================= Module name map ================= */
const moduleNameMap: Record<string, string> = {
  MOD_1: "Corporate & Business Law (Global)",
  MOD_2: "Performance Management",
};

/* ================= Helpers ================= */
function safeParseJSON<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeModules(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      const parsed = safeParseJSON<any>(trimmed, []);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
      return [];
    }

    return trimmed
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
  }

  return [];
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString();
  } catch {
    return "—";
  }
}

/* ================= COMPONENT ================= */
export default function LMSPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editStudentId, setEditStudentId] = useState<number | null>(null);

  const [search, setSearch] = useState("");

  /* -------- per-student UI state -------- */
  const [selectedCourseMap, setSelectedCourseMap] = useState<Record<number, number>>({});
  const [dropdownOpenMap, setDropdownOpenMap] = useState<Record<number, boolean>>({});
  const [modulesDropdownMap, setModulesDropdownMap] = useState<Record<number, boolean>>({});

  /* -------- pagination -------- */
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/lms/students");
      const data = await res.json();

      const normalized = Array.isArray(data)
        ? data.map((s: any) => {
            let courses: CourseItem[] = [];

            if (Array.isArray(s.courses) && s.courses.length) {
              courses = s.courses.map((c: any) => ({
                course_slug: c.course_slug ?? "",
                course_title: c.course_title ?? c.course_slug ?? "",
                modules: normalizeModules(c.modules),
                progress:
                  typeof c.progress === "string"
                    ? safeParseJSON<Record<string, any>>(c.progress, {})
                    : c.progress ?? {},
                batch_id: c.batch_id ?? null,
                batch_name: c.batch_name ?? "",
                enrolled_at: c.enrolled_at ?? c.enrolledAt ?? null,
              }));
            } else if (s.course_slug || s.course) {
              courses = [
                {
                  course_slug: s.course_slug ?? s.course ?? "",
                  course_title: s.course_title ?? s.course ?? "",
                  modules: normalizeModules(s.modules),
                  progress:
                    typeof s.progress === "string"
                      ? safeParseJSON<Record<string, any>>(s.progress, {})
                      : s.progress ?? {},
                  batch_id: s.batch_id ?? null,
                  batch_name: s.batch_name ?? "",
                  enrolled_at: s.enrolled_at ?? s.enrolledAt ?? null,
                },
              ];
            }

            return {
              id: Number(s.id),
              name: s.name ?? "",
              email: s.email ?? "",
              phone: s.phone ?? null,
              courses,
              status: s.status ?? s.state ?? "in_progress",
              enrolledAt: s.enrolledAt ?? s.enrolled_at ?? null,
            } as Student;
          })
        : [];

      setStudents(normalized);

      const initialMap: Record<number, number> = {};
      normalized.forEach((st) => {
        initialMap[st.id] = 0;
      });
      setSelectedCourseMap(initialMap);
      setDropdownOpenMap({});
      setModulesDropdownMap({});
    } catch (err) {
      console.error("Failed to fetch students", err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this student?")) return;

    try {
      await fetch(`/api/lms/students/${id}`, { method: "DELETE" });
      await fetchStudents();
      setTimeout(() => setCurrentPage((p) => Math.max(1, p - 1)), 50);
    } catch {
      alert("Failed to delete student");
    }
  };

  const enrolledCount = students.length;
  const completedCount = students.filter((s) => s.status === "completed").length;
  const activeCount = enrolledCount - completedCount;

  const filteredStudents = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return students;

    return students.filter(
      (s) =>
        (s.name ?? "").toLowerCase().includes(term) ||
        (s.email ?? "").toLowerCase().includes(term)
    );
  }, [students, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, students.length]);

  const totalItems = filteredStudents.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalItems);
  const pagedStudents = filteredStudents.slice(startIndex, endIndex);

  const toggleDropdown = (studentId: number) => {
    setDropdownOpenMap((p) => ({ ...p, [studentId]: !p[studentId] }));
    setModulesDropdownMap((p) => ({ ...p, [studentId]: false }));
  };

  const selectCourseForStudent = (studentId: number, index: number) => {
    setSelectedCourseMap((p) => ({ ...p, [studentId]: index }));
    setDropdownOpenMap((p) => ({ ...p, [studentId]: false }));
    setModulesDropdownMap((p) => ({ ...p, [studentId]: false }));
  };

  const toggleModulesDropdown = (studentId: number) => {
    setModulesDropdownMap((p) => ({ ...p, [studentId]: !p[studentId] }));
    setDropdownOpenMap((p) => ({ ...p, [studentId]: false }));
  };

  useEffect(() => {
    const closeAll = () => {
      setDropdownOpenMap({});
      setModulesDropdownMap({});
    };

    window.addEventListener("click", closeAll);
    return () => window.removeEventListener("click", closeAll);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-10 overflow-x-hidden">
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 sm:py-8 lg:py-10">
        {/* ---------- HEADER STATS ---------- */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 mb-6 sm:mb-8">
          <div className="col-span-1">
            <StatCard
              title="Enrolled Students"
              value={enrolledCount}
              icon={<FaUserGraduate />}
            />
          </div>

          <div className="col-span-1">
            <StatCard
              title="Completed Courses"
              value={completedCount}
              icon={<FaBook />}
            />
          </div>

          <div className="col-span-2 lg:col-span-1">
            <StatCard
              title="Active Students"
              value={activeCount}
              icon={<Users size={22} />}
            />
          </div>
        </div>
 

        {/* ---------- TABLE / LIST ---------- */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 overflow-hidden">
          
         <div className="flex flex-col justify-between gap-4 border-b border-gray-50 p-6 md:flex-row md:items-center bg-white rounded-t-[2rem] border border-slate-200/60 border-b-0">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">Student Management</h2>
                  </div>
        
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative w-full sm:w-[320px]">
                      <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors"
              />
              <input
                type="text"
                placeholder="Search name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-200 bg-white rounded-xl sm:rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
              />
                    </div>
        
                    <button
                      onClick={() => setIsDrawerOpen(true)}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-xl font-semibold shadow-sm transition-all active:scale-95"
                    >
                      <Plus size={18} strokeWidth={3} />
                      <span>New Enrol</span>
                    </button>
                  </div>
                </div>
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-blue-600" size={32} />
              <span className="text-slate-400 font-medium animate-pulse">
                Loading students...
              </span>
            </div>
          ) : pagedStudents.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/70 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400">
                        Student Info
                      </th>
                      <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400">
                        Assigned Course
                      </th>
                      <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400">
                        Modules
                      </th>
                      <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400">
                        Status
                      </th>
                      <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {pagedStudents.map((s) => {
                      const courses = Array.isArray(s.courses) ? s.courses : [];
                      const selectedIndex = selectedCourseMap[s.id] ?? 0;
                      const selectedCourse = courses[selectedIndex] ?? null;

                      return (
                        <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                                {(s.name || "?").charAt(0)}
                              </div>

                              <div className="min-w-0">
                                <div className="font-bold text-slate-800 text-sm truncate">
                                  {s.name}
                                </div>
                                <div className="flex items-center gap-1 text-slate-400 text-xs truncate">
                                  <Mail size={12} /> {s.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5 relative">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                {selectedCourse ? (
                                  <>
                                    <div className="text-sm font-semibold text-slate-800 truncate">
                                      {selectedCourse.course_title || selectedCourse.course_slug}
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                                      <Calendar size={12} />
                                      <span>
                                        Joined{" "}
                                        {formatDate(
                                          selectedCourse.enrolled_at ?? s.enrolledAt ?? null
                                        )}
                                      </span>
                                    </div>
                                  </>
                                ) : s.course ? (
                                  <>
                                    <div className="text-sm font-semibold text-slate-800">
                                      {s.course}
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                                      <Calendar size={12} /> Joined {formatDate(s.enrolledAt)}
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-slate-400 text-sm">No course</div>
                                )}
                              </div>

                              {courses.length > 1 && (
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleDropdown(s.id);
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                    aria-expanded={!!dropdownOpenMap[s.id]}
                                  >
                                    <ChevronDown size={16} />
                                  </button>

                                  {dropdownOpenMap[s.id] && (
                                    <div
                                      onClick={(e) => e.stopPropagation()}
                                      className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden"
                                    >
                                      {courses.map((c, idx) => (
                                        <button
                                          key={c.course_slug + "_" + idx}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            selectCourseForStudent(s.id, idx);
                                          }}
                                          className={`w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between gap-3 ${
                                            idx === selectedIndex ? "bg-slate-50" : ""
                                          }`}
                                        >
                                          <div className="min-w-0">
                                            <div className="text-sm font-semibold text-slate-800 truncate">
                                              {c.course_title || c.course_slug}
                                            </div>
                                            <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                                              {c.batch_name || ""}
                                            </div>
                                          </div>
                                          <div className="w-6 flex justify-end items-center shrink-0">
                                            {idx === selectedIndex ? (
                                              <Check size={14} className="text-indigo-600" />
                                            ) : null}
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-5 relative">
                            {selectedCourse &&
                            Array.isArray(selectedCourse.modules) &&
                            selectedCourse.modules.length > 0 ? (
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleModulesDropdown(s.id);
                                  }}
                                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                >
                                  <span className="text-xs font-semibold">
                                    {selectedCourse.modules.length} Modules
                                  </span>
                                  <ChevronDown size={14} />
                                </button>

                                {modulesDropdownMap[s.id] && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute left-0 mt-2 w-56 bg-white z-50 border border-slate-200 rounded-xl shadow-lg overflow-hidden"
                                  >
                                    {selectedCourse.modules.map((m) => (
                                      <div
                                        key={m}
                                        className="px-4 py-2.5 text-[12px] text-slate-700 hover:bg-slate-50 border-b last:border-b-0 border-slate-100"
                                      >
                                        {moduleNameMap[m] ?? m}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-400">No modules</div>
                            )}
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
                                s.status === "completed"
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                  : "bg-amber-50 text-amber-600 border-amber-100"
                              }`}
                            >
                              {s.status === "completed" ? "Completed" : "In Progress"}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setEditStudentId(s.id)}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                              >
                                <Pencil size={14} />
                              </button>

                              <button
                                onClick={() => handleDelete(s.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile / tablet cards */}
              <div className="lg:hidden divide-y divide-slate-100">
                {pagedStudents.map((s) => {
                  const courses = Array.isArray(s.courses) ? s.courses : [];
                  const selectedIndex = selectedCourseMap[s.id] ?? 0;
                  const selectedCourse = courses[selectedIndex] ?? null;

                  return (
                    <div key={s.id} className="p-4 sm:p-5 active:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                              {(s.name || "?").charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-tight truncate">
                                {s.name}
                              </h3>
                              <div className="flex items-center gap-1 text-slate-400 text-[11px] sm:text-xs truncate">
                                <Mail size={12} /> {s.email}
                              </div>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => setEditStudentId(s.id)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg shrink-0"
                        >
                          <Pencil size={14} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Course
                          </p>
                          <p className="text-sm font-bold text-slate-800 mt-1 truncate">
                            {selectedCourse
                              ? selectedCourse.course_title || selectedCourse.course_slug
                              : s.course || "No course"}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                            <Calendar size={11} /> {formatDate(selectedCourse?.enrolled_at ?? s.enrolledAt)}
                          </p>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Status
                          </p>
                          <div className="mt-2">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
                                s.status === "completed"
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                  : "bg-amber-50 text-amber-600 border-amber-100"
                              }`}
                            >
                              {s.status === "completed" ? "Completed" : "In Progress"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 rounded-xl p-3 min-w-0 relative">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Modules
                          </p>

                          {selectedCourse &&
                          Array.isArray(selectedCourse.modules) &&
                          selectedCourse.modules.length > 0 ? (
                            <div className="mt-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleModulesDropdown(s.id);
                                }}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                              >
                                {selectedCourse.modules.length} Modules
                                <ChevronDown size={14} />
                              </button>

                              {modulesDropdownMap[s.id] && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute left-3 right-3 mt-2 bg-white z-50 border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-56 overflow-y-auto"
                                >
                                  {selectedCourse.modules.map((m) => (
                                    <div
                                      key={m}
                                      className="px-4 py-2.5 text-[12px] text-slate-700 hover:bg-slate-50 border-b last:border-b-0 border-slate-100"
                                    >
                                      {moduleNameMap[m] ?? m}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 mt-2">No modules</p>
                          )}
                        </div>

                        <div className="bg-slate-50 rounded-xl p-3 min-w-0 relative">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Course Switch
                          </p>

                          {courses.length > 1 ? (
                            <div className="mt-2 relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleDropdown(s.id);
                                }}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                              >
                                Select <ChevronDown size={14} />
                              </button>

                              {dropdownOpenMap[s.id] && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden"
                                >
                                  {courses.map((c, idx) => (
                                    <button
                                      key={c.course_slug + "_" + idx}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        selectCourseForStudent(s.id, idx);
                                      }}
                                      className={`w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between gap-3 ${
                                        idx === selectedIndex ? "bg-slate-50" : ""
                                      }`}
                                    >
                                      <div className="min-w-0">
                                        <div className="text-sm font-semibold text-slate-800 truncate">
                                          {c.course_title || c.course_slug}
                                        </div>
                                        <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                                          {c.batch_name || ""}
                                        </div>
                                      </div>
                                      <div className="w-6 flex justify-end items-center shrink-0">
                                        {idx === selectedIndex ? (
                                          <Check size={14} className="text-indigo-600" />
                                        ) : null}
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 mt-2">Single course</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 text-xs font-semibold border border-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t bg-slate-50/70">
                <div className="text-sm text-slate-600">
                  Showing {totalItems === 0 ? 0 : startIndex + 1} - {endIndex} of {totalItems}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-md text-sm font-semibold disabled:opacity-40 hover:bg-slate-100"
                  >
                    First
                  </button>

                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-md text-sm font-semibold disabled:opacity-40 hover:bg-slate-100"
                  >
                    Prev
                  </button>

                  <div className="inline-flex flex-wrap items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const page = idx + 1;
                      if (
                        totalPages > 7 &&
                        Math.abs(page - currentPage) > 3 &&
                        page !== 1 &&
                        page !== totalPages
                      ) {
                        return null;
                      }

                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1.5 rounded-md text-sm font-semibold ${
                            currentPage === page
                              ? "bg-blue-600 text-white"
                              : "hover:bg-slate-100"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-md text-sm font-semibold disabled:opacity-40 hover:bg-slate-100"
                  >
                    Next
                  </button>

                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-md text-sm font-semibold disabled:opacity-40 hover:bg-slate-100"
                  >
                    Last
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* ---------- ENROL MODAL ---------- */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/40 z-40"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-xl bg-white z-50 shadow-2xl overflow-y-auto"
            >
              <EnrolModal
                onClose={() => {
                  setIsDrawerOpen(false);
                  fetchStudents();
                }}
                adminName="Admin"
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ---------- EDIT PANEL ---------- */}
      <AnimatePresence>
        {editStudentId !== null && (
          <EditEnrolPanel
            studentId={editStudentId}
            onClose={() => {
              setEditStudentId(null);
              fetchStudents();
            }}
            onSaved={() => fetchStudents()}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- STAT CARD ---------- */
function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-[1.5rem] shadow-sm border border-slate-200/60 flex items-center gap-3 sm:gap-4 h-full">
      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 text-blue-600 text-lg sm:text-xl">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {title}
        </p>
        <p className="text-xl sm:text-2xl font-black text-slate-900 leading-none mt-1">
          {value}
        </p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-20 flex flex-col items-center justify-center text-center px-6">
      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
        <Search size={32} />
      </div>
      <h3 className="text-lg font-bold text-slate-900">No students found</h3>
      <p className="text-slate-500 max-w-xs mx-auto text-sm mt-1">
        Try adjusting your search or enroll a new student.
      </p>
    </div>
  );
}