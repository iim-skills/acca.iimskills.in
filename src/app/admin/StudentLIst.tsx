"use client";

import React, { useEffect, useState } from "react";
import { FaUserGraduate, FaBook, FaTrash, FaEdit } from "react-icons/fa";
import { Rocket } from "lucide-react";
import EnrolModal from "@/components/lms/EnrolModal";
import EditStudentModal from "@/components/lms/EditStudentModal";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
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
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold"
        >
          <Rocket size={16} /> Enroll Student
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
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Course</th>
                <th className="p-3">Modules</th>
                <th className="p-3">Status</th>
                <th className="p-3">Enrolled</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="p-3 font-medium">{s.name}</td>
                  <td className="p-3">{s.email}</td>
                  <td className="p-3">{s.phone || "—"}</td>
                  <td className="p-3">{s.course || "—"}</td>

                  <td className="p-3">
                    {s.assignedModules?.length ? s.assignedModules.join(", ") : "—"}
                  </td>

                  <td className="p-3">
                    {s.status === "completed" ? (
                      <span className="text-green-600 font-semibold">Completed</span>
                    ) : (
                      <span className="text-yellow-600 font-semibold">Ongoing</span>
                    )}
                  </td>

                  <td className="p-3">
                    {s.enrolledAt ? new Date(s.enrolledAt).toLocaleDateString() : "—"}
                  </td>

                  <td className="p-3 flex justify-end gap-3">
                    <button onClick={() => setEditEmail(s.email)} className="text-blue-600 hover:text-blue-800">
                      <FaEdit />
                    </button>

                    <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:text-red-800">
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ---------- ENROL MODAL ---------- */}
      {isModalOpen && (
        <EnrolModal
          onClose={() => {
            setIsModalOpen(false);
            fetchStudents(); // refresh after enrol
          }}
          adminName="Admin"
        />
      )}

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
