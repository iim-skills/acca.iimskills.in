"use client";

import React, { useEffect, useState } from "react";
import {
  Upload,
  Loader2,
  Trash2,
  Film,
  Plus,
  X,
  CheckCircle2,
  PlayCircle,
  Search,
  ChevronRight,
  Clock,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Lightweight types (adjust to match your backend shape if you want) ---
type MsgType = "success" | "error" | "";

type Batch = {
  id: string | number;
  name?: string;
  level?: string;
  type?: string;
  startDate?: string | null;
};

type RawSubmodule = {
  submoduleId?: string;
  id?: string;
  slug?: string;
  title?: string;
  name?: string;
  [k: string]: any;
};

type RawModule = {
  moduleId?: string;
  slug?: string;
  id?: string;
  name?: string;
  title?: string;
  submodules?: RawSubmodule[];
  [k: string]: any;
};

type Course = {
  slug: string;
  name?: string;
  modules?: Array<string | RawModule>;
  [k: string]: any;
};

type Video = {
  id?: string | number;
  name?: string;
  title?: string;
  course_slug?: string;
  courseSlug?: string;
  module?: string;
  moduleId?: string;
  submodule?: string;
  submoduleTitle?: string;
  batch_ids?: Array<string | number>;
  uploaded_at?: string;
  uploadedAt?: string;
  created_at?: string;
  createdAt?: string;
  s3_url?: string;
  s3Url?: string;
  url?: string;
  [k: string]: any;
};

type NormalizedSub = { id: string; title: string; raw?: RawSubmodule };
type NormalizedModule = { id: string; name: string; submodules: NormalizedSub[]; raw?: RawModule };

// Simple UUID fallback
const generateId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2);

