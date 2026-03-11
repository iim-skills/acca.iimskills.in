"use client";

import React, { useEffect, useState } from "react";
import {
  Loader2,
  BookOpen,
  Edit3,
  Save,
  Trash2,
  X,
  ChevronDown,
  LayoutGrid,
  Plus,
  Pencil,
  Search,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ======================================================
   TYPES (updated: submodule uses items[])
====================================================== */

type VideoItem = {
  type: "video";
  sessionId: string;
  name: string;
  videoId?: number | string;
  videoTitle?: string;
};

type QuizItem = {
  type: "quiz";
  quizRefId: string;
  name: string;
  quizId?: number | string;
  quizTitle?: string;
};

type ItemType = VideoItem | QuizItem;

type SubmoduleType = {
  submoduleId: string;
  title: string;
  description?: string;
  items?: ItemType[]; // <-- changed
};

type ModuleType = {
  moduleId: string;
  name: string;
  description?: string;
  submodules?: SubmoduleType[];
};

type CourseType = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  modules?: ModuleType[];
  courseData?: {
    modules?: ModuleType[];
  };
};

/* ======================================================
   HELPERS (ID generation now reads items[])
====================================================== */

const generateModuleId = (modules: ModuleType[] = []) => {
  const numbers = modules
    .map((m) => Number(String(m.moduleId ?? "").replace("MOD_", "")))
    .filter((n) => !isNaN(n));
  const next = numbers.length ? Math.max(...numbers) + 1 : 1;
  return `MOD_${next}`;
};

const generateSubmoduleId = (moduleId: string, subs: SubmoduleType[] = []) => {
  const prefix = `${moduleId}_SUB_`;
  const numbers = subs
    .map((s) => Number(String(s.submoduleId ?? "").replace(prefix, "")))
    .filter((n) => !isNaN(n));
  const next = numbers.length ? Math.max(...numbers) + 1 : 1;
  return `${moduleId}_SUB_${next}`;
};

/* generate session id by scanning items for existing video ids */
const generateSessionId = (submoduleId: string, items: ItemType[] = []) => {
  const prefix = `${submoduleId}_SES_`;
  const numbers = items
    .filter((it) => it.type === "video")
    .map((it) => Number(String((it as VideoItem).sessionId ?? "").replace(prefix, "")))
    .filter((n) => !isNaN(n));
  const next = numbers.length ? Math.max(...numbers) + 1 : 1;
  return `${submoduleId}_SES_${next}`;
};

/* generate quiz id by scanning items for existing quiz ids */
const generateQuizRefId = (submoduleId: string, items: ItemType[] = []) => {
  const prefix = `${submoduleId}_QZ_`;
  const numbers = items
    .filter((it) => it.type === "quiz")
    .map((it) => Number(String((it as QuizItem).quizRefId ?? "").replace(prefix, "")))
    .filter((n) => !isNaN(n));
  const next = numbers.length ? Math.max(...numbers) + 1 : 1;
  return `${submoduleId}_QZ_${next}`;
};

/* safer keyFor: uses a separator unlikely to appear in ids */
const keyFor = (moduleId: string, submoduleId: string) =>
  `${moduleId}__${submoduleId}`;

