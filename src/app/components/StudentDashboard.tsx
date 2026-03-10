"use client";

import React, { useEffect, useState } from "react";

type Assignment = {
  studentId: number | string;
  courseId: number;
  courseName: string;
  assignedModules: string[];
  assignedAt: string;
};

export default function StudentDashboard() {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [studentId, setStudentId] = useState<number | string | null>(null);

  useEffect(() => {
    // Get logged in user from localStorage (ensure your login saves id)
    const stored = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const id = parsed?.id ?? parsed?.user?.id ?? null;
        if (id) setStudentId(id);
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    if (!studentId) return;
    const raw = localStorage.getItem(`student-course-${studentId}`);
    if (raw) {
      try {
        setAssignment(JSON.parse(raw));
      } catch {
        setAssignment(null);
      }
    }
  }, [studentId]);

  if (!studentId) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold">Student Dashboard</h2>
        <p className="text-sm text-gray-600 mt-2">You must be logged in to see your courses.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">Your Courses</h2>

      {!assignment ? (
        <div className="mt-6">
          <p>No assigned course found yet. Please contact your admin.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-lg font-semibold">{assignment.courseName}</h3>
            <p className="text-sm text-gray-500">Assigned on: {new Date(assignment.assignedAt).toLocaleString()}</p>

            <div className="mt-4">
              <h4 className="font-medium">Your Modules</h4>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                {assignment.assignedModules.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
