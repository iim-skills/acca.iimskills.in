"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Loader2,
  BookOpen,
  Edit3,
  Save,
  Trash2,
  X,
  ChevronDown,
  LayoutGrid,
  Settings,
  Plus,
  ArrowRight,
  Info,
  Pencil
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ======================================================
   TYPES & MOCK DATA (For Preview Stability)
====================================================== */

// These match your existing architecture
type SubmoduleType = {
  submoduleId: string;
  title: string;
  description?: string;
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

export default function App() {
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseType | null>(null);
  const [message, setMessage] = useState({ text: "", type: "" });
  
  // Track selected module per course for the table view
  const [selectedModuleMap, setSelectedModuleMap] = useState<Record<number, string>>({});

  // Track which module is expanded in the edit drawer
  const [activeEditModuleId, setActiveEditModuleId] = useState<string | null>(null);

  /* ======================================================
     DATA FETCHING (Simulated for this demo)
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
      
      // Default first module for each course in the map
      const initialMap: Record<number, string> = {};
      courseList.forEach(course => {
        const mods = course.courseData?.modules || course.modules || [];
        if (mods.length > 0) initialMap[course.id] = mods[0].moduleId;
      });
      setSelectedModuleMap(initialMap);

    } catch (err) {
      // For preview purposes, setting mock data if API fails
      const mockData: CourseType[] = [
        {
          id: 1, name: "Advanced React Mastery", slug: "react-mastery", 
          courseData: { 
            modules: [
              { moduleId: "MOD_1", name: "Introduction", submodules: [{ submoduleId: "MOD_1_SUB_1", title: "Setup Environment" }, { submoduleId: "MOD_1_SUB_2", title: "Architecture Overview" }] },
              { moduleId: "MOD_2", name: "Hooks Deep Dive", submodules: [{ submoduleId: "MOD_2_SUB_1", title: "Custom Hooks" }] }
            ]
          }
        },
        {
          id: 2, name: "Python for Data Science", slug: "python-ds", 
          courseData: { 
            modules: [
              { moduleId: "MOD_1", name: "Pandas Basics", submodules: [{ submoduleId: "MOD_1_SUB_1", title: "DataFrames" }] }
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

  const showMsg = (text: string, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 4000);
  };

  /* ======================================================
     DRAWER & ACTIONS (Functional Logic Preserved)
  ====================================================== */

  const openEditDrawer = (course: CourseType) => {
    const prepared: CourseType = {
      ...course,
      courseData: course.courseData || { modules: course.modules || [] },
    };
    setEditingCourse(structuredClone(prepared));
    setActiveEditModuleId(null); // Keep all collapsed by default when opening
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
    // Automatically expand the newly added module for editing
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
    module.submodules = [...(module.submodules || []), { submoduleId: newSubId, title: "New Submodule" }];
    setEditingCourse({ ...editingCourse, courseData: { ...editingCourse.courseData, modules } });
  };

  const updateSubmodule = (mIndex: number, sIndex: number, field: keyof SubmoduleType, value: string) => {
    if (!editingCourse) return;
    const updated = [...(editingCourse.courseData?.modules || [])];
    updated[mIndex].submodules![sIndex] = { ...updated[mIndex].submodules![sIndex], [field]: value };
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
      showMsg("Save failed. Verify API connection.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-20 selection:bg-indigo-100 selection:text-indigo-700">
      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
              <BookOpen size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-800">Curriculum Manager</h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Admin Panel v2.0</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {message.text && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className={`px-4 py-1.5 rounded-full text-xs font-semibold ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}
              >
                {message.text}
              </motion.div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* TABLE SECTION */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Course Name</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Module</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Submodule List</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                      No courses found. Start by creating a course.
                    </td>
                  </tr>
                ) : (
                  courses.map((course) => {
                    const modules = course.courseData?.modules || course.modules || [];
                    const selectedModuleId = selectedModuleMap[course.id];
                    const activeModule = modules.find(m => m.moduleId === selectedModuleId);
                    
                    return (
                      <tr key={course.id} className="hover:bg-slate-50/30 transition-colors group">
                        {/* 1. COURSE NAME */}
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-sm">{course.name}</span>
                            <span className="text-[11px] text-slate-400 font-medium">/{course.slug}</span>
                          </div>
                        </td>

                        {/* 2. MODULE DROPDOWN */}
                        <td className="px-6 py-5">
                          {modules.length > 0 ? (
                            <div className="relative inline-block w-48">
                              <select 
                                value={selectedModuleId}
                                onChange={(e) => setSelectedModuleMap({ ...selectedModuleMap, [course.id]: e.target.value })}
                                className="w-full appearance-none bg-slate-100 border-none rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all pr-8"
                              >
                                {modules.map(m => (
                                  <option key={m.moduleId} value={m.moduleId}>{m.name}</option>
                                ))}
                              </select>
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <ChevronDown size={14} />
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-300 italic">No modules</span>
                          )}
                        </td>

                        {/* 3. SUBMODULE LIST */}
                        <td className="px-6 py-5">
                          <div className="flex flex-wrap gap-1.5 max-w-sm">
                            {activeModule?.submodules && activeModule.submodules.length > 0 ? (
                              activeModule.submodules.map(sub => (
                                <div 
                                  key={sub.submoduleId} 
                                  className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded text-[11px] font-medium text-slate-600 shadow-sm"
                                >
                                  <div className="w-1 h-1 rounded-full bg-indigo-400" />
                                  {sub.title}
                                </div>
                              ))
                            ) : (
                              <span className="text-[11px] text-slate-300">No submodules in this module</span>
                            )}
                          </div>
                        </td>

                        {/* 4. EDIT BUTTON */}
                        <td className="px-6 py-5 text-right">
                          <button
                            onClick={() => openEditDrawer(course)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all"
                          >
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

      {/* EDIT DRAWER */}
      <AnimatePresence>
        {isDrawerOpen && editingCourse && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-40"
              onClick={() => setIsDrawerOpen(false)}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* DRAWER HEADER */}
              <div className="p-6 border-b flex items-center justify-between bg-white sticky top-0 z-10">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Edit Curriculum</h3>
                  <p className="text-xs text-slate-400 font-medium truncate max-w-[300px]">{editingCourse.name}</p>
                </div>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              {/* DRAWER CONTENT */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                
                {/* MODULES LIST */}
                <div className="space-y-4">
                  {(editingCourse.courseData?.modules || []).map((module, mIndex) => {
                    const isExpanded = activeEditModuleId === module.moduleId;

                    return (
                      <div 
                        key={module.moduleId} 
                        className={`relative group/mod border rounded-2xl overflow-hidden transition-all ${
                          isExpanded 
                            ? 'border-indigo-200 bg-indigo-50/20 ring-1 ring-indigo-100' 
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        {/* Module Header - Condensed View */}
                        <div className={`p-4 flex items-center justify-between gap-4 ${isExpanded ? 'bg-white border-b border-indigo-100' : ''}`}>
                          <div className="flex-1 flex items-center gap-3">
                            <div className={`p-2 rounded-lg transition-colors ${isExpanded ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                              <LayoutGrid size={16} />
                            </div>
                            
                            {isExpanded ? (
                              <input
                                value={module.name}
                                onChange={(e) => updateModule(mIndex, "name", e.target.value)}
                                placeholder="Module Title..."
                                autoFocus
                                className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 w-full p-0"
                              />
                            ) : (
                              <span className="text-sm font-bold text-slate-700">{module.name}</span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {!isExpanded ? (
                              <button
                                onClick={() => setActiveEditModuleId(module.moduleId)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title="Edit Module"
                              >
                                <Pencil size={16} />
                              </button>
                            ) : (
                              <button
                                onClick={() => setActiveEditModuleId(null)}
                                className="p-2 text-indigo-400 hover:text-indigo-600 rounded-lg"
                                title="Close Editor"
                              >
                                <ChevronDown size={16} className="rotate-180" />
                              </button>
                            )}

                            <button 
                              onClick={() => deleteModule(mIndex)}
                              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete Module"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Expanded Submodules List */}
                        {isExpanded && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            className="p-4 space-y-4"
                          >
                            <div>
                              <div className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold mb-3 flex items-center gap-2">
                                <div className="h-[1px] flex-1 bg-indigo-100" />
                                Submodules
                                <div className="h-[1px] flex-1 bg-indigo-100" />
                              </div>
                              
                              <div className="space-y-2">
                                {module.submodules?.map((sub, sIndex) => (
                                  <div key={sub.submoduleId} className="flex items-center gap-2 group/sub">
                                    <div className="w-1 h-8 bg-indigo-200 rounded-full" />
                                    <input
                                      value={sub.title}
                                      onChange={(e) => updateSubmodule(mIndex, sIndex, "title", e.target.value)}
                                      placeholder="Submodule Name"
                                      className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 focus:border-indigo-500 outline-none transition-all shadow-sm"
                                    />
                                    <button
                                      onClick={() => deleteSubmodule(mIndex, sIndex)}
                                      className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                ))}
                              </div>

                              <button
                                onClick={() => addSubmodule(mIndex)}
                                className="flex items-center gap-1.5 px-3 py-1.5 mt-4 bg-indigo-600 text-white text-[11px] font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-sm"
                              >
                                <Plus size={12} strokeWidth={3} />
                                Add Submodule
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}

                  {/* Add Module Trigger */}
                  <button 
                    onClick={addModule}
                    className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:text-indigo-500 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all font-bold text-sm"
                  >
                    <Plus size={18} />
                    Add New Module
                  </button>
                </div>
              </div>

              {/* DRAWER FOOTER */}
              <div className="p-6 border-t bg-slate-50/80 backdrop-blur-sm sticky bottom-0 flex gap-3">
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCourse}
                  disabled={loading}
                  className="flex-[2] px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  Save All Changes
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MOBILE WARNING */}
      <div className="lg:hidden fixed bottom-6 left-6 right-6 bg-slate-800 text-white p-4 rounded-2xl shadow-xl flex items-center gap-3 z-50">
        <div className="bg-amber-400 p-2 rounded-lg text-slate-900">
          <Info size={18} />
        </div>
        <p className="text-xs font-medium">This admin tool is optimized for desktop screens.</p>
      </div>
    </div>
  );
}