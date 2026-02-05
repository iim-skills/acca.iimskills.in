"use client";

import React, { useEffect, useState } from "react";
import { X, Save } from "lucide-react";

type Props = {
  email: string;
  onClose: () => void;
  onUpdated: () => void;
};

type Student = {
  name: string;
  email: string;
  courseSlug: string;
  course: string;
  assignedModules: string[];
  status: string;
};

export default function EditStudentModal({ email, onClose, onUpdated }: Props) {
  const [student, setStudent] = useState<Student | null>(null);
  const [allModules, setAllModules] = useState<string[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [status, setStatus] = useState("active");
  const [loading, setLoading] = useState(false);

  /* ---------- LOAD STUDENT BY EMAIL ---------- */
  useEffect(() => {
    const load = async () => {
      const res = await fetch(
        `/api/lms/students/by-email?email=${encodeURIComponent(email)}`
      );
      const data = await res.json();

      setStudent(data);
      setSelectedModules(data.assignedModules || []);
      setStatus(data.status);

      // fetch course modules
      const courseRes = await fetch("/api/admin/courses");
      const courses = await courseRes.json();
      const course = courses.find((c: any) => c.slug === data.courseSlug);
      setAllModules(course?.modules || []);
    };

    load();
  }, [email]);

  const toggleModule = (m: string) => {
    setSelectedModules((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  /* ---------- SAVE UPDATE ---------- */
  const handleSave = async () => {
    setLoading(true);
    try {
      await fetch("/api/lms/students/by-email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          modules: selectedModules,
          status,
        }),
      });

      onUpdated();
      onClose();
    } catch {
      alert("Failed to update student");
    } finally {
      setLoading(false);
    }
  };

  if (!student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-lg p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4">
          <X />
        </button>

        <h2 className="text-xl font-bold mb-4">Edit Student</h2>

        <div className="space-y-3 text-sm">
          <p><strong>Name:</strong> {student.name}</p>
          <p><strong>Email:</strong> {student.email}</p>
          <p><strong>Course:</strong> {student.course}</p>

          {/* MODULES */}
          <div>
            <p className="font-semibold mb-1">Assign Modules</p>
            <div className="space-y-1">
              {allModules.map((m) => (
                <label key={m} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedModules.includes(m)}
                    onChange={() => toggleModule(m)}
                  />
                  {m}
                </label>
              ))}
            </div>
          </div>

          {/* STATUS */}
          <div>
            <p className="font-semibold mb-1">Status</p>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border rounded px-3 py-1"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="mt-6 w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg font-bold"
        >
          <Save size={16} /> Save Changes
        </button>
      </div>
    </div>
  );
}
