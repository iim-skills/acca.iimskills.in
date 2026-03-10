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
  Pencil
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ======================================================
   TYPES
====================================================== */

type SessionType = {
  sessionId: string;
  name: string;
  videoId?: number | string;
  videoTitle?: string;
};

type QuizRefType = {
  quizRefId: string;
  name: string;
  quizId?: number | string;
  quizTitle?: string;
};

type SubmoduleType = {
  submoduleId: string;
  title: string;
  description?: string;
  sessions?: SessionType[];
  quizzes?: QuizRefType[];
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
   HELPERS
====================================================== */

const generateModuleId = (modules: ModuleType[] = []) => {
  const numbers = modules
    .map((m) => Number(m.moduleId?.replace("MOD_", "")))
    .filter((n) => !isNaN(n));
  const next = numbers.length ? Math.max(...numbers) + 1 : 1;
  return `MOD_${next}`;
};

const generateSubmoduleId = (moduleId: string, subs: SubmoduleType[] = []) => {
  const numbers = subs
    .map((s) => Number(s.submoduleId?.replace(`${moduleId}_SUB_`, "")))
    .filter((n) => !isNaN(n));
  const next = numbers.length ? Math.max(...numbers) + 1 : 1;
  return `${moduleId}_SUB_${next}`;
};

const generateSessionId = (submoduleId: string, sessions: SessionType[] = []) => {
  const numbers = sessions
    .map((s) => Number(s.sessionId?.replace(`${submoduleId}_SES_`, "")))
    .filter((n) => !isNaN(n));
  const next = numbers.length ? Math.max(...numbers) + 1 : 1;
  return `${submoduleId}_SES_${next}`;
};

const generateQuizRefId = (submoduleId: string, quizzes: QuizRefType[] = []) => {
  const numbers = quizzes
    .map((q) => Number(q.quizRefId?.replace(`${submoduleId}_QZ_`, "")))
    .filter((n) => !isNaN(n));
  const next = numbers.length ? Math.max(...numbers) + 1 : 1;
  return `${submoduleId}_QZ_${next}`;
};

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

  // UI state for per-submodule add forms
  // keyed by `${moduleId}_${submoduleId}`
  // NOTE: now we open only the clicked form (we replace state instead of merging)
  const [addSessionOpen, setAddSessionOpen] = useState<Record<string, boolean>>({});
  const [addQuizOpen, setAddQuizOpen] = useState<Record<string, boolean>>({});

  // Temporary values for the add forms
  const [tempSessionName, setTempSessionName] = useState<Record<string, string>>({});
  const [tempSessionVideo, setTempSessionVideo] = useState<Record<string, string>>({});
  const [tempQuizName, setTempQuizName] = useState<Record<string, string>>({});
  const [tempQuizSelect, setTempQuizSelect] = useState<Record<string, string>>({});

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

    } catch (err) {
      // Mock data for preview
      const mockData: CourseType[] = [
        {
          id: 1, name: "Advanced React Mastery", slug: "react-mastery",
          courseData: {
            modules: [
              { moduleId: "MOD_1", name: "Introduction", submodules: [{ submoduleId: "MOD_1_SUB_1", title: "Setup Environment" }, { submoduleId: "MOD_1_SUB_2", title: "Architecture Overview" }] },
              { moduleId: "MOD_2", name: "Hooks Deep Dive", submodules: [{ submoduleId: "MOD_2_SUB_1", title: "Custom Hooks" }] }
            ]
          }
        }
      ];
      setCourses(mockData);
      const initialMap: Record<number, string> = {};
      mockData.forEach(c => initialMap[c.id] = c.courseData?.modules?.[0]?.moduleId || "");
      setSelectedModuleMap(initialMap);
    } finally {
      setLoading(false);
    }
  };

  // load videos + quizzes when drawer opens / editingCourse changes
  useEffect(() => {
    if (!isDrawerOpen) return;
    // fetch if we don't already have lists
    if (videos.length === 0 || quizzes.length === 0) {
      fetchVideosAndQuizzes();
    }
  }, [isDrawerOpen, editingCourse?.id]);

  const fetchVideosAndQuizzes = async () => {
    setListsLoading(true);
    setListsError(null);
    try {
      // Adjust endpoints if your API paths differ
      const [vRes, qRes] = await Promise.all([
        fetch("/api/admin/videos"),
        fetch("/api/admin/quizzes")
      ]);
      if (!vRes.ok && !qRes.ok) {
        throw new Error("failed to fetch lists");
      }
      const vData = vRes.ok ? await vRes.json() : [];
      const qData = qRes.ok ? await qRes.json() : [];

      // Expecting arrays like [{id, title}, ...]
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
    // if lists already loaded and not empty, do nothing
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
     DRAWER ACTIONS
  ====================================================== */

  const openEditDrawer = (course: CourseType) => {
    const prepared: CourseType = {
      ...course,
      courseData: course.courseData || { modules: course.modules || [] },
    };
    setEditingCourse(structuredClone(prepared));
    setActiveEditModuleId(null);
    // reset per-submodule UI state
    setAddSessionOpen({});
    setAddQuizOpen({});
    setTempSessionName({});
    setTempSessionVideo({});
    setTempQuizName({});
    setTempQuizSelect({});
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
    const newSubId = generateSubmoduleId(module.moduleId, module.submodules || []);
    module.submodules = [...(module.submodules || []), { submoduleId: newSubId, title: "New Submodule", sessions: [], quizzes: [] }];
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
     Add Session / Quiz functionality (fixed)
  ====================================================== */

  const keyFor = (moduleId: string, submoduleId: string) => `${moduleId}_${submoduleId}`;

  // open Add Session: ensure lists loaded, open only this submodule's form, init temp fields
  const openAddSession = async (moduleId: string, submoduleId: string) => {
    const k = keyFor(moduleId, submoduleId);
    try {
      await ensureListsLoaded();
    } catch {
      // ensureListsLoaded already shows message on failure
    }
    // open only this key (close others)
    setAddSessionOpen({ [k]: true });
    // init temp values for this key
    setTempSessionName(prev => ({ ...prev, [k]: prev[k] ?? "" }));
    setTempSessionVideo(prev => ({ ...prev, [k]: prev[k] ?? "" }));
    // close quiz form if open for same submodule
    setAddQuizOpen(prev => {
      const copy = { ...prev };
      delete copy[k];
      return copy;
    });
  };

  const closeAddSession = (moduleId: string, submoduleId: string) => {
    const k = keyFor(moduleId, submoduleId);
    setAddSessionOpen({}); // close all to make default closed
    setTempSessionName(prev => ({ ...prev, [k]: "" }));
    setTempSessionVideo(prev => ({ ...prev, [k]: "" }));
  };

  // open Add Quiz: ensure lists loaded, open only this submodule's form, init temp fields
  const openAddQuiz = async (moduleId: string, submoduleId: string) => {
    const k = keyFor(moduleId, submoduleId);
    try {
      await ensureListsLoaded();
    } catch {
      // handled already
    }
    setAddQuizOpen({ [k]: true });
    setTempQuizName(prev => ({ ...prev, [k]: prev[k] ?? "" }));
    setTempQuizSelect(prev => ({ ...prev, [k]: prev[k] ?? "" }));
    // close session form for same submodule
    setAddSessionOpen(prev => {
      const copy = { ...prev };
      delete copy[k];
      return copy;
    });
  };

  const closeAddQuiz = (moduleId: string, submoduleId: string) => {
    const k = keyFor(moduleId, submoduleId);
    setAddQuizOpen({});
    setTempQuizName(prev => ({ ...prev, [k]: "" }));
    setTempQuizSelect(prev => ({ ...prev, [k]: "" }));
  };

  const saveNewSession = (mIndex: number, sIndex: number) => {
    if (!editingCourse) return;
    const module = editingCourse.courseData!.modules![mIndex];
    const sub = module.submodules![sIndex];
    const k = keyFor(module.moduleId, sub.submoduleId);
    const name = (tempSessionName[k] || "").trim();
    const videoId = tempSessionVideo[k];
    if (!name) {
      showMsg("Session name required", "error");
      return;
    }
    const newSession: SessionType = {
      sessionId: generateSessionId(sub.submoduleId, sub.sessions || []),
      name,
      videoId: videoId || undefined,
      videoTitle: videos.find(v => String(v.id) === String(videoId))?.title,
    };
    const updated = [...(editingCourse.courseData?.modules || [])];
    updated[mIndex].submodules![sIndex].sessions = [...(updated[mIndex].submodules![sIndex].sessions || []), newSession];
    setEditingCourse({ ...editingCourse, courseData: { ...editingCourse.courseData, modules: updated } });
    showMsg("Session added");
    closeAddSession(module.moduleId, sub.submoduleId);
  };

  const saveNewQuiz = (mIndex: number, sIndex: number) => {
    if (!editingCourse) return;
    const module = editingCourse.courseData!.modules![mIndex];
    const sub = module.submodules![sIndex];
    const k = keyFor(module.moduleId, sub.submoduleId);
    const name = (tempQuizName[k] || "").trim();
    const quizId = tempQuizSelect[k];
    if (!name) {
      showMsg("Quiz name required", "error");
      return;
    }
    const newQuizRef: QuizRefType = {
      quizRefId: generateQuizRefId(sub.submoduleId, sub.quizzes || []),
      name,
      quizId: quizId || undefined,
      quizTitle: quizzes.find(q => String(q.id) === String(quizId))?.title,
    };
    const updated = [...(editingCourse.courseData?.modules || [])];
    updated[mIndex].submodules![sIndex].quizzes = [...(updated[mIndex].submodules![sIndex].quizzes || []), newQuizRef];
    setEditingCourse({ ...editingCourse, courseData: { ...editingCourse.courseData, modules: updated } });
    showMsg("Quiz added");
    closeAddQuiz(module.moduleId, sub.submoduleId);
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
     RENDER
  ====================================================== */

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-20 selection:bg-indigo-100 selection:text-indigo-700">
      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-30 shadow-sm">
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
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 flex items-center gap-2 hover:bg-indigo-700 transition-all"
            >
              <Plus size={18} />
              Create New Course
            </button>
          </div>
        </div>
      </header>

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
                ) : (
                  courses.map((course) => {
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
                      <button
                        onClick={() => openAddSession(module.moduleId, sub.submoduleId)}
                        className="px-2 py-1 text-[11px] bg-indigo-600 text-white rounded"
                      >
                        Add Session
                      </button>

                      <button
                        onClick={() => openAddQuiz(module.moduleId, sub.submoduleId)}
                        className="px-2 py-1 text-[11px] bg-emerald-600 text-white rounded"
                      >
                        Add Quiz
                      </button>

                      <button onClick={() => deleteSubmodule(mIndex, sIndex)} className="text-red-400">
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Sessions */}
                  <div className="flex flex-wrap gap-2">
                    {(sub.sessions || []).map((sess) => (
                      <div key={sess.sessionId} className="px-2 py-1 bg-slate-50 border rounded text-xs">
                        {sess.name}
                      </div>
                    ))}
                  </div>

                  {/* Quizzes */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(sub.quizzes || []).map((q) => (
                      <div key={q.quizRefId} className="px-2 py-1 bg-slate-50 border rounded text-xs">
                        {q.name}
                      </div>
                    ))}
                  </div>

                  {/* ---- ADD SESSION FORM (rendered only when explicitly opened) ---- */}
                  {addSessionOpen[k] && (
                    <div className="mt-3 p-3 border rounded bg-slate-50">
                      <label className="text-[12px] font-medium text-slate-700">Session name</label>
                      <input
                        value={tempSessionName[k] || ""}
                        onChange={(e) => setTempSessionName({ ...tempSessionName, [k]: e.target.value })}
                        className="w-full mt-1 mb-2 p-2 rounded border bg-white text-sm"
                        placeholder="e.g. Session 1: Intro"
                      />

                      <label className="text-[12px] font-medium text-slate-700">Recording (select from videos)</label>
                      {listsLoading ? (
                        <div className="text-xs text-slate-500 mt-2 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Loading videos...</div>
                      ) : listsError ? (
                        <div className="text-xs text-red-500 mt-2">{listsError}</div>
                      ) : (
                        <select
                          value={tempSessionVideo[k] || ""}
                          onChange={(e) => setTempSessionVideo({ ...tempSessionVideo, [k]: e.target.value })}
                          className="w-full mt-1 mb-3 p-2 rounded border bg-white text-sm"
                        >
                          <option value="">-- choose a recording (optional) --</option>
                          {videos.map(v => (
                            <option key={v.id} value={v.id}>{v.title}</option>
                          ))}
                        </select>
                      )}

                      <div className="flex gap-2 justify-end">
                        <button onClick={() => closeAddSession(module.moduleId, sub.submoduleId)} className="px-3 py-1 rounded text-sm bg-white border">Cancel</button>
                        <button onClick={() => saveNewSession(mIndex, sIndex)} className="px-3 py-1 rounded text-sm bg-indigo-600 text-white">Save Session</button>
                      </div>
                    </div>
                  )}

                  {/* ---- ADD QUIZ FORM (rendered only when explicitly opened) ---- */}
                  {addQuizOpen[k] && (
                    <div className="mt-3 p-3 border rounded bg-slate-50">
                      <label className="text-[12px] font-medium text-slate-700">Quiz name</label>
                      <input
                        value={tempQuizName[k] || ""}
                        onChange={(e) => setTempQuizName({ ...tempQuizName, [k]: e.target.value })}
                        className="w-full mt-1 mb-2 p-2 rounded border bg-white text-sm"
                        placeholder="e.g. Quiz 1: Basics"
                      />

                      <label className="text-[12px] font-medium text-slate-700">Select existing quiz</label>
                      {listsLoading ? (
                        <div className="text-xs text-slate-500 mt-2 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Loading quizzes...</div>
                      ) : listsError ? (
                        <div className="text-xs text-red-500 mt-2">{listsError}</div>
                      ) : (
                        <select
                          value={tempQuizSelect[k] || ""}
                          onChange={(e) => setTempQuizSelect({ ...tempQuizSelect, [k]: e.target.value })}
                          className="w-full mt-1 mb-3 p-2 rounded border bg-white text-sm"
                        >
                          <option value="">-- choose a quiz (optional) --</option>
                          {quizzes.map(q => (
                            <option key={q.id} value={q.id}>{q.title}</option>
                          ))}
                        </select>
                      )}

                      <div className="flex gap-2 justify-end">
                        <button onClick={() => closeAddQuiz(module.moduleId, sub.submoduleId)} className="px-3 py-1 rounded text-sm bg-white border">Cancel</button>
                        <button onClick={() => saveNewQuiz(mIndex, sIndex)} className="px-3 py-1 rounded text-sm bg-emerald-600 text-white">Save Quiz</button>
                      </div>
                    </div>
                  )}
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
    </div>
  );
}