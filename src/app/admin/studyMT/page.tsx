"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FileText,
  Plus,
  Trash2,
  Eye,
  Files,
  CheckCircle,
  XCircle,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type PdfRow = {
  id: number;
  course_id: string;
  course_name: string;
  module_id: string;
  module_name: string;
  submodule_id: string;
  submodule_name: string;
  pdf_name: string;
  pdf_url: string;
};

type Item = {
  type: "video" | "quiz" | "pdf";
  name: string;
  videoId?: string;
  quizId?: string;
  pdfId?: string;
  fileUrl?: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
};

type Submodule = {
  submoduleId: string;
  title: string;
  items: Item[];
};

type Module = {
  moduleId: string;
  name: string;
  submodules: Submodule[];
};

type CourseData = {
  modules: Module[];
};

type Course = {
  courseId: string;
  name: string;
  courseData: CourseData;
};

const ITEMS_PER_PAGE = 5;

export default function CourseContentDashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [pdfRows, setPdfRows] = useState<PdfRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSubmodule, setSelectedSubmodule] = useState<Submodule | null>(
    null
  );

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [selectedSubmoduleId, setSelectedSubmoduleId] = useState("");
  const [fileName, setFileName] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchCourses = async () => {
    try {
      const res = await axios.get("/api/admin/upload-pdf");
      setCourses(res.data?.courses || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
      setCourses([]);
    }
  };

  const fetchPdfRows = async () => {
    try {
      setLoadingRows(true);
      const res = await axios.get("/api/admin/upload-pdf");
      setPdfRows(res.data?.pdfs || res.data?.rows || []);
    } catch (error) {
      console.error("Error fetching pdf rows:", error);
      setPdfRows([]);
    } finally {
      setLoadingRows(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchPdfRows();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const selectedCourse = useMemo(
    () => courses.find((c) => c.courseId === selectedCourseId),
    [courses, selectedCourseId]
  );

  const selectedModule = useMemo(
    () =>
      selectedCourse?.courseData.modules.find(
        (m) => m.moduleId === selectedModuleId
      ),
    [selectedCourse, selectedModuleId]
  );

  const activeSubmodule = useMemo(
    () =>
      selectedModule?.submodules.find(
        (s) => s.submoduleId === selectedSubmoduleId
      ) || selectedSubmodule,
    [selectedModule, selectedSubmoduleId, selectedSubmodule]
  );

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return pdfRows;

    return pdfRows.filter((row) =>
      [
        row.course_name,
        row.module_name,
        row.submodule_name,
        row.pdf_name,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [pdfRows, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, currentPage]);

  const totalFiles = pdfRows.length;
  const pdfCount = pdfRows.length;
  const otherCount = 0;

  const handleCloseModal = () => {
    setShowUploadModal(false);
    setSelectedCourseId("");
    setSelectedModuleId("");
    setSelectedSubmoduleId("");
    setFileName("");
    setPdfFile(null);
    setUploading(false);
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!pdfFile) {
      alert("Please select a PDF file");
      return;
    }

    if (!selectedCourseId || !selectedModuleId || !selectedSubmoduleId) {
      alert("Please select course, module, and submodule");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", pdfFile);
      formData.append("name", fileName || pdfFile.name);
      formData.append("courseId", selectedCourseId);
      formData.append("moduleId", selectedModuleId);
      formData.append("submoduleId", selectedSubmoduleId);

      const res = await fetch("/api/admin/upload-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Upload failed");
      }

      await fetchPdfRows();
      await fetchCourses();

      alert("PDF uploaded successfully ✅");
      handleCloseModal();
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(error?.message || "Upload failed ❌");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const ok = confirm("Are you sure you want to delete this PDF?");
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/upload-pdf?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Delete failed");
      }

      setPdfRows((prev) => prev.filter((row) => row.id !== id));
      alert("PDF deleted successfully ✅");
    } catch (error: any) {
      console.error("Delete error:", error);
      alert(error?.message || "Delete failed ❌");
    }
  };

  const goToPage = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(nextPage);
  };

  const startItem = filteredRows.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, filteredRows.length);

  return (
    <div className="bg-[#F8FAFC] p-8 min-h-screen">
      <div className="mx-auto space-y-6 max-w-7xl">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard
            title="Total Assets"
            value={totalFiles}
            icon={<Files className="text-blue-500" />}
            colorClass="bg-blue-500/10"
          />
          <StatCard
            title="Active PDFs"
            value={pdfCount}
            icon={<CheckCircle className="text-green-500" />}
            colorClass="bg-green-500/10"
          />
          <StatCard
            title="Other Media"
            value={otherCount}
            icon={<XCircle className="text-orange-500" />}
            colorClass="bg-orange-500/10"
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-gray-50 p-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                Resource Management
              </h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-[320px]">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search course, module, submodule..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all text-sm"
                />
              </div>

              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700"
              >
                <Plus size={18} />
                New Upload
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Course Name
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Module Name
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Submodule Name
                  </th>
                  <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {loadingRows ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-10 text-center text-sm text-gray-500"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : paginatedRows.length > 0 ? (
                  paginatedRows.map((row, idx) => (
                    <motion.tr
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={row.id}
                      className="group transition-colors hover:bg-blue-50/30"
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-700">
                          {row.course_name}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        {row.module_name}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        {row.submodule_name}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-4">
                          <a
                            href={row.pdf_url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-sm font-medium text-blue-500 hover:text-blue-700"
                          >
                            <Eye size={16} /> View
                          </a>
                          <button
                            onClick={() => handleDelete(row.id)}
                            className="flex items-center gap-1 text-sm font-medium text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={16} /> Delete
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-20 text-center text-sm italic text-gray-400"
                    >
                      No PDF data found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="flex flex-col gap-4 border-t border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                {filteredRows.length > 0
                  ? `Showing ${startItem}-${endItem} of ${filteredRows.length} entries`
                  : "No entries to show"}
              </p>

              {filteredRows.length > 0 && totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft size={16} />
                    Prev
                  </button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`min-w-10 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                            currentPage === page
                              ? "bg-blue-600 text-white"
                              : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>

            {!activeSubmodule && pdfRows.length === 0 && (
              <div className="py-20 text-center text-sm italic text-gray-400">
                Please select a course and submodule to view resources.
              </div>
            )}
          </div>
        </div>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-bold">Upload PDF</h3>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-2xl leading-none text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Upload Name
                </label>
                <input
                  type="text"
                  placeholder="Enter upload name"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Select Course
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => {
                    setSelectedCourseId(e.target.value);
                    setSelectedModuleId("");
                    setSelectedSubmoduleId("");
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Select Course</option>
                  {courses.map((course) => (
                    <option key={course.courseId} value={course.courseId}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Select Module
                </label>
                <select
                  value={selectedModuleId}
                  onChange={(e) => {
                    setSelectedModuleId(e.target.value);
                    setSelectedSubmoduleId("");
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none disabled:bg-gray-100 focus:border-blue-500"
                  required
                  disabled={!selectedCourseId}
                >
                  <option value="">Select Module</option>
                  {courses
                    .find((c) => c.courseId === selectedCourseId)
                    ?.courseData.modules.map((mod) => (
                      <option key={mod.moduleId} value={mod.moduleId}>
                        {mod.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Select Submodule
                </label>
                <select
                  value={selectedSubmoduleId}
                  onChange={(e) => setSelectedSubmoduleId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none disabled:bg-gray-100 focus:border-blue-500"
                  required
                  disabled={!selectedModuleId}
                >
                  <option value="">Select Submodule</option>
                  {courses
                    .find((c) => c.courseId === selectedCourseId)
                    ?.courseData.modules.find(
                      (m) => m.moduleId === selectedModuleId
                    )
                    ?.submodules.map((sub) => (
                      <option key={sub.submoduleId} value={sub.submoduleId}>
                        {sub.title}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Select PDF
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3"
                  required
                />
                {pdfFile && (
                  <p className="mt-2 text-xs text-gray-500">
                    Selected: {pdfFile.name}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  colorClass,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  colorClass: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="flex items-center gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
    >
      <div className={`flex items-center justify-center rounded-2xl p-4 ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          {title}
        </p>
        <p className="text-2xl font-black text-gray-800">{value}</p>
      </div>
    </motion.div>
  );
}