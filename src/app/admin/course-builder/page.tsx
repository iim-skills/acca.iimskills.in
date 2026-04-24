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
  Check,
  X,
  Search,
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
  const [search, setSearch] = useState("");
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
      const res = await fetch("/api/admin/courses/update-course-name", {
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

      if (!res.ok) {
        throw new Error("Failed to update course");
      }

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
      const res = await fetch("/api/admin/courses/delete-course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        throw new Error("Failed to delete course");
      }

      loadCourses();
    } catch (err) {
      console.error(err);
      alert("Failed to delete course");
    }
  };

  const renderSubmodules = (course: Course) => {
    const submodules = course.courseData.modules[0]?.submodules || [];

    if (!submodules.length) {
      return (
        <span className="text-slate-400 text-sm italic font-light">
          Empty
        </span>
      );
    }

    return (
      <div className="flex flex-wrap gap-2">
        {submodules.map((sub: any) => (
          <span
            key={sub.submoduleId}
            className="bg-white border border-slate-200 px-3 py-1 rounded-full text-[13px] text-slate-600 shadow-sm"
          >
            {sub.title}
          </span>
        ))}
      </div>
    );
  };

  /* ================= UI ================= */

  return (
    <div className=" bg-[#F8FAFC] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6 lg:space-y-8">
        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search by coupon code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:max-w-sm pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all text-sm"
        />
      </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="w-full text-sm sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
          >
            <Plus size={20} /> Add New Course
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
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

        {/* CONTENT */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          
          {loading ? (
            <div className="py-20 flex items-center justify-center">
              <Loader2 className="animate-spin text-indigo-600" size={28} />
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden lg:block overflow-x-auto">
                
                <table className="w-full">
                  <thead className="border-b bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-xs text-left uppercase tracking-wider text-slate-500">
                        Course
                      </th>
                      {/* <th className="px-6 py-4 text-xs text-left uppercase tracking-wider text-slate-500">
                        Module
                      </th>
                      <th className="px-6 py-4 text-xs text-left uppercase tracking-wider text-slate-500">
                        Submodules
                      </th> */}
                      <th className="px-6 py-4 text-xs text-right uppercase tracking-wider text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {courses.length ? (
                      courses.map((course) => (
                        <tr
                          key={course.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            {editingId === course.id ? (
                              <div className="space-y-2 max-w-md">
                                <input
                                  value={editName}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setEditName(val);
                                    setEditSlug(
                                      val.toLowerCase().replace(/\s+/g, "-")
                                    );
                                  }}
                                  className="w-full border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none px-3 py-2 rounded-lg text-sm"
                                  placeholder="Course name"
                                />

                                <input
                                  value={editSlug}
                                  onChange={(e) => setEditSlug(e.target.value)}
                                  className="w-full border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none px-3 py-2 rounded-lg text-sm"
                                  placeholder="Course slug"
                                />
                              </div>
                            ) : (
                              <>
                                <div className="font-semibold text-slate-800 text-[15px]">
                                  {course.name}
                                </div>
                                <div className="text-xs text-blue-500 font-medium mt-0.5">
                                  /{course.slug}
                                </div>
                              </>
                            )}
                          </td>

                          {/* <td className="px-6 py-4 text-slate-700">
                            {course.courseData.modules[0]?.name || "—"}
                          </td>

                          <td className="px-6 py-4">
                            {renderSubmodules(course)}
                          </td> */}

                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              {editingId === course.id ? (
                                <>
                                  <button
                                    onClick={() => updateCourse(course.id)}
                                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all"
                                  >
                                    <Check size={16} />
                                    Save
                                  </button>

                                  <button
                                    onClick={cancelEditingCourse}
                                    className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-semibold text-sm transition-all"
                                  >
                                    <X size={16} />
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startEditingCourse(course)}
                                    className="inline-flex items-center gap-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-4 py-2 rounded-lg font-semibold text-sm transition-all"
                                  >
                                    <Pencil size={16} />
                                    Edit
                                  </button>

                                  <button
                                    onClick={() => deleteCourse(course.id)}
                                    className="inline-flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2 rounded-lg font-semibold text-sm transition-all"
                                  >
                                    <Trash2 size={16} />
                                    Delete
                                  </button>

                                  <button
                                    onClick={() => openEdit(course)}
                                    className="inline-flex items-center gap-2 bg-[#EEF2FF] hover:bg-indigo-100 text-[#4F46E5] px-4 py-2 rounded-lg font-semibold text-sm transition-all"
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
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-16 text-center">
                          <div className="text-slate-500">No courses found.</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE / TABLET CARDS */}
              <div className="lg:hidden divide-y divide-slate-100">
                {courses.length ? (
                  courses.map((course) => (
                    <div key={course.id} className="p-4 sm:p-5 space-y-4">
                      {editingId === course.id ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">
                              Course Name
                            </label>
                            <input
                              value={editName}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditName(val);
                                setEditSlug(
                                  val.toLowerCase().replace(/\s+/g, "-")
                                );
                              }}
                              className="w-full border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none px-3 py-2.5 rounded-xl text-sm"
                              placeholder="Course name"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">
                              Course Slug
                            </label>
                            <input
                              value={editSlug}
                              onChange={(e) => setEditSlug(e.target.value)}
                              className="w-full border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none px-3 py-2.5 rounded-xl text-sm"
                              placeholder="Course slug"
                            />
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => updateCourse(course.id)}
                              className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
                            >
                              <Check size={16} />
                              Save
                            </button>

                            <button
                              onClick={cancelEditingCourse}
                              className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
                            >
                              <X size={16} />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div>
                            <h3 className="font-semibold text-slate-800 text-base sm:text-lg">
                              {course.name}
                            </h3>
                            <p className="text-xs sm:text-sm text-blue-500 font-medium mt-1 break-all">
                              /{course.slug}
                            </p>
                          </div>

                          <div className="space-y-1.5">
                            <p className="text-sm text-slate-600">
                              <span className="font-medium text-slate-800">
                                Module:
                              </span>{" "}
                              {course.courseData.modules[0]?.name || "—"}
                            </p>
                            <div className="pt-1">{renderSubmodules(course)}</div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                              onClick={() => startEditingCourse(course)}
                              className="inline-flex items-center justify-center gap-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
                            >
                              <Pencil size={16} />
                              Edit
                            </button>

                            <button
                              onClick={() => deleteCourse(course.id)}
                              className="inline-flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
                            >
                              <Trash2 size={16} />
                              Delete
                            </button>
                          </div>

                          <button
                            onClick={() => openEdit(course)}
                            className="w-full inline-flex items-center justify-center gap-2 bg-[#EEF2FF] hover:bg-indigo-100 text-[#4F46E5] px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
                          >
                            <Pencil size={16} />
                            Edit Curriculum
                          </button>
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-16 text-center">
                    <div className="text-slate-500">No courses found.</div>
                  </div>
                )}
              </div>
            </>
          )}
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
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900 leading-tight">
          {count}
        </p>
      </div>
    </div>
  );
}