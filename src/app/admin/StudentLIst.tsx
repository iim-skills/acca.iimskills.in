"use client";

import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import EnrolModal from "@/admin/StudentSec/EnrolModal";
import EditEnrolPanel from "./StudentSec/enrol/edit/page";
import { motion, AnimatePresence } from "framer-motion";

/* ================= TYPES ================= */
type CourseItem = {
  course_slug: string;
  course_title: string;
  modules?: string[]; // module ids or names
  progress?: Record<string, any>;
  batch_id?: number | string | null;
  batch_name?: string;
  enrolled_at?: string | null; // optional per-course enrolled date
};

type Student = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  // prefer courses[]
  courses?: CourseItem[];
  // legacy fallback
  course?: string;
  assignedModules?: string[];
  status?: string;
  enrolledAt?: string | null;
};

/* ================= Module name map (friendly names) ================= */
/* Edit/extend this map to match your actual module name mapping */
const moduleNameMap: Record<string, string> = {
  MOD_1: "Corporate & Business Law (Global)",
  MOD_2: "Performance Management",
  // add other mappings here...
};

/* ================= COMPONENT ================= */
export default function LMSPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editStudentId, setEditStudentId] = useState<number | null>(null);

  const [search, setSearch] = useState("");

  /* -------- UI state per-student -------- */
  // which course index is currently selected per student (defaults to 0)
  const [selectedCourseMap, setSelectedCourseMap] = useState<Record<number, number>>({});
  // whether dropdown for a student is open (course selector)
  const [dropdownOpenMap, setDropdownOpenMap] = useState<Record<number, boolean>>({});
  // modules dropdown separate map (per-student)
  const [modulesDropdownMap, setModulesDropdownMap] = useState<Record<number, boolean>>({});

  /* -------- PAGINATION -------- */
  const PAGE_SIZE = 10; // show 10 entries per page
  const [currentPage, setCurrentPage] = useState(1);

  /* -------- FETCH STUDENTS -------- */
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/lms/students");
      const data = await res.json();

      const normalized = Array.isArray(data)
        ? data.map((s: any) => {
            let courses: CourseItem[] = [];
            if (Array.isArray(s.courses) && s.courses.length) {
              courses = s.courses;
            } else if (s.course_slug || s.course) {
              courses = [
                {
                  course_slug: s.course_slug ?? s.course ?? "",
                  course_title: s.course_title ?? s.course ?? "",
                  modules: Array.isArray(s.modules)
                    ? s.modules
                    : typeof s.modules === "string" && s.modules.includes("[")
                    ? JSON.parse(s.modules)
                    : typeof s.modules === "string"
                    ? s.modules.split(",").map((m: string) => m.trim()).filter(Boolean)
                    : [],
                  progress: s.progress ? (typeof s.progress === "string" ? JSON.parse(s.progress) : s.progress) : {},
                  batch_id: s.batch_id ?? null,
                  batch_name: s.batch_name ?? "",
                  enrolled_at: s.enrolled_at ?? s.enrolledAt ?? null,
                },
              ];
            } else {
              courses = [];
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

      // initialize selectedCourseMap for each student (default 0)
      const initialMap: Record<number, number> = {};
      normalized.forEach((st) => {
        initialMap[st.id] = 0;
      });
      setSelectedCourseMap(initialMap);
      setDropdownOpenMap({}); // close all dropdowns
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------- DELETE STUDENT -------- */
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

  /* Small helper if you want to update one student locally without refetching the whole list */
  const updateStudent = (updated: Student) => {
    setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const enrolledCount = students.length;
  const completedCount = students.filter((s) => s.status === "completed").length;

  /* -------- SEARCH FILTER -------- */
  const filteredStudents = students.filter((s) =>
    (s.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (s.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

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

  const formatDate = (value?: string | null) => {
    if (!value) return "—";
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return "—";
      return d.toLocaleDateString();
    } catch {
      return "—";
    }
  };

  /* -------- UI helpers for per-row dropdown -------- */
  // toggle course selector dropdown (stopPropagation where called)
  const toggleDropdown = (studentId: number) => {
    setDropdownOpenMap((p) => ({ ...p, [studentId]: !p[studentId] }));
    // also close modules dropdown for neatness
    setModulesDropdownMap((p) => ({ ...p, [studentId]: false }));
  };

  const selectCourseForStudent = (studentId: number, index: number) => {
    setSelectedCourseMap((p) => ({ ...p, [studentId]: index }));
    setDropdownOpenMap((p) => ({ ...p, [studentId]: false }));
    setModulesDropdownMap((p) => ({ ...p, [studentId]: false }));
  };

  // modules dropdown toggle
  const toggleModulesDropdown = (studentId: number) => {
    setModulesDropdownMap((p) => ({ ...p, [studentId]: !p[studentId] }));
    // close course dropdown for neatness
    setDropdownOpenMap((p) => ({ ...p, [studentId]: false }));
  };

  /* Close dropdowns on outside click */
  useEffect(() => {
    const closeAll = () => {
      setDropdownOpenMap({});
      setModulesDropdownMap({});
    };

    window.addEventListener("click", closeAll);
    return () => window.removeEventListener("click", closeAll);
  }, []);

  return (
    <div className="space-y-6 p-6">
      {/* ---------- HEADER STATS ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Enrolled Students" value={enrolledCount} icon={<FaUserGraduate />} />
        <StatCard title="Completed Courses" value={completedCount} icon={<FaBook />} />
        <StatCard
          title="Active Students"
          value={enrolledCount - completedCount}
          icon={<FaUserGraduate />}
        />
      </div>

      {/* ---------- ACTION BAR ---------- */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Student Management</h2>

        <div className="flex items-center gap-3">
          {/* SEARCH BAR */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 border rounded-lg w-72 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={() => setIsDrawerOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold"
          >
            <Plus size={16} /> Enroll Student
          </button>
        </div>
      </div>

      {/* ---------- TABLE ---------- */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        {loading ? (
          <p className="p-6 text-center text-gray-500">Loading students…</p>
        ) : pagedStudents.length === 0 ? (
          <p className="p-6 text-center text-gray-500">No students found.</p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400">Student Info</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400">Assigned Course</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400">Modules</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {pagedStudents.map((s) => {
                  const courses = Array.isArray(s.courses) ? s.courses : [];
                  const selectedIndex = selectedCourseMap[s.id] ?? 0;
                  const selectedCourse = courses[selectedIndex] ?? null;

                  return (
                    <tr key={s.id} className="border-t">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
                            {(s.name || "?").charAt(0)}
                          </div>

                          <div>
                            <div className="font-bold text-slate-800 text-sm">{s.name}</div>

                            <div className="flex items-center gap-1 text-slate-400 text-xs">
                              <Mail size={12} /> {s.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Assigned Course (single visible, others in dropdown) */}
                      <td className="px-6 py-5 relative">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            {selectedCourse ? (
                              <>
                                <div className="text-sm font-semibold text-slate-800 truncate">
                                  {selectedCourse.course_title || selectedCourse.course_slug}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                                  <Calendar size={12} className="inline-block" />
                                  <span>Joined {formatDate(selectedCourse.enrolled_at ?? s.enrolledAt ?? null)}</span>
                                </div>
                              </>
                            ) : s.course ? (
                              <div>
                                <div className="text-sm font-semibold text-slate-800">{s.course}</div>
                                <div className="text-[11px] text-slate-500 mt-1">
                                  <Calendar size={12} className="inline-block mr-1" /> Joined {formatDate(s.enrolledAt)}
                                </div>
                              </div>
                            ) : (
                              <div className="text-slate-400 text-sm">No course</div>
                            )}
                          </div>

                          {/* Dropdown toggle */}
                          {courses.length > 1 && (
                            <div className="relative">
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleDropdown(s.id); }}
                                className="flex items-center gap-2 px-3 py-2 bg-white  text-slate-600 cursor-pointer"
                                aria-expanded={!!dropdownOpenMap[s.id]}
                              >
                                <ChevronDown size={16} />
                              </button>

                              {dropdownOpenMap[s.id] && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-0 mt-2 w-56 bg-white border rounded-xl shadow-lg z-50"
                                >
                                  {courses.map((c, idx) => (
                                    <button
                                      key={c.course_slug + "_" + idx}
                                      onClick={(e) => { e.stopPropagation(); selectCourseForStudent(s.id, idx); }}
                                      className={`w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between ${idx === selectedIndex ? "bg-slate-50" : ""}`}
                                    >
                                      <div className="min-w-0">
                                        <div className="text-sm font-semibold text-slate-800 truncate">{c.course_title || c.course_slug}</div>
                                        <div className="text-[11px] text-slate-400 mt-0.5">{c.batch_name || ""}</div>
                                      </div>
                                      <div className="w-6 flex justify-end items-center">
                                        {idx === selectedIndex ? <Check size={14} className="text-indigo-600" /> : null}
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Modules column - shows modules for selected course */}
                      <td className="px-6 py-5 relative">
                        {selectedCourse && Array.isArray(selectedCourse.modules) && selectedCourse.modules.length > 0 ? (
                          <div className="relative">
                            {/* Dropdown Button */}
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleModulesDropdown(s.id); }}
                              className="flex items-center gap-2 px-3 py-1 bg-white text-slate-600"
                            >
                              <span className="text-xs font-semibold">
                                {selectedCourse.modules.length} Modules
                              </span>
                              <ChevronDown size={14} />
                            </button>

                            {/* Dropdown List */}
                            {modulesDropdownMap[s.id] && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 mt-2 w-40 bg-white z-50 border rounded-xl shadow"
                              >
                                {selectedCourse.modules.map((m) => (
                                  <div
                                    key={m}
                                    className="px-4 py-2 text-[12px] text-slate-700 hover:bg-slate-50"
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

            {/* Pagination Controls */}
            <div className="px-6 py-4 flex items-center justify-between border-t bg-slate-50">
              <div className="text-sm text-slate-600">Showing {totalItems === 0 ? 0 : startIndex + 1} - {endIndex} of {totalItems}</div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-md text-sm font-semibold disabled:opacity-40 hover:bg-slate-100"
                >
                  First
                </button>

                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-md text-sm font-semibold disabled:opacity-40 hover:bg-slate-100"
                >
                  Prev
                </button>

                <div className="inline-flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const page = idx + 1;
                    if (totalPages > 7 && Math.abs(page - currentPage) > 3 && page !== 1 && page !== totalPages) return null;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded-md text-sm font-semibold ${currentPage === page ? "bg-blue-600 text-white" : "hover:bg-slate-100"}`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-md text-sm font-semibold disabled:opacity-40 hover:bg-slate-100"
                >
                  Next
                </button>

                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-md text-sm font-semibold disabled:opacity-40 hover:bg-slate-100"
                >
                  Last
                </button>
              </div>
            </div>
          </>
        )}
      </div>

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
    <div className="bg-white p-5 rounded-xl shadow flex items-center gap-4">
      <div className="text-blue-600 text-2xl">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}