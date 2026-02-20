"use client";

import React, { useEffect, useState } from "react";
import { FaUserGraduate, FaBook, FaTrash, FaEdit } from "react-icons/fa";
import { Calendar, Mail, Pencil, Plus, Rocket, Trash2 } from "lucide-react";
import EnrolModal from "@/components/lms/EnrolModal";
import EditStudentModal from "@/components/lms/EditStudentModal";
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
  const [editEmail, setEditEmail] = useState<string | null>(null);

  /* -------- FETCH STUDENTS FROM DB -------- */
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
    if (!confirm("Delete this student? This action cannot be undone.")) return;

    try {
      await fetch(`/api/admin/lms/students/${id}`, { method: "DELETE" });
      fetchStudents();
    } catch {
      alert("Failed to delete student");
    }
  };

  const enrolledCount = students.length;
  const completedCount = students.filter((s) => s.status === "completed").length;

  return (
    <div className="space-y-6 p-6">
      {/* ---------- HEADER STATS ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Enrolled Students"
          value={enrolledCount}
          icon={<FaUserGraduate />}
        />
        <StatCard title="Completed Courses" value={completedCount} icon={<FaBook />} />
        <StatCard
          title="Active Students"
          value={enrolledCount - completedCount}
          icon={<FaUserGraduate />}
        />
      </div>

      {/* ---------- ACTION BAR ---------- */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Student Management</h2>

        <button
    onClick={() => setIsDrawerOpen(true)}
    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold"
  >
    <Plus size={16} className="font-extrabold" /> Enroll Student
  </button>
      </div>

      {/* ---------- TABLE ---------- */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        {loading ? (
          <p className="p-6 text-center text-gray-500">Loading students…</p>
        ) : students.length === 0 ? (
          <p className="p-6 text-center text-gray-500">No students enrolled yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr className="bg-slate-50/50 border-b border-slate-200">
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Student Info</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Course Details</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-right">Actions</th>
                  </tr>
            </thead>

            <tbody>
              {students.map((s) => (
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
                  
                  {/* <td className="p-3">{s.phone || "—"}</td> */}
                   
                    <td className="px-6 py-5">
                        <div className="text-sm font-semibold text-slate-700">{s.course}</div>
                        <div className="flex items-center gap-1 text-slate-400 text-[11px] mt-0.5">
                          <Calendar size={12} /> Joined {s.enrolledAt ? new Date(s.enrolledAt).toLocaleDateString() : "—"}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${s.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${s.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {s.status === 'completed' ? 'Completed' : 'In Progress'}
                        </span>
                      </td>
 
                  <td className="px-6 py-5">
                        <div className="flex justify-end gap-2 transition-opacity">
                          <button onClick={() => setEditEmail(s.email)} className="p-2  text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Pencil size={14} className="text-indigo-600"/></button>
                          <button onClick={() => handleDelete(s.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                        </div>
                      </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ---------- ENROL MODAL ---------- */}
      <AnimatePresence>
  {isDrawerOpen && (
    <>
      {/* BACKDROP */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setIsDrawerOpen(false)}
        className="fixed inset-0 bg-black/40 z-40"
      />

      {/* RIGHT SLIDE PANEL */}
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

      {/* ---------- EDIT STUDENT MODAL (ADDED) ---------- */}
      {editEmail && (
        <EditStudentModal
          email={editEmail}
          onClose={() => setEditEmail(null)}
          onUpdated={fetchStudents}
        />
      )}
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
