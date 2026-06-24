"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FaBook, FaUserGraduate } from "react-icons/fa";
import { Calendar, Mail, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import EnrolModal from "@/admin/StudentSec/EnrolModal";
import EditEnrolPanel from "./enrol/edit/page";

/* ================= TYPES ================= */
type StudentCourse = {
  id?: number | string;
  name?: string;
  slug?: string;
  course_slug?: string;
  course_title?: string;
  modules?: string[];
};

type Student = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  courses?: StudentCourse[];
  studentType?: string | null;
  status: string;
  enrolledAt?: string;
};

type StudentTypeFilter = "all" | "free" | "paid";

const normalizeStudentType = (value?: string | null): "free" | "paid" =>
  String(value ?? "").trim().toLowerCase() === "free" ? "free" : "paid";

const getCourseNames = (student: Student) =>
  Array.isArray(student.courses)
    ? student.courses
        .map((course) =>
          String(
            course.course_title ??
              course.name ??
              course.slug ??
              course.course_slug ??
              ""
          ).trim()
        )
        .filter(Boolean)
    : [];

const formatDate = (value?: string) => {
  if (!value) return "-";

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime())
    ? "-"
    : parsedDate.toLocaleDateString();
};

/* ================= COMPONENT ================= */
export default function LMSPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editStudentId, setEditStudentId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<StudentTypeFilter>("all");

  /* -------- FETCH STUDENTS -------- */
  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/lms/students");
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch students", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  /* -------- DELETE STUDENT -------- */
  const handleDelete = async (id: number) => {
    if (!confirm("Delete this student?")) return;

    try {
      await fetch(`/api/lms/students/${id}`, { method: "DELETE" });
      fetchStudents();
    } catch {
      alert("Failed to delete student");
    }
  };

  const enrolledCount = students.length;
  const completedCount = students.filter((student) => student.status === "completed").length;

  /* -------- SEARCH + FILTER -------- */
  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students.filter((student) => {
      const studentType = normalizeStudentType(student.studentType);
      const matchesType = typeFilter === "all" || studentType === typeFilter;

      if (!matchesType) return false;
      if (!query) return true;

      const searchableText = [
        student.name,
        student.email,
        student.phone ?? "",
        studentType,
        getCourseNames(student).join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [students, search, typeFilter]);

  return (
    <div className="space-y-6 p-6">
      {/* ---------- HEADER STATS ---------- */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard title="Enrolled Students" value={enrolledCount} icon={<FaUserGraduate />} />
        <StatCard title="Completed Courses" value={completedCount} icon={<FaBook />} />
        <StatCard
          title="Active Students"
          value={enrolledCount - completedCount}
          icon={<FaUserGraduate />}
        />
      </div>

      {/* ---------- ACTION BAR ---------- */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-xl font-bold">Student Management</h2>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end lg:w-auto">
          <div className="relative w-full sm:w-80">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search by name, email, course, or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as StudentTypeFilter)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
          >
            <option value="all">All Types</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>

          <button
            onClick={() => setIsDrawerOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 font-bold text-white"
          >
            <Plus size={16} /> Enroll Student
          </button>
        </div>
      </div>

      {/* ---------- TABLE ---------- */}
      <div className="overflow-x-auto rounded-xl bg-white shadow">
        {loading ? (
          <p className="p-6 text-center text-gray-500">Loading students...</p>
        ) : filteredStudents.length === 0 ? (
          <p className="p-6 text-center text-gray-500">No students found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-[11px] font-bold uppercase text-slate-400">
                  Student Info
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-bold uppercase text-slate-400">
                  Course Details
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-bold uppercase text-slate-400">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-bold uppercase text-slate-400">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-[11px] font-bold uppercase text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredStudents.map((student) => {
                const studentType = normalizeStudentType(student.studentType);
                const courseNames = getCourseNames(student);
                const primaryCourse = courseNames[0] ?? "No course assigned";
                const extraCoursesCount = Math.max(courseNames.length - 1, 0);

                return (
                  <tr key={student.id} className="border-t">
                    <td className="px-6 py-5 align-top">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-600">
                          {student.name.charAt(0)}
                        </div>

                        <div>
                          <div className="text-sm font-bold text-slate-800">{student.name}</div>
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Mail size={12} /> {student.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5 align-top">
                      <div className="text-sm font-semibold text-slate-700">{primaryCourse}</div>

                      {extraCoursesCount > 0 && (
                        <div className="mt-1 text-[11px] font-medium text-slate-400">
                          +{extraCoursesCount} more course{extraCoursesCount > 1 ? "s" : ""}
                        </div>
                      )}

                      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                        <Calendar size={12} /> Joined {formatDate(student.enrolledAt)}
                      </div>
                    </td>

                    <td className="px-6 py-5 align-top">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase ${
                          studentType === "paid"
                            ? "border-blue-100 bg-blue-50 text-blue-700"
                            : "border-emerald-100 bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {studentType}
                      </span>
                    </td>

                    <td className="px-6 py-5 align-top">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold ${
                          student.status === "completed"
                            ? "border-emerald-100 bg-emerald-50 text-emerald-600"
                            : "border-amber-100 bg-amber-50 text-amber-600"
                        }`}
                      >
                        {student.status === "completed" ? "Completed" : "In Progress"}
                      </span>
                    </td>

                    <td className="px-6 py-5 align-top">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditStudentId(student.id)}
                          className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50"
                        >
                          <Pencil size={14} />
                        </button>

                        <button
                          onClick={() => handleDelete(student.id)}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
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
              className="fixed inset-0 z-40 bg-black/40"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 right-0 top-0 z-50 w-full max-w-xl overflow-y-auto bg-white shadow-2xl"
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
    <div className="flex items-center gap-4 rounded-xl bg-white p-5 shadow">
      <div className="text-2xl text-blue-600">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}