export default function App() {
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseType | null>(null);
  const [message, setMessage] = useState({ text: "", type: "" });

  // New Course Form State
  const [newCourse, setNewCourse] = useState({ name: "", slug: "" });

  // Track selected module per course for the table view
  const [selectedModuleMap, setSelectedModuleMap] = useState<Record<number, string>>({});

  // Track which module is expanded in the edit drawer
  const [activeEditModuleId, setActiveEditModuleId] = useState<string | null>(null);

  /* ======================================================
     Data for sessions/quizzes lists (fetched from DB)
  ====================================================== */
  const [videos, setVideos] = useState<{ id: number; title: string }[]>([]);
  const [quizzes, setQuizzes] = useState<{ id: number; title: string }[]>([]);
  const [listsLoading, setListsLoading] = useState(false);
  const [listsError, setListsError] = useState<string | null>(null);

  // Modal state for adding (single modal for submodule)
  // key format: `${moduleId}__${submoduleId}`
  const [addModalKey, setAddModalKey] = useState<string | null>(null);
  const [tempAddType, setTempAddType] = useState<"Session Recording" | "Quiz" | "Doubt Solving session">("Session Recording");
  const [tempAddName, setTempAddName] = useState<string>("");
  const [tempAddSelect, setTempAddSelect] = useState<string | number>("");
  const [tempAddFile, setTempAddFile] = useState<File | null>(null);

  // UI state kept for backward compatibility but not used for inline forms
  const [addSessionOpen, setAddSessionOpen] = useState<Record<string, boolean>>({});
  const [addQuizOpen, setAddQuizOpen] = useState<Record<string, boolean>>({});

  // NEW: students count for status cards
  const [studentsCount, setStudentsCount] = useState<number>(0);

  /* ======================================================
     DATA FETCHING
  ====================================================== */

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/courses");
      const data = await response.json();
      const courseList = Array.isArray(data) ? data : [];
      setCourses(courseList);

      const initialMap: Record<number, string> = {};
      courseList.forEach(course => {
        const mods = course.courseData?.modules || course.modules || [];
        if (mods.length > 0) initialMap[course.id] = mods[0].moduleId;
      });
      setSelectedModuleMap(initialMap);

      // NEW: fetch students count (no change to other logic)
      try {
        const sRes = await fetch("/api/lms/students");
        const sData = await sRes.json();
        setStudentsCount(Array.isArray(sData) ? sData.length : (sData?.length || 0));
      } catch {
        setStudentsCount(0);
      }

    } catch (err) {
      // Mock data for preview
      const mockData: CourseType[] = [
        {
          id: 1, name: "Advanced React Mastery", slug: "react-mastery",
          courseData: {
            modules: [
              { moduleId: "MOD_1", name: "Introduction", submodules: [{ submoduleId: "MOD_1_SUB_1", title: "Setup Environment", items: [] }, { submoduleId: "MOD_1_SUB_2", title: "Architecture Overview", items: [] }] },
              { moduleId: "MOD_2", name: "Hooks Deep Dive", submodules: [{ submoduleId: "MOD_2_SUB_1", title: "Custom Hooks", items: [] }] }
            ]
          }
        }
      ];
      setCourses(mockData);
      const initialMap: Record<number, string> = {};
      mockData.forEach(c => initialMap[c.id] = c.courseData?.modules?.[0]?.moduleId || "");
      setSelectedModuleMap(initialMap);

      // fallback students count
      setStudentsCount(0);
    } finally {
      setLoading(false);
    }
  };

  // load videos + quizzes when drawer opens / editingCourse changes
  useEffect(() => {
    if (!isDrawerOpen) return;
    if (videos.length === 0 || quizzes.length === 0) {
      fetchVideosAndQuizzes();
    }
  }, [isDrawerOpen, editingCourse?.id]);

  const fetchVideosAndQuizzes = async () => {
    setListsLoading(true);
    setListsError(null);
    try {
      const [vRes, qRes] = await Promise.all([
        fetch("/api/admin/videos"),
        fetch("/api/admin/quizzes")
      ]);
      const vData = vRes.ok ? await vRes.json() : [];
      const qData = qRes.ok ? await qRes.json() : [];

      setVideos(Array.isArray(vData) ? vData : []);
      setQuizzes(Array.isArray(qData) ? qData : []);
    } catch (e) {
      console.error("fetchVideosAndQuizzes error:", e);
      setVideos([]);
      setQuizzes([]);
      setListsError("Failed to load videos or quizzes. Try again.");
      showMsg("Failed to load videos/quizzes from server", "error");
    } finally {
      setListsLoading(false);
    }
  };

  const ensureListsLoaded = async () => {
    if (listsLoading) return;
    if (videos.length > 0 && quizzes.length > 0) return;
    await fetchVideosAndQuizzes();
  };

  const showMsg = (text: string, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 4000);
  };

  /* ======================================================
     COURSE CREATION
  ====================================================== */

  const handleCreateCourse = async () => {
    if (!newCourse.name || !newCourse.slug) {
      showMsg("Please provide name and slug", "error");
      return;
    }

    setLoading(true);
    try {
      const nextId = courses.length > 0 ? Math.max(...courses.map(c => c.id)) + 1 : 1;

      const createdCourse: CourseType = {
        id: nextId,
        name: newCourse.name,
        slug: newCourse.slug,
        courseData: { modules: [] }
      };

      setCourses([...courses, createdCourse]);

      showMsg("Course created!");
      setIsCreateModalOpen(false);
      setNewCourse({ name: "", slug: "" });

      openEditDrawer(createdCourse);
    } catch {
      showMsg("Failed to create course", "error");
    } finally {
      setLoading(false);
    }
  };

  const updateSlugFromName = (name: string) => {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    setNewCourse({ name, slug });
  };

  /* ======================================================
     DRAWER ACTIONS (normalize to items[])
  ====================================================== */

  const openEditDrawer = (course: CourseType) => {
    const prepared: CourseType = {
      ...course,
      courseData: course.courseData || { modules: course.modules || [] },
    };
    // make sure nested arrays exist to avoid runtime errors
    prepared.courseData = {
      ...prepared.courseData,
      modules: (prepared.courseData?.modules || []).map((m: ModuleType) => ({
        ...m,
        submodules: (m.submodules || []).map((s: SubmoduleType) => ({
          ...s,
          items: s.items || [], // normalize items (previously sessions/quizzes)
        })),
      })),
    };

    setEditingCourse(structuredClone(prepared));
    setActiveEditModuleId(null);
    // reset per-submodule UI state
    setAddSessionOpen({});
    setAddQuizOpen({});
    setTempAddName("");
    setTempAddSelect("");
    setTempAddFile(null);
    setAddModalKey(null);
    setIsDrawerOpen(true);
  };

  const addModule = () => {
    if (!editingCourse) return;
    const modules = editingCourse.courseData?.modules || [];
    const newModuleId = generateModuleId(modules);
    const newModule: ModuleType = { moduleId: newModuleId, name: "New Module", submodules: [] };
    setEditingCourse({
      ...editingCourse,
      courseData: { ...editingCourse.courseData, modules: [...modules, newModule] },
    });
    setActiveEditModuleId(newModuleId);
  };

  const updateModule = (index: number, field: keyof ModuleType, value: string) => {
    if (!editingCourse) return;
    const updated = [...(editingCourse.courseData?.modules || [])];
    updated[index] = { ...updated[index], [field]: value };
    setEditingCourse({ ...editingCourse, courseData: { ...editingCourse.courseData, modules: updated } });
  };

  const addSubmodule = (mIndex: number) => {
    if (!editingCourse) return;
    const modules = [...(editingCourse.courseData?.modules || [])];
    const module = modules[mIndex];
    module.submodules = module.submodules || [];
    const newSubId = generateSubmoduleId(module.moduleId, module.submodules);
    // create with items array
    module.submodules = [...module.submodules, { submoduleId: newSubId, title: "New Submodule", items: [] }];
    setEditingCourse({ ...editingCourse, courseData: { ...editingCourse.courseData, modules } });
  };

  const updateSubmodule = (mIndex: number, sIndex: number, field: keyof SubmoduleType, value: string) => {
    if (!editingCourse) return;
    const updated = [...(editingCourse.courseData?.modules || [])];
    const target = updated[mIndex].submodules![sIndex];
    updated[mIndex].submodules![sIndex] = { ...target, [field]: value };
    setEditingCourse({ ...editingCourse, courseData: { ...editingCourse.courseData, modules: updated } });
  };

  const deleteModule = (index: number) => {
    if (!editingCourse) return;
    const updated = [...(editingCourse.courseData?.modules || [])];
    updated.splice(index, 1);
    setEditingCourse({ ...editingCourse, courseData: { ...editingCourse.courseData, modules: updated } });
  };

  const deleteSubmodule = (mIndex: number, sIndex: number) => {
    if (!editingCourse) return;
    const updated = [...(editingCourse.courseData?.modules || [])];
    updated[mIndex].submodules?.splice(sIndex, 1);
    setEditingCourse({ ...editingCourse, courseData: { ...editingCourse.courseData, modules: updated } });
  };

  /* ======================================================
     deleteItem (single unified deletion for items[])
  ====================================================== */

  const deleteItem = (mIndex: number, sIndex: number, id: string, type: "video" | "quiz") => {
    if (!editingCourse) return;
    const updated = [...(editingCourse.courseData?.modules || [])];
    const items = updated[mIndex].submodules![sIndex].items || [];
    if (type === "video") {
      updated[mIndex].submodules![sIndex].items = items.filter(i => !(i.type === "video" && (i as VideoItem).sessionId === id));
    } else {
      updated[mIndex].submodules![sIndex].items = items.filter(i => !(i.type === "quiz" && (i as QuizItem).quizRefId === id));
    }
    setEditingCourse({ ...editingCourse, courseData: { ...editingCourse.courseData, modules: updated } });
    showMsg(type === "video" ? "Session removed" : "Quiz removed");
  };

  /* backward-compatible small wrappers (if used elsewhere) */
  const deleteSession = (mIndex: number, sIndex: number, sessionId: string) => {
    deleteItem(mIndex, sIndex, sessionId, "video");
  };

  const deleteQuizRef = (mIndex: number, sIndex: number, quizRefId: string) => {
    deleteItem(mIndex, sIndex, quizRefId, "quiz");
  };

  /* ======================================================
     Add via modal (single flow) - now pushes into items[]
  ====================================================== */

  const openAddModal = async (moduleId: string, submoduleId: string) => {
    try {
      await ensureListsLoaded();
    } catch {
      // error handled in ensureListsLoaded
    }
    setTempAddType("Session Recording");
    setTempAddName("");
    setTempAddSelect("");
    setTempAddFile(null);
    setAddModalKey(keyFor(moduleId, submoduleId));
  };

  const closeAddModal = () => {
    setAddModalKey(null);
    setTempAddName("");
    setTempAddSelect("");
    setTempAddFile(null);
  };

  // Save an item from modal: if Quiz -> create QuizItem, else create VideoItem
  const saveAddItem = (mIndex: number, sIndex: number) => {
    if (!editingCourse) return;
    const modules = editingCourse.courseData!.modules || [];
    if (mIndex < 0 || mIndex >= modules.length) {
      showMsg("Invalid module", "error");
      return;
    }
    const module = modules[mIndex];
    const sub = module.submodules![sIndex];
    if (!sub) {
      showMsg("Invalid submodule", "error");
      return;
    }

    const name = tempAddName?.trim();
    if (!name) {
      showMsg("Name is required", "error");
      return;
    }

    // ensure items array exists
    if (!sub.items) sub.items = [];

    if (tempAddType === "Quiz") {
      const quizId = tempAddSelect || undefined;
      const newQuizItem: QuizItem = {
        type: "quiz",
        quizRefId: generateQuizRefId(sub.submoduleId, sub.items || []),
        name,
        quizId: quizId || undefined,
        quizTitle: quizzes.find(q => String(q.id) === String(quizId))?.title,
      };

      const updated = [...(editingCourse.courseData?.modules || [])];
      updated[mIndex].submodules![sIndex].items = [...(updated[mIndex].submodules![sIndex].items || []), newQuizItem];
      setEditingCourse({ ...editingCourse, courseData: { ...editingCourse.courseData, modules: updated } });
      showMsg("Quiz added");
      closeAddModal();
      return;
    }

    // Session / Doubt Solving session (video)
    const videoId = tempAddSelect || undefined;
    const newVideoItem: VideoItem = {
      type: "video",
      sessionId: generateSessionId(sub.submoduleId, sub.items || []),
      name,
      videoId: videoId || undefined,
      videoTitle: videoId ? videos.find(v => String(v.id) === String(videoId))?.title : (tempAddFile ? tempAddFile.name : undefined),
    };

    const updated = [...(editingCourse.courseData?.modules || [])];
    updated[mIndex].submodules![sIndex].items = [...(updated[mIndex].submodules![sIndex].items || []), newVideoItem];
    setEditingCourse({ ...editingCourse, courseData: { ...editingCourse.courseData, modules: updated } });
    showMsg("Session added");
    closeAddModal();
  };

  /* ======================================================
     SAVE
  ====================================================== */

  const saveCourse = async () => {
    if (!editingCourse) return;
    setLoading(true);
    try {
      await fetch("/api/admin/update-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCourse),
      });
      showMsg("Curriculum updated successfully");
      setIsDrawerOpen(false);
      loadData();
    } catch {
      showMsg("Save failed", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ======================================================
     SEARCH (NEW)
  ====================================================== */

  const [searchQuery, setSearchQuery] = useState("");
  const q = searchQuery.trim().toLowerCase();
  const filteredCourses = q
    ? courses.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q)
      )
    : courses;

  /* ======================================================
     STATS (NEW)
  ====================================================== */

  const totalCourses = courses.length;
  const activeCourses = courses.filter((c) => (c.courseData?.modules || c.modules || []).length > 0).length;

  /* ======================================================
     RENDER
  ====================================================== */

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-20 selection:bg-indigo-100 selection:text-indigo-700">
      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-md border-b z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2 rounded-xl text-white">
              <BookOpen size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-800">Curriculum Manager</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {message.text && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={`px-4 py-1.5 rounded-full text-xs font-semibold ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {message.text}
              </motion.div>
            )}

            {/* SEARCH + CREATE GROUP */}
            <div className="flex items-center gap-3">
              <label className="relative hidden sm:block">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search courses..."
                  className="pl-9 pr-3 py-2 border rounded-lg w-64 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
              </label>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 flex items-center gap-2 hover:bg-indigo-700 transition-all"
              >
                <Plus size={18} />
                Create New Course
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* NEW: STATUS CARDS (no other changes) */}
      <div className="max-w-7xl mx-auto px-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Total Courses" value={totalCourses} icon={<BookOpen />} />
          <StatCard title="Active Courses" value={activeCourses} icon={<LayoutGrid />} />
          <StatCard title="Total Students" value={studentsCount} icon={<Users />} />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Course Name</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Module</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Submodule List</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No courses available.</td>
                  </tr>
                ) : filteredCourses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No courses match your search.</td>
                  </tr>
                ) : (
                  filteredCourses.map((course) => {
                    const modules = course.courseData?.modules || course.modules || [];
                    const selectedModuleId = selectedModuleMap[course.id];
                    const activeModule = modules.find(m => m.moduleId === selectedModuleId);

                    return (
                      <tr key={course.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-sm">{course.name}</span>
                            <span className="text-[11px] text-slate-400">/{course.slug}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {modules.length > 0 ? (
                            <div className="relative inline-block w-48">
                              <select
                                value={selectedModuleId}
                                onChange={(e) => setSelectedModuleMap({ ...selectedModuleMap, [course.id]: e.target.value })}
                                className="w-full appearance-none bg-slate-100 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer pr-8 focus:ring-2 focus:ring-indigo-500 outline-none"
                              >
                                {modules.map(m => (
                                  <option key={m.moduleId} value={m.moduleId}>{m.name}</option>
                                ))}
                              </select>
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <ChevronDown size={14} />
                              </div>
                            </div>
                          ) : <span className="text-xs text-slate-300 italic">No modules</span>}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-wrap gap-1.5 max-w-sm">
                            {activeModule?.submodules?.map(sub => (
                              <div key={sub.submoduleId} className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] font-medium text-slate-600 shadow-sm">
                                {sub.title}
                              </div>
                            )) || <span className="text-[11px] text-slate-300">Empty module</span>}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button onClick={() => openEditDrawer(course)} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all">
                            <Edit3 size={14} />
                            Edit Curriculum
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* CREATE COURSE MODAL */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Create New Course</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-1.5 block">Course Name</label>
                  <input
                    type="text"
                    value={newCourse.name}
                    onChange={(e) => updateSlugFromName(e.target.value)}
                    placeholder="e.g. Master Class in Design"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-1.5 block">URL Slug</label>
                  <input
                    type="text"
                    value={newCourse.slug}
                    onChange={(e) => setNewCourse({ ...newCourse, slug: e.target.value })}
                    placeholder="e.g. master-design"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <button onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-3 bg-slate-100 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-all">
                  Cancel
                </button>
                <button onClick={handleCreateCourse} className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
                  Next: Edit Curriculum
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT DRAWER */}
      <AnimatePresence>
        {isDrawerOpen && editingCourse && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-40" onClick={() => setIsDrawerOpen(false)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-white shadow-2xl z-50 flex flex-col">
              <div className="p-6 border-b flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Edit Curriculum</h3>
                  <p className="text-xs text-slate-400 font-medium">{editingCourse.name}</p>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {(editingCourse.courseData?.modules || []).map((module, mIndex) => {
                  const isExpanded = activeEditModuleId === module.moduleId;

                  return (
                    <div
                      key={module.moduleId}
                      className={`border rounded-2xl overflow-hidden ${isExpanded ? "border-indigo-200 bg-indigo-50/10" : "border-slate-200"}`}
                    >
                      {/* MODULE HEADER */}
                      <div className="p-4 flex items-center justify-between gap-4">
                        <div className="flex-1 flex items-center gap-3">
                          <LayoutGrid size={16} className={isExpanded ? "text-indigo-500" : "text-slate-400"} />

                          {isExpanded ? (
                            <input
                              value={module.name}
                              onChange={(e) => updateModule(mIndex, "name", e.target.value)}
                              className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 w-full p-0"
                              autoFocus
                            />
                          ) : (
                            <span className="text-sm font-bold text-slate-700">
                              {module.name}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setActiveEditModuleId(isExpanded ? null : module.moduleId)}
                            className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg"
                          >
                            {isExpanded ? (
                              <ChevronDown className="rotate-180" size={16} />
                            ) : (
                              <Pencil size={16} />
                            )}
                          </button>

                          <button onClick={() => deleteModule(mIndex)} className="p-2 text-slate-300 hover:text-red-500 rounded-lg">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* MODULE BODY */}
                      {isExpanded && (
                        <div className="p-4 pt-0 space-y-3">
                          <div className="space-y-2">
                            {module.submodules?.map((sub, sIndex) => {
                              const k = keyFor(module.moduleId, sub.submoduleId);

                              return (
                                <div key={sub.submoduleId} className="border rounded-lg p-3 bg-white">
                                  {/* SUBMODULE HEADER */}
                                  <div className="flex items-center justify-between gap-3 mb-2">
                                    <input
                                      value={sub.title}
                                      onChange={(e) => updateSubmodule(mIndex, sIndex, "title", e.target.value)}
                                      className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-semibold text-slate-700"
                                    />

                                    <div className="flex gap-2">
                                      {/* single + button to open modal */}
                                      <button
                                        onClick={() => openAddModal(module.moduleId, sub.submoduleId)}
                                        className="px-2 py-1 text-[11px] bg-indigo-600 text-white rounded inline-flex items-center gap-2"
                                        title="Add session / quiz / doubt session"
                                      >
                                        <Plus size={12} />
                                        Add
                                      </button>

                                      <button onClick={() => deleteSubmodule(mIndex, sIndex)} className="text-red-400">
                                        <X size={16} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* ITEMS (videos + quizzes) */}
                                  <div className="flex flex-wrap gap-2">
                                    {(sub.items || []).map((it) => (
                                      <div key={it.type === "video" ? (it as VideoItem).sessionId : (it as QuizItem).quizRefId} className="px-2 py-1 bg-slate-50 border rounded text-xs flex items-center gap-2">
                                        <span>
                                          {it.type === "video" ? "🎬 " : "📝 "}
                                          {it.name}
                                        </span>
                                        <button
                                          onClick={() => {
                                            if (it.type === "video") deleteItem(mIndex, sIndex, (it as VideoItem).sessionId, "video");
                                            else deleteItem(mIndex, sIndex, (it as QuizItem).quizRefId, "quiz");
                                          }}
                                          className="p-1 text-red-400"
                                          title="Delete item"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>

                                  {/* NOTE: Inline add forms removed — replaced by modal */} 
                                </div>
                              );
                            })}
                          </div>

                          {/* ADD SUBMODULE */}
                          <button
                            onClick={() => addSubmodule(mIndex)}
                            className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-bold text-slate-400 hover:border-indigo-300 hover:text-indigo-500"
                          >
                            + Add New Submodule
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                <button onClick={addModule} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:text-indigo-500 hover:border-indigo-200 font-bold text-sm">
                  <Plus size={18} /> Add New Module
                </button>
              </div>

              <div className="p-6 border-t bg-slate-50 flex gap-3">
                <button onClick={() => setIsDrawerOpen(false)} className="flex-1 px-4 py-3 bg-white border rounded-xl text-sm font-bold text-slate-600">Cancel</button>
                <button onClick={saveCourse} className="flex-[2] px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 flex items-center justify-center gap-2">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Save All Changes
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ADD ITEM MODAL (single shared modal) */}
      <AnimatePresence>
        {addModalKey && editingCourse && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeAddModal} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden p-6 z-70">
              <h4 className="text-lg font-bold mb-3">Add to submodule</h4>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
                  <select value={tempAddType} onChange={(e) => setTempAddType(e.target.value as any)} className="w-full p-2 border rounded">
                    <option>Session Recording</option>
                    <option>Quiz</option>
                    <option>Doubt Solving session</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
                  <input value={tempAddName} onChange={(e) => setTempAddName(e.target.value)} className="w-full p-2 border rounded" placeholder="e.g. Session 1: Intro" />
                </div>

                {/* conditional select depending on type */}
                {listsLoading ? (
                  <div className="text-xs text-slate-500 mt-2 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Loading lists...</div>
                ) : listsError ? (
                  <div className="text-xs text-red-500 mt-2">{listsError}</div>
                ) : tempAddType === "Quiz" ? (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Choose existing quiz (optional)</label>
                    <select value={String(tempAddSelect)} onChange={(e) => setTempAddSelect(e.target.value)} className="w-full p-2 border rounded">
                      <option value="">-- pick a quiz --</option>
                      {quizzes.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Choose existing video (optional)</label>
                    <select value={String(tempAddSelect)} onChange={(e) => setTempAddSelect(e.target.value)} className="w-full p-2 border rounded mb-2">
                      <option value="">-- pick a video --</option>
                      {videos.map(v => <option key={v.id} value={v.id}>{v.title}</option>)}
                    </select>

                    <label className="block text-xs font-medium text-slate-500 mb-1">Or upload file (optional)</label>
                    <input type="file" onChange={(e) => setTempAddFile(e.target.files?.[0] ?? null)} className="w-full" />
                    {tempAddFile && <div className="text-xs mt-1 text-slate-500">Selected: {tempAddFile.name}</div>}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button onClick={closeAddModal} className="px-4 py-2 bg-white border rounded">Cancel</button>
                {/* resolve module/submodule indices from addModalKey */}
                <button
                  onClick={() => {
                    if (!addModalKey || !editingCourse) {
                      showMsg("Invalid target", "error");
                      return;
                    }

                    const modules = editingCourse.courseData?.modules || [];
                    // fast path: split by our safe separator
                    const parts = addModalKey.split("__");
                    let modId = parts[0] ?? "";
                    let subId = parts[1] ?? "";

                    let mIndex = modules.findIndex(m => m.moduleId === modId);
                    let sIndex = mIndex !== -1 ? (modules[mIndex].submodules || []).findIndex(s => s.submoduleId === subId) : -1;

                    // fallback: linear search
                    if (mIndex === -1 || sIndex === -1) {
                      let mm = -1, ss = -1;
                      modules.forEach((mod, mi) => {
                        (mod.submodules || []).forEach((sub, si) => {
                          if (keyFor(mod.moduleId, sub.submoduleId) === addModalKey) {
                            mm = mi; ss = si;
                          }
                        });
                      });
                      if (mm === -1 || ss === -1) {
                        showMsg("Unable to find target submodule", "error");
                        return;
                      }
                      mIndex = mm; sIndex = ss;
                    }

                    saveAddItem(mIndex, sIndex);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================= STAT CARD (ADDED) ================= */

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