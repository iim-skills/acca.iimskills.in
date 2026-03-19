"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  BookOpen,
  Layers,
  Users,
  Pencil,
  Loader2,
  Trash2,
  ChevronDown,
  Check,
  X,
} from "lucide-react";

import CreateNewCourse from "./createNewCourse";
import EditCourse from "./editCourse";
import { Course } from "./types/course";

export default function CourseBuilderPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");

  useEffect(() => {
    loadCourses();
  }, []);

  /* ================= LOAD ================= */

  const loadCourses = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/admin/courses");
      const data = await res.json();

      const normalized: Course[] = Array.isArray(data)
        ? data.map((c: any) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            courseData: {
              modules: c.courseData?.modules || c.modules || [],
            },
          }))
        : [];

      setCourses(normalized);
    } catch (err) {
      console.error(err);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  /* ================= ACTIONS ================= */

  const openEdit = (course: Course) => {
    setEditingCourse(course);
    setIsEditOpen(true);
  };

  const startEditingCourse = (course: Course) => {
    setEditingId(course.id);
    setEditName(course.name);
    setEditSlug(course.slug || "");
  };

  const cancelEditingCourse = () => {
    setEditingId(null);
    setEditName("");
    setEditSlug("");
  };

  const updateCourse = async (id: string | number) => {
    const trimmedName = editName.trim();
    const trimmedSlug = editSlug.trim();

    if (!trimmedName) {
      alert("Course name is required");
      return;
    }

    if (!trimmedSlug) {
      alert("Course slug is required");
      return;
    }

    try {
      await fetch("/api/admin/courses/update-course-name", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          name: trimmedName,
          slug: trimmedSlug,
        }),
      });

      setEditingId(null);
      setEditName("");
      setEditSlug("");
      loadCourses();
    } catch (err) {
      console.error(err);
      alert("Failed to update course");
    }
  };

  const deleteCourse = async (id: string | number) => {
    if (!confirm("Delete this course?")) return;

    try {
      await fetch("/api/admin/courses/delete-course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      loadCourses();
    } catch (err) {
      console.error(err);
      alert("Failed to delete course");
    }
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon={<BookOpen className="text-blue-600" />}
            label="Total Courses"
            count={courses.length}
          />
          <StatCard
            icon={<Layers className="text-blue-600" />}
            label="Active Courses"
            count={courses.length}
          />
          <StatCard
            icon={<Users className="text-blue-600" />}
            label="Total Students"
            count={3}
          />
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="px-6 py-4 text-xs text-left uppercase tracking-wider text-slate-500">
                    Course
                  </th>
                  <th className="px-6 py-4 text-xs text-left uppercase tracking-wider text-slate-500">
                    Module
                  </th>
                  <th className="px-6 py-4 text-xs text-left uppercase tracking-wider text-slate-500">
                    Submodules
                  </th>
                  <th className="px-6 py-4 text-xs text-right uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-20 text-center">
                      <Loader2 className="animate-spin mx-auto text-indigo-600" />
                    </td>
                  </tr>
                ) : (
                  courses.map((course) => (
                    <tr
                      key={course.id}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      {/* NAME / SLUG */}
                      <td className="px-6 py-4">
                        {editingId === course.id ? (
                          <div className="space-y-2">
                            <input
                              value={editName}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditName(val);
                                setEditSlug(
                                  val.toLowerCase().replace(/\s+/g, "-")
                                );
                              }}
                              className="w-full border px-3 py-2 rounded-lg text-sm"
                              placeholder="Course name"
                            />

                            <input
                              value={editSlug}
                              onChange={(e) => setEditSlug(e.target.value)}
                              className="w-full border px-3 py-2 rounded-lg text-sm"
                              placeholder="Course slug"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="font-bold text-slate-800 text-[15px]">
                              {course.name}
                            </div>
                            <div className="text-xs text-blue-400 font-medium">
                              /{course.slug}
                            </div>
                          </>
                        )}
                      </td>

                      {/* MODULE */}
                      <td className="px-6 py-4 text-slate-700">
                        {course.courseData.modules[0]?.name || "—"}
                      </td>

                      {/* SUBMODULES */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {course.courseData.modules[0]?.submodules?.length ? (
                            course.courseData.modules[0].submodules.map(
                              (sub: any) => (
                                <span
                                  key={sub.submoduleId}
                                  className="bg-white border border-slate-200 px-3 py-1 rounded-full text-[13px] text-slate-600 shadow-sm"
                                >
                                  {sub.title}
                                </span>
                              )
                            )
                          ) : (
                            <span className="text-slate-300 text-sm italic font-light">
                              Empty
                            </span>
                          )}
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {editingId === course.id ? (
                            <>
                              <button
                                onClick={() => updateCourse(course.id)}
                                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all"
                              >
                                <Check size={16} />
                                Save
                              </button>

                              <button
                                onClick={cancelEditingCourse}
                                className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold text-sm transition-all"
                              >
                                <X size={16} />
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEditingCourse(course)}
                                className="inline-flex items-center gap-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-4 py-2 rounded-lg font-bold text-sm transition-all"
                              >
                                <Pencil size={16} />
                                 
                              </button>

                              <button
                                onClick={() => deleteCourse(course.id)}
                                className="inline-flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2 rounded-lg font-bold text-sm transition-all"
                              >
                                <Trash2 size={16} />
                                 
                              </button>

                              <button
                                onClick={() => openEdit(course)}
                                className="inline-flex items-center gap-2 bg-[#EEF2FF] hover:bg-indigo-100 text-[#4F46E5] px-4 py-2 rounded-lg font-bold text-sm transition-all"
                              >
                                <Pencil size={16} />
                                Curriculum
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ADD BUTTON */}
        <div className="flex justify-end">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
          >
            <Plus size={20} /> Add New Course
          </button>
        </div>
      </div>

      {/* MODALS */}
      <CreateNewCourse
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={loadCourses}
      />

      <EditCourse
        isOpen={isEditOpen}
        course={editingCourse}
        onClose={() => setIsEditOpen(false)}
        onSaved={loadCourses}
      />
    </div>
  );
}

/* ================= HELPER COMPONENTS ================= */

function StatCard({
  icon,
  label,
  count,
}: {
  icon: any;
  label: string;
  count: number;
}) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900 leading-tight">
          {count}
        </p>
      </div>
    </div>
  );
}