// --- Component ---
export default function VideoAdmin(): React.ReactElement {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // UI State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<{ text: string; type: MsgType }>({ text: "", type: "" });

  // Form State
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [selectedSubmodule, setSelectedSubmodule] = useState<string>("");
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]); // <-- typed
  const [selectAllBatches, setSelectAllBatches] = useState(false);
  const [videoName, setVideoName] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInitial = async () => {
    await Promise.all([loadBatches(), loadCourses(), loadVideos()]);
  };

  const loadBatches = async () => {
    try {
      const res = await fetch("/api/admin/batches");
      if (!res.ok) throw new Error("Failed to load batches");
      const data = await res.json();
      setBatches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("loadBatches:", err);
      setBatches([]);
    }
  };

  const loadCourses = async () => {
    try {
      const res = await fetch("/api/admin/courses");
      if (!res.ok) throw new Error("Failed to load courses");
      const data = await res.json();
      setCourses(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0) setSelectedCourse((data[0].slug as string) ?? "");
    } catch (err) {
      console.error("loadCourses:", err);
      setCourses([]);
    }
  };

  const loadVideos = async () => {
    try {
      const res = await fetch("/api/admin/videos");
      if (!res.ok) throw new Error("Failed to load videos");
      const data = await res.json();
      setVideos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("loadVideos:", err);
      setVideos([]);
    }
  };

  // --- fix for "sidx implicitly any" by typing parameters ---
  const normalizeCourseModules = (course?: Course | null): NormalizedModule[] => {
    if (!course || !Array.isArray(course.modules)) return [];
    return course.modules.map((m, idx: number) => {
      if (typeof m === "string") return { id: m, name: m, submodules: [] };
      const mm = m as RawModule;
      const id = mm.moduleId ?? mm.slug ?? mm.id ?? `module_${idx}`;
      const name = mm.name ?? mm.title ?? String(id);
      const submodules: NormalizedSub[] = Array.isArray(mm.submodules)
        ? mm.submodules.map((s: RawSubmodule, sidx: number) => {
            const sid = s.submoduleId ?? s.id ?? s.slug ?? `${id}_sub_${sidx}`;
            const title = s.title ?? s.name ?? String(sid);
            return { id: String(sid), title: String(title), raw: s };
          })
        : [];
      return { id: String(id), name: String(name), submodules, raw: mm };
    });
  };

  useEffect(() => {
    const c = courses.find((x) => x.slug === selectedCourse);
    if (!c) {
      setSelectedModule("");
      setSelectedSubmodule("");
      return;
    }
    const modules = normalizeCourseModules(c);
    if (modules.length > 0) {
      const firstModule = modules[0];
      if (!modules.some((m) => m.id === selectedModule)) {
        setSelectedModule(firstModule.id);
        const firstSub = firstModule.submodules?.[0];
        setSelectedSubmodule(firstSub ? firstSub.id : "");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourse, courses]);

  const toggleBatch = (id: string | number) => {
    const s = String(id);
    setSelectedBatches((prev) => {
      const next = prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s];
      setSelectAllBatches(next.length > 0 && next.length === batches.length);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!selectAllBatches) {
      setSelectedBatches(batches.map((b) => String(b.id)));
      setSelectAllBatches(true);
    } else {
      setSelectedBatches([]);
      setSelectAllBatches(false);
    }
  };

  // --- fix for "Parameter 'text' implicitly has an 'any' type." ---
  const showMsg = (text: string, type: MsgType = "error"): void => {
    setMessage({ text, type });
    if (type === "success") {
      setTimeout(() => setMessage({ text: "", type: "" }), 5000);
    }
  };

const handleUpload = async () => {
  if (!videoName.trim()) return showMsg("Provide a video name.");
  if (!file) return showMsg("Select a video file.");
  if (!selectedModule) return showMsg("Select a module.");
  if (selectedBatches.length === 0) return showMsg("Select at least one batch.");

  try {
    setUploading(true);
    setProgress(0);

    /* ================================
       1️⃣ UPLOAD VIDEO TO CLOUDINARY
    ================================= */
    const formData = new FormData();
    const clientFilename = `${generateId()}_${file.name.replace(/\s+/g, "_")}`;
    formData.append("file", file, clientFilename);

    const uploadResult = await new Promise<any>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/admin/videos/upload", true);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        try {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        } catch (e) {
          reject(e);
        }
      };

      xhr.onerror = () => reject(new Error("Network error"));
      xhr.send(formData);
    });

    console.log("UPLOAD RESULT:", uploadResult);

    /* ================================
       2️⃣ EXTRACT CLOUDINARY DATA
    ================================= */
    const publicId = uploadResult?.public_id ?? null;
    const secureUrl = uploadResult?.secure_url ?? null;
    const thumbUrl = uploadResult?.thumb_url ?? null;
    const duration = uploadResult?.duration ?? null;

    if (!publicId || !secureUrl) {
      throw new Error("Upload response missing public_id or secure_url");
    }

    /* ================================
       3️⃣ GET SUBMODULE TITLE
    ================================= */
    let submoduleTitle = "";

    const currentC = courses.find((c) => c.slug === selectedCourse);
    if (currentC && selectedSubmodule) {
      const mods = normalizeCourseModules(currentC);
      const targetM = mods.find((m) => m.id === selectedModule);
      submoduleTitle =
        targetM?.submodules?.find((s) => s.id === selectedSubmodule)?.title || "";
    }

    /* ================================
       4️⃣ SAVE VIDEO TO DATABASE
    ================================= */
    const saveRes = await fetch("/api/admin/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: videoName,

        // ⭐ IMPORTANT (matches backend)
        public_id: publicId,
        secure_url: secureUrl,
        thumb_url: thumbUrl,
        duration: duration,

        course_slug: selectedCourse,
        module_id: selectedModule,
        submodule_id: selectedSubmodule || null,
        submodule_title: submoduleTitle || null,
        batch_ids: selectedBatches,
        uploaded_by: "admin",
      }),
    });

    if (!saveRes.ok) {
      throw new Error("Metadata save failed");
    }

    /* ================================
       5️⃣ SUCCESS RESET UI
    ================================= */
    showMsg("Video uploaded successfully!", "success");

    setVideoName("");
    setFile(null);
    setSelectedBatches([]);
    setSelectAllBatches(false);
    setIsDrawerOpen(false);

    await loadVideos();
  } catch (err: any) {
    console.error(err);
    showMsg(err?.message || "Upload failed");
  } finally {
    setUploading(false);
    setProgress(0);
  }
};

  const removeVideo = async (id?: string | number) => {
    // eslint-disable-next-line no-alert
    if (!confirm("Are you sure you want to delete this video?")) return;
    try {
      const res = await fetch(`/api/admin/videos?id=${encodeURIComponent(String(id ?? ""))}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      showMsg("Video deleted", "success");
      await loadVideos();
    } catch (err: unknown) {
      showMsg((err as Error)?.message ?? String(err));
    }
  };

  const currentModules = normalizeCourseModules(courses.find((c) => c.slug === selectedCourse) ?? null);
  const currentSubmodules = currentModules.find((m) => m.id === selectedModule)?.submodules ?? [];

  const filteredVideos = videos.filter((v) => {
    const name = (v?.name ?? v?.title ?? "").toString().toLowerCase();
    const courseSlug = (v?.course_slug ?? v?.courseSlug ?? "").toString().toLowerCase();
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return name.includes(q) || courseSlug.includes(q);
  });

  const safeDate = (d?: string | null) => {
    if (!d) return "-";
    try {
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return "-";
      return dt.toLocaleDateString();
    } catch {
      return "-";
    }
  };

  const getS3Url = (v: Video) => v?.s3_url ?? v?.s3Url ?? v?.url ?? v?.fileUrl ?? "#";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* HEADER */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Film size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Video Central</h1>
          </div>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm active:scale-95"
          >
            <Plus size={18} />
            <span>Upload Video</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* STATS SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="text-slate-500 text-sm font-medium mb-1 uppercase tracking-wider">Total Videos</div>
            <div className="text-3xl font-bold">{videos.length}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="text-slate-500 text-sm font-medium mb-1 uppercase tracking-wider">Active Batches</div>
            <div className="text-3xl font-bold">{batches.length}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="text-slate-500 text-sm font-medium mb-1 uppercase tracking-wider">Recent Uploads</div>
            <div className="text-3xl font-bold">
              {videos.filter((v) => {
                const uploadedAt = v?.uploaded_at ?? v?.uploadedAt ?? v?.created_at ?? v?.createdAt;
                if (!uploadedAt) return false;
                const date = new Date(uploadedAt);
                if (Number.isNaN(date.getTime())) return false;
                return date > new Date(Date.now() - 86400000 * 7);
              }).length}
            </div>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by title or course..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {message.text && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                }`}
              >
                {message.type === "success" ? <CheckCircle2 size={16} /> : <X size={16} />}
                {message.text}
              </motion.div>
            )}
          </div>
        </div>

        {/* VIDEOS GRID */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {filteredVideos.length === 0 ? (
            <div className="p-20 text-center">
              <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Film size={32} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">No videos found</h3>
              <p className="text-slate-500">Get started by uploading your first educational video.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Video Details</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Course / Module</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Batches</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Uploaded</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredVideos.map((v) => {
                    const id = v?.id ?? v?._id ?? generateId();
                    const name = v?.name ?? v?.title ?? "Untitled";
                    const courseSlug = v?.course_slug ?? v?.courseSlug ?? "-";
                    const moduleName = v?.module ?? v?.moduleId ?? v?.module_name ?? "";
                    const submoduleName = v?.submodule ?? v?.submoduleTitle ?? v?.submodule_id ?? "";
                    const fileUrl = getS3Url(v);
                    const uploadedAt = v?.uploaded_at ?? v?.uploadedAt ?? v?.created_at ?? v?.createdAt;
                    return (
                      <motion.tr layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={String(id)} className="group hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-slate-900 rounded flex items-center justify-center text-white shrink-0">
                              <PlayCircle size={20} />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 leading-tight mb-1">{name}</div>
                              <div className="flex items-center gap-2 text-xs text-blue-600 font-medium">
                                <ExternalLink size={12} />
                                <a href={fileUrl} target="_blank" rel="noreferrer" className="hover:underline">
                                  View File
                                </a>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold uppercase w-fit">
                              {courseSlug}
                            </div>
                            <div className="text-sm text-slate-700 truncate max-w-37.5">
                              {moduleName} {submoduleName && <span className="text-slate-400">/ {submoduleName}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1 max-w-50">
                            {Array.isArray(v?.batch_ids) ? (
                              v.batch_ids.map((bid, i) => (
                                <span key={i} className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">
                                  {String(bid)}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400">No batches</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Clock size={14} />
                            {safeDate(uploadedAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => removeVideo(id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="Delete Video"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* RIGHT SIDE SLIDE-OVER DRAWER */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !uploading && setIsDrawerOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            />
            {/* Drawer Content */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-lg bg-white z-50 shadow-2xl flex flex-col"
            >
              {/* Drawer Header */}
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-lg">
                  <div className="text-blue-600 bg-blue-50 p-1.5 rounded">
                    <Upload size={20} />
                  </div>
                  New Video Upload
                </div>
                <button onClick={() => setIsDrawerOpen(false)} disabled={uploading} className="p-2 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-30">
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Body - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* 1. Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Display Name</label>
                  <input
                    value={videoName}
                    onChange={(e) => setVideoName(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                    placeholder="e.g. Masterclass Introduction"
                  />
                </div>

                {/* 2. Selection Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Course</label>
                    <select
                      value={selectedCourse}
                      onChange={(e) => {
                        setSelectedCourse(e.target.value);
                        setSelectedModule("");
                        setSelectedSubmodule("");
                      }}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    >
                      <option value="">Choose course</option>
                      {courses.map((c) => (
                        <option key={c.slug ?? c.name} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Module</label>
                    <select
                      value={selectedModule}
                      onChange={(e) => {
                        setSelectedModule(e.target.value);
                        const chosen = currentModules.find((m) => m.id === e.target.value);
                        setSelectedSubmodule(chosen?.submodules?.[0]?.id || "");
                      }}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    >
                      <option value="">Choose module</option>
                      {currentModules.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. Submodule */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Submodule (Optional)</label>
                  <select value={selectedSubmodule} onChange={(e) => setSelectedSubmodule(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                    <option value="">No Submodule</option>
                    {currentSubmodules.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Batch Multiselect */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-slate-700">Assign to Batches</label>
                    <button type="button" onClick={handleSelectAll} className="text-xs font-bold text-blue-600 hover:text-blue-700">
                      {selectAllBatches ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {batches.map((b) => {
                      const isChecked = selectedBatches.includes(String(b.id));
                      return (
                        <div
                          key={b.id}
                          onClick={() => toggleBatch(b.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isChecked ? "bg-blue-50 border-blue-200 ring-1 ring-blue-200" : "bg-slate-50 border-slate-100"}`}
                        >
                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isChecked ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-300"}`}>
                            {isChecked && <CheckCircle2 size={14} />}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-800">{b.name}</div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-tighter">
                              {b.level} • {b.type}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 5. File Upload Zone */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Video File</label>
                  <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50 hover:bg-slate-100 transition-colors group">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="text-center">
                      <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-slate-400 group-hover:text-blue-600 transition-colors">
                        <Upload size={24} />
                      </div>
                      {file ? (
                        <div className="text-sm font-bold text-slate-900 truncate px-4">
                          {file.name}
                          <div className="text-xs text-slate-500 font-normal mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-medium text-slate-900">Click or drag video here</p>
                          <p className="text-xs text-slate-500 mt-1">MP4, MOV, WEBM (Max 500MB recommended)</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t bg-slate-50">
                {uploading ? (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="flex items-center gap-2">
                        <Loader2 className="animate-spin text-blue-600" size={18} />
                        Uploading Content...
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="bg-blue-600 h-full rounded-full transition-all duration-300" />
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button onClick={() => setIsDrawerOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                      Cancel
                    </button>
                    <button onClick={handleUpload} className="flex-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2">
                      Start Upload
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
                {message.text && !uploading && (
                  <p className={`mt-3 text-center text-xs font-bold ${message.type === "error" ? "text-rose-600" : "text-emerald-600"}`}>{message.text}</p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}