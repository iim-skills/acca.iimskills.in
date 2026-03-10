"use client";

import React, { useEffect, useState } from "react";
import { FaUserGraduate, FaBook } from "react-icons/fa";
import { Calendar, Mail, Pencil, Plus, Trash2, Search } from "lucide-react";
import EnrolModal from "@/admin/StudentSec/EnrolModal";
import EditEnrolPanel from "./StudentSec/enrol/edit/page";
import { motion, AnimatePresence } from "framer-motion";

/* ================= TYPES ================= */
type Student = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  course: string;
  assignedModules: string[];
  status: string;
  enrolledAt?: string;
};

/* ================= COMPONENT ================= */
export default function LMSPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editStudentId, setEditStudentId] = useState<number | null>(null);

  const [search, setSearch] = useState("");

  /* -------- PAGINATION -------- */
  const PAGE_SIZE = 10; // show 10 entries per page
  const [currentPage, setCurrentPage] = useState(1);

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
      // reload students
      await fetchStudents();
      // if deleting left the page empty, move back one page (if possible)
      setTimeout(() => setCurrentPage((p) => Math.max(1, p - 1)), 50);
    } catch {
      alert("Failed to delete student");
    }
  };

  const enrolledCount = students.length;
  const completedCount = students.filter((s) => s.status === "completed").length;

  /* -------- SEARCH FILTER -------- */
  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  // reset page when search changes or student list changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, students.length]);

  // pagination calculations
  const totalItems = filteredStudents.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  // keep currentPage in bounds
  useEffect(() => {
    setCurrentPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalItems);
  const pagedStudents = filteredStudents.slice(startIndex, endIndex);

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
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
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
                  <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400">Course Details</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {pagedStudents.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
                          {s.name.charAt(0)}
                        </div>

                        <div>
                          <div className="font-bold text-slate-800 text-sm">{s.name}</div>

                          <div className="flex items-center gap-1 text-slate-400 text-xs">
                            <Mail size={12} /> {s.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="text-sm font-semibold text-slate-700">{s.course}</div>

                      <div className="flex items-center gap-1 text-slate-400 text-[11px] mt-0.5">
                        <Calendar size={12} /> Joined {s.enrolledAt ? new Date(s.enrolledAt).toLocaleDateString() : "—"}
                      </div>
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
                ))}
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
