"use client";

import React, { useEffect, useState } from "react";

type Course = {
  id: number;
  name: string;
  description?: string;
  modules: string[];
};

type Assignment = {
  studentId: number | string;
  courseId: number;
  courseName: string;
  assignedModules: string[];
  assignedAt: string;
};

export default function AssignCourseForm({ studentId }: { studentId: number | string }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | "">("");
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCourses(data);
        else setCourses([]);
      })
      .catch((err) => {
        console.error("Error loading courses", err);
        setCourses([]);
      });
  }, []);

  const course = courses.find((c) => c.id === Number(selectedCourseId));

  const toggleModule = (m: string) => {
    setSelectedModules((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  };

  const handleAssign = () => {
    if (!course) {
      setMessage("Please select a course.");
      return;
    }
    if (selectedModules.length === 0) {
      setMessage("Select at least one module to assign.");
      return;
    }

    const assignment: Assignment = {
      studentId,
      courseId: course.id,
      courseName: course.name,
      assignedModules: selectedModules,
      assignedAt: new Date().toISOString(),
    };

    // For now store in localStorage (keyed by student)
    localStorage.setItem(`student-course-${studentId}`, JSON.stringify(assignment));

    setMessage(`Assigned ${selectedModules.length} module(s) of "${course.name}" to student ${studentId}.`);
    // reset selection (optional)
    setSelectedCourseId("");
    setSelectedModules([]);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-4">
      <h3 className="text-lg font-semibold">Assign Course (module-wise)</h3>

      <div>
        <label className="block text-sm font-medium mb-1">Select Course</label>
        <select
          className="w-full border rounded p-2"
          value={selectedCourseId}
          onChange={(e) => {
            setSelectedCourseId(e.target.value === "" ? "" : Number(e.target.value));
            setSelectedModules([]); // reset modules when changing course
            setMessage("");
          }}
        >
          <option value="">-- choose course --</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {course && (
        <div>
          <p className="text-sm text-gray-600 mb-2">Modules (check only paid modules to assign)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {course.modules.map((m) => (
              <label key={m} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedModules.includes(m)}
                  onChange={() => toggleModule(m)}
                />
                <span>{m}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={handleAssign} className="bg-blue-600 text-white px-4 py-2 rounded">
          Assign
        </button>
        <button
          onClick={() => {
            setSelectedCourseId("");
            setSelectedModules([]);
            setMessage("");
          }}
          className="px-4 py-2 border rounded"
        >
          Reset
        </button>
      </div>

      {message && <div className="text-sm text-green-700 mt-2">{message}</div>}
    </div>
  );
}
