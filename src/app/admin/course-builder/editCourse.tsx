"use client";

import { useState, useEffect } from "react";
import {
  Pencil,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Video,
  FileQuestion,
  FileText,
  X,
  Save,
} from "lucide-react";

import AddSessionQuiz from "./addSessionQuiz";
import { Course as BaseCourse, TargetType, ItemType } from "./types/course";

type Submodule = {
  submoduleId: string;
  title: string;
  items: ItemType[];
  [key: string]: any;
};

type Module = {
  moduleId: string;
  name: string;
  submodules: Submodule[];
  liveSessions?: any[];
  [key: string]: any;
};

type Course = Omit<BaseCourse, "courseData"> & {
  courseData: {
    modules: Module[];
    [key: string]: any;
  };
};

// Study material shape coming from the DB table
type StudyMaterial = {
  id: number;
  course_id: string;
  course_name: string;
  module_id: string;
  module_name: string;
  material_name: string;
  file_url: string;
};

// Keyed by moduleId for instant lookup
type StudyMaterialMap = Record<string, StudyMaterial>;

type Props = {
  isOpen: boolean;
  course: BaseCourse | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function EditCourse({ isOpen, course, onClose, onSaved }: Props) {
  const [editingCourse, setEditingCourse] = useState<Course | null>(course as Course | null);
  const [addTarget, setAddTarget] = useState<TargetType | null>(null);
  const [openModules, setOpenModules] = useState<string[]>([]);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"structure" | "live-recording">("structure");
  const [selectedLiveModuleId, setSelectedLiveModuleId] = useState<string | null>(null);
  const [liveSessionTitle, setLiveSessionTitle] = useState<string>("");
  const [liveSessionUrl, setLiveSessionUrl] = useState<string>("");
  const [editingLiveSessionId, setEditingLiveSessionId] = useState<string | null>(null);
  const [showLiveSessionForm, setShowLiveSessionForm] = useState<boolean>(false);

  // ── Study material state (DB-backed) ──────────────────────────────────────
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterialMap>({});
  const [editingStudyMaterial, setEditingStudyMaterial] = useState<string | null>(null);
  const [studyMaterialName, setStudyMaterialName] = useState<string>("");
  const [studyMaterialUrl, setStudyMaterialUrl] = useState<string>("");
  const [uploadingPdf, setUploadingPdf] = useState<boolean>(false);
  const [savingMaterial, setSavingMaterial] = useState<boolean>(false);
  // ─────────────────────────────────────────────────────────────────────────

  const [dragItem, setDragItem] = useState<{
    moduleId: string;
    submoduleId: string;
    index: number;
  } | null>(null);

  const [editingItemKey, setEditingItemKey] = useState<string | null>(null);

  // Sync course prop
  useEffect(() => {
    setEditingCourse(course as Course | null);
  }, [course]);

  // Fetch all study materials for this course when the panel opens
  useEffect(() => {
    if (!isOpen || !course) return;

    const courseId = (course as any).courseId ?? (course as any).id ?? "";
    if (!courseId) return;

    fetch(`/api/admin/study-material?courseId=${encodeURIComponent(courseId)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          const map: StudyMaterialMap = {};
          (json.data as StudyMaterial[]).forEach((m) => {
            map[m.module_id] = m;
          });
          setStudyMaterials(map);
        }
      })
      .catch((err) => console.error("Fetch study materials error:", err));
  }, [isOpen, course]);

  if (!isOpen || !editingCourse) return null;

  /* ─── helpers ─────────────────────────────────────────────────────────── */

  const getCourseId = (): string =>
    (editingCourse as any).courseId ?? (editingCourse as any).id ?? "";

  const updateModules = (modules: Module[]) => {
    setEditingCourse({
      ...editingCourse,
      courseData: { ...editingCourse.courseData, modules },
    } as Course);
  };

  const toggleModule = (id: string) =>
    setOpenModules((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );

  const getItemId = (item: ItemType): string => {
    if (item.type === "video") return item.sessionId;
    if (item.type === "quiz") return item.quizRefId;
    if (item.type === "pdf") return item.pdfId;
    return "";
  };

  const getItemKey = (item: ItemType): string => `${item.type}-${getItemId(item)}`;

  const isSameItem = (a: ItemType, b: ItemType): boolean =>
    getItemKey(a) === getItemKey(b);

  const reorderItems = (list: ItemType[], from: number, to: number) => {
    const result = Array.from(list);
    const [removed] = result.splice(from, 1);
    result.splice(to, 0, removed);
    return result;
  };

  /* ─── module ──────────────────────────────────────────────────────────── */

  const addModule = () =>
    updateModules([
      ...editingCourse.courseData.modules,
      { moduleId: `MOD_${Date.now()}`, name: "New Module", submodules: [] },
    ]);

  const deleteModule = (moduleId: string) =>
    updateModules(editingCourse.courseData.modules.filter((m) => m.moduleId !== moduleId));

  const updateModuleName = (moduleId: string, name: string) =>
    updateModules(
      editingCourse.courseData.modules.map((m) =>
        m.moduleId === moduleId ? { ...m, name } : m
      )
    );

  /* ─── submodule ───────────────────────────────────────────────────────── */

  const addSubmodule = (moduleId: string) => {
    updateModules(
      editingCourse.courseData.modules.map((m) =>
        m.moduleId === moduleId
          ? {
              ...m,
              submodules: [
                ...m.submodules,
                { submoduleId: `SUB_${Date.now()}`, title: "New Submodule", items: [] },
              ],
            }
          : m
      )
    );
    if (!openModules.includes(moduleId)) toggleModule(moduleId);
  };

  const updateSubmoduleName = (moduleId: string, subId: string, title: string) =>
    updateModules(
      editingCourse.courseData.modules.map((m) =>
        m.moduleId === moduleId
          ? {
              ...m,
              submodules: m.submodules.map((s) =>
                s.submoduleId === subId ? { ...s, title } : s
              ),
            }
          : m
      )
    );

  const deleteSubmodule = (moduleId: string, subId: string) =>
    updateModules(
      editingCourse.courseData.modules.map((m) =>
        m.moduleId === moduleId
          ? { ...m, submodules: m.submodules.filter((s) => s.submoduleId !== subId) }
          : m
      )
    );

  /* ─── items ───────────────────────────────────────────────────────────── */

  const updateItemName = (moduleId: string, subId: string, item: ItemType, name: string) =>
    updateModules(
      editingCourse.courseData.modules.map((m) =>
        m.moduleId === moduleId
          ? {
              ...m,
              submodules: m.submodules.map((s) =>
                s.submoduleId === subId
                  ? { ...s, items: (s.items || []).map((i) => (isSameItem(i, item) ? { ...i, name } : i)) }
                  : s
              ),
            }
          : m
      )
    );

  const deleteItem = (moduleId: string, subId: string, item: ItemType) =>
    updateModules(
      editingCourse.courseData.modules.map((m) =>
        m.moduleId === moduleId
          ? {
              ...m,
              submodules: m.submodules.map((s) =>
                s.submoduleId === subId
                  ? {
                      ...s,
                      items: (s.items || []).filter((i) => {
                        if (item.type === "video" && i.type === "video") return i.sessionId !== item.sessionId;
                        if (item.type === "quiz" && i.type === "quiz") return i.quizRefId !== item.quizRefId;
                        if (item.type === "pdf" && i.type === "pdf") return i.pdfId !== item.pdfId;
                        return true;
                      }),
                    }
                  : s
              ),
            }
          : m
      )
    );

  /* ─── live sessions ───────────────────────────────────────────────────── */

  const selectedLiveModule = editingCourse.courseData.modules.find(
    (m) => m.moduleId === selectedLiveModuleId
  );

  const resetLiveSessionForm = () => {
    setLiveSessionTitle("");
    setLiveSessionUrl("");
    setEditingLiveSessionId(null);
    setShowLiveSessionForm(false);
  };

  const startLiveSessionEdit = (moduleId: string, session: any) => {
    setSelectedLiveModuleId(moduleId);
    setLiveSessionTitle(session.title ?? "");
    setLiveSessionUrl(session.url ?? "");
    setEditingLiveSessionId(session.id ?? null);
    setShowLiveSessionForm(true);
  };

  const updateLiveSession = (moduleId: string, sessionId: string, payload: any) =>
    updateModules(
      editingCourse.courseData.modules.map((m) =>
        m.moduleId === moduleId
          ? {
              ...m,
              liveSessions: (m.liveSessions || []).map((s) =>
                s.id === sessionId ? { ...s, ...payload } : s
              ),
            }
          : m
      )
    );

  const addLiveSession = (moduleId: string, payload: any) =>
    updateModules(
      editingCourse.courseData.modules.map((m) =>
        m.moduleId === moduleId
          ? {
              ...m,
              liveSessions: [
                ...(m.liveSessions || []),
                {
                  id: `LS_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                  title: payload.title || "Live Recording",
                  url: payload.url || "",
                },
              ],
            }
          : m
      )
    );

  const removeLiveSession = (moduleId: string, sessionId: string) =>
    updateModules(
      editingCourse.courseData.modules.map((m) =>
        m.moduleId === moduleId
          ? { ...m, liveSessions: (m.liveSessions || []).filter((s) => s.id !== sessionId) }
          : m
      )
    );

  const saveLiveSession = () => {
    if (!selectedLiveModuleId) return;
    const title = liveSessionTitle.trim();
    const url = liveSessionUrl.trim();
    if (!url) { alert("Please enter a valid YouTube URL or video link."); return; }

    if (editingLiveSessionId) {
      updateLiveSession(selectedLiveModuleId, editingLiveSessionId, { title: title || "Live Recording", url });
    } else {
      addLiveSession(selectedLiveModuleId, { title: title || "Live Recording", url });
    }
    resetLiveSessionForm();
  };

  /* ─── study material (DB-backed) ─────────────────────────────────────── */

  const startStudyMaterialEdit = (moduleId: string) => {
    const existing = studyMaterials[moduleId];
    setEditingStudyMaterial(moduleId);
    setStudyMaterialName(existing?.material_name || "Full Study Material");
    setStudyMaterialUrl(existing?.file_url || "");
  };

  const saveStudyMaterial = async (moduleId: string) => {
    const url = studyMaterialUrl.trim();
    if (!url) { alert("Please enter or upload a PDF URL."); return; }

    const mod = editingCourse.courseData.modules.find((m) => m.moduleId === moduleId);

    setSavingMaterial(true);
    try {
      const res = await fetch("/api/admin/study-material", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId:     getCourseId(),
          courseName:   editingCourse.name || "",
          moduleId,
          moduleName:   mod?.name || "",
          materialName: studyMaterialName.trim() || "Full Study Material",
          fileUrl:      url,
        }),
      });

      if (!res.ok) throw new Error("Save failed");
      const json = await res.json();

      // Update local map immediately — no need to refetch
      setStudyMaterials((prev) => ({
        ...prev,
        [moduleId]: json.data as StudyMaterial,
      }));

      setEditingStudyMaterial(null);
      onSaved();
    } catch (err) {
      console.error("Save study material error:", err);
      alert("Failed to save study material.");
    } finally {
      setSavingMaterial(false);
    }
  };

  const removeStudyMaterial = async (moduleId: string) => {
    if (!confirm("Are you sure you want to remove this study material?")) return;

    try {
      const res = await fetch("/api/admin/study-material", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: getCourseId(), moduleId }),
      });

      if (!res.ok) throw new Error("Delete failed");

      setStudyMaterials((prev) => {
        const next = { ...prev };
        delete next[moduleId];
        return next;
      });
      onSaved();
    } catch (err) {
      console.error("Remove study material error:", err);
      alert("Failed to remove study material.");
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPdf(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "study_materials");

      const res = await fetch("/api/admin/upload-pdf", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      if (data.url || data.secure_url) {
        setStudyMaterialUrl(data.url || data.secure_url);
        if (!studyMaterialName) setStudyMaterialName(file.name);
      }
    } catch (err) {
      console.error("PDF upload error:", err);
      alert("Failed to upload PDF.");
    } finally {
      setUploadingPdf(false);
    }
  };

  /* ─── save course ─────────────────────────────────────────────────────── */

  const saveCourse = async () => {
    try {
      const res = await fetch("/api/admin/update-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCourse),
      });
      if (!res.ok) throw new Error("Failed to save course");
      onSaved();
      onClose();
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save course");
    }
  };

  /* ─── render ──────────────────────────────────────────────────────────── */

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-end z-50 transition-opacity">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

        {/* HEADER */}
        <div className="p-6 border-b flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Edit Curriculum</h2>
            <p className="text-sm text-slate-500">{editingCourse.name || "Untitled Course"}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Tabs */}
          <div className="flex gap-2 border-b border-slate-200">
            <button
              onClick={() => setActiveTab("structure")}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
                activeTab === "structure"
                  ? "bg-indigo-50 text-indigo-700 border-indigo-600"
                  : "text-slate-500 hover:text-slate-700 border-transparent"
              }`}
            >
              Course Structure
            </button>
            <button
              onClick={() => setActiveTab("live-recording")}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
                activeTab === "live-recording"
                  ? "bg-indigo-50 text-indigo-700 border-indigo-600"
                  : "text-slate-500 hover:text-slate-700 border-transparent"
              }`}
            >
              Live Recording Session
            </button>
          </div>

          {/* ── COURSE STRUCTURE TAB ── */}
          {activeTab === "structure" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-slate-700">Course Structure</h3>
                <button
                  onClick={addModule}
                  className="text-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all"
                >
                  <Plus size={16} /> Add Module
                </button>
              </div>

              {editingCourse.courseData.modules.map((m) => {
                const isOpen = openModules.includes(m.moduleId);
                // Study material comes from DB map, not from course JSON
                const dbMaterial = studyMaterials[m.moduleId] ?? null;

                return (
                  <div
                    key={m.moduleId}
                    className="group border border-slate-200 rounded-xl overflow-hidden bg-white hover:border-indigo-200 transition-all shadow-sm"
                  >
                    {/* MODULE HEADER */}
                    <div className={`flex items-center justify-between p-4 ${isOpen ? "bg-slate-50 border-b" : "bg-white"}`}>
                      <div className="flex gap-3 items-center flex-1">
                        <button
                          onClick={() => toggleModule(m.moduleId)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        </button>

                        {editingModuleId === m.moduleId ? (
                          <input
                            value={m.name}
                            onChange={(e) => updateModuleName(m.moduleId, e.target.value)}
                            onBlur={() => setEditingModuleId(null)}
                            onKeyDown={(e) => e.key === "Enter" && setEditingModuleId(null)}
                            className="border-b-2 border-indigo-500 outline-none bg-transparent py-1 w-full font-semibold text-slate-800"
                            autoFocus
                          />
                        ) : (
                          <span className="font-bold text-slate-800 cursor-pointer" onClick={() => toggleModule(m.moduleId)}>
                            {m.name}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingModuleId(m.moduleId)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-md transition-all"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => addSubmodule(m.moduleId)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-md transition-all"
                        >
                          <Plus size={16} />
                        </button>
                        <button
                          onClick={() => deleteModule(m.moduleId)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-md transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* SUBMODULES + STUDY MATERIAL */}
                    {isOpen && (
                      <div className="p-4 bg-white space-y-4">

                        {/* ── FULL STUDY MATERIAL (DB-backed) ── */}
                        <div className="bg-emerald-50/30 border border-emerald-100 p-4 rounded-lg group/mat">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-emerald-700 text-sm flex items-center gap-2">
                              <FileText size={16} /> Full Study Material (PDF)
                            </h4>

                            {editingStudyMaterial !== m.moduleId && (
                              <div className="flex gap-2 opacity-0 group-hover/mat:opacity-100 transition-opacity">
                                {!dbMaterial ? (
                                  <button
                                    onClick={() => startStudyMaterialEdit(m.moduleId)}
                                    className="text-[11px] uppercase tracking-wider font-bold bg-emerald-600 text-white px-3 py-1 rounded shadow-sm hover:bg-emerald-700 transition-all"
                                  >
                                    Add PDF
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => startStudyMaterialEdit(m.moduleId)}
                                      className="p-1.5 text-emerald-500 hover:text-emerald-700 transition-colors"
                                      title="Edit Material"
                                    >
                                      <Pencil size={14} />
                                    </button>
                                    <button
                                      onClick={() => removeStudyMaterial(m.moduleId)}
                                      className="p-1.5 text-emerald-500 hover:text-red-600 transition-colors"
                                      title="Remove Material"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Edit form */}
                          {editingStudyMaterial === m.moduleId ? (
                            <div className="space-y-3 mt-3 bg-white p-3 rounded border border-emerald-200 shadow-sm">
                              <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Material Name</label>
                                <input
                                  value={studyMaterialName}
                                  onChange={(e) => setStudyMaterialName(e.target.value)}
                                  placeholder="e.g., Full Study Material"
                                  className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm outline-none focus:border-emerald-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">PDF URL / File</label>
                                <div className="flex gap-2">
                                  <input
                                    value={studyMaterialUrl}
                                    onChange={(e) => setStudyMaterialUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="flex-1 border border-slate-200 rounded px-3 py-1.5 text-sm outline-none focus:border-emerald-500"
                                  />
                                  <div className="relative">
                                    <input
                                      type="file"
                                      accept="application/pdf"
                                      onChange={handlePdfUpload}
                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                      disabled={uploadingPdf}
                                    />
                                    <button
                                      type="button"
                                      className="h-full px-3 py-1.5 text-xs bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 rounded font-medium whitespace-nowrap"
                                      disabled={uploadingPdf}
                                    >
                                      {uploadingPdf ? "Uploading..." : "Upload File"}
                                    </button>
                                  </div>
                                </div>
                              </div>
                              <div className="flex justify-end gap-2 mt-2">
                                <button
                                  onClick={() => setEditingStudyMaterial(null)}
                                  className="px-3 py-1.5 text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 rounded font-medium"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => saveStudyMaterial(m.moduleId)}
                                  disabled={savingMaterial}
                                  className="px-3 py-1.5 text-xs bg-emerald-600 text-white hover:bg-emerald-700 rounded font-medium disabled:opacity-60"
                                >
                                  {savingMaterial ? "Saving..." : "Save Material"}
                                </button>
                              </div>
                            </div>
                          ) : dbMaterial ? (
                            /* Saved material display */
                            <div className="flex items-center justify-between gap-2 mt-2 p-2.5 bg-white rounded border border-emerald-100 text-sm shadow-sm">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <FileText size={16} className="text-emerald-500 shrink-0" />
                                <a
                                  href={dbMaterial.file_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-600 hover:text-emerald-700 hover:underline font-medium truncate"
                                >
                                  {dbMaterial.material_name}
                                </a>
                              </div>
                              <span className="text-[10px] text-slate-400 shrink-0">Saved in DB</span>
                            </div>
                          ) : (
                            <div className="text-xs text-emerald-600/70 italic mt-1">
                              No full study material added.
                            </div>
                          )}
                        </div>

                        {/* ── SUBMODULES ── */}
                        {m.submodules.length === 0 && (
                          <p className="text-center text-sm text-slate-400 py-2 italic">No submodules yet</p>
                        )}

                        {m.submodules.map((s) => (
                          <div key={s.submoduleId} className="bg-slate-50/50 border border-slate-100 p-4 rounded-lg group/sub">
                            <div className="flex justify-between items-center mb-3">
                              {editingSubId === s.submoduleId ? (
                                <input
                                  value={s.title}
                                  onChange={(e) => updateSubmoduleName(m.moduleId, s.submoduleId, e.target.value)}
                                  onBlur={() => setEditingSubId(null)}
                                  onKeyDown={(e) => e.key === "Enter" && setEditingSubId(null)}
                                  className="border-b border-indigo-500 outline-none bg-transparent py-1 font-medium"
                                  autoFocus
                                />
                              ) : (
                                <h4 className="font-semibold text-slate-700 text-sm">{s.title}</h4>
                              )}

                              <div className="flex gap-1 items-center opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                <button
                                  onClick={() => setEditingSubId(s.submoduleId)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  onClick={() => deleteSubmodule(m.moduleId, s.submoduleId)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                                <button
                                  onClick={() => setAddTarget({ moduleId: m.moduleId, submoduleId: s.submoduleId })}
                                  className="ml-2 text-[11px] uppercase tracking-wider font-bold bg-indigo-600 text-white px-3 py-1 rounded shadow-sm hover:bg-indigo-700 transition-all"
                                >
                                  Add Content
                                </button>
                              </div>
                            </div>

                            {/* ITEMS */}
                            <div className="flex flex-wrap gap-2">
                              {(s.items || []).map((it: ItemType, index: number) => {
                                const itemKey = getItemKey(it);
                                return (
                                  <div
                                    key={itemKey}
                                    draggable
                                    onDragStart={() => setDragItem({ moduleId: m.moduleId, submoduleId: s.submoduleId, index })}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={() => {
                                      if (
                                        !dragItem ||
                                        dragItem.moduleId !== m.moduleId ||
                                        dragItem.submoduleId !== s.submoduleId ||
                                        dragItem.index === index
                                      ) return;

                                      updateModules(
                                        editingCourse.courseData.modules.map((mod) =>
                                          mod.moduleId === m.moduleId
                                            ? {
                                                ...mod,
                                                submodules: mod.submodules.map((sub) =>
                                                  sub.submoduleId === s.submoduleId
                                                    ? { ...sub, items: reorderItems(sub.items, dragItem.index, index) }
                                                    : sub
                                                ),
                                              }
                                            : mod
                                        )
                                      );
                                      setDragItem(null);
                                    }}
                                    className="bg-white border border-slate-200 pl-2 pr-1 py-1 text-xs rounded-md flex items-center gap-2 text-slate-600 shadow-sm group/item"
                                  >
                                    {it.type === "video" && <Video size={12} className="text-blue-500" />}
                                    {it.type === "quiz"  && <FileQuestion size={12} className="text-orange-500" />}
                                    {it.type === "pdf"   && <FileText size={12} className="text-emerald-500" />}

                                    {editingItemKey === itemKey ? (
                                      <input
                                        value={it.name}
                                        onChange={(e) => updateItemName(m.moduleId, s.submoduleId, it, e.target.value)}
                                        onBlur={() => setEditingItemKey(null)}
                                        onKeyDown={(e) => e.key === "Enter" && setEditingItemKey(null)}
                                        className="max-w-37.5 outline-none bg-transparent"
                                        autoFocus
                                      />
                                    ) : (
                                      <span className="max-w-37.5 truncate" onDoubleClick={() => setEditingItemKey(itemKey)}>
                                        {it.name}
                                      </span>
                                    )}

                                    <button
                                      onClick={() => deleteItem(m.moduleId, s.submoduleId, it)}
                                      className="p-1 hover:bg-red-50 hover:text-red-500 rounded transition-colors text-slate-300"
                                    >
                                      <X size={10} />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── LIVE RECORDING TAB ── */}
          {activeTab === "live-recording" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-slate-700">Live Recording Session</h4>
                  <p className="text-sm text-slate-500">
                    Manage each module and add one or more YouTube/video links per module.
                  </p>
                </div>
                <button
                  onClick={addModule}
                  className="text-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all"
                >
                  <Plus size={16} /> Add Module
                </button>
              </div>

              {editingCourse.courseData.modules.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No modules yet.</p>
              ) : (
                <div className="grid gap-4 lg:grid-cols-[1.15fr_1.85fr]">
                  <div className="space-y-3">
                    {editingCourse.courseData.modules.map((mod: any) => {
                      const sessions: any[] = mod.liveSessions || [];
                      const selected = selectedLiveModuleId === mod.moduleId;
                      return (
                        <button
                          key={mod.moduleId}
                          type="button"
                          onClick={() => { setSelectedLiveModuleId(mod.moduleId); resetLiveSessionForm(); }}
                          className={`w-full text-left rounded-3xl border p-4 transition-all ${
                            selected ? "border-indigo-500 bg-indigo-50 shadow-sm" : "border-slate-200 bg-white hover:border-indigo-200"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">{mod.name}</p>
                              <p className="text-xs text-slate-500 mt-1">
                                {sessions.length} live session{sessions.length === 1 ? "" : "s"}
                              </p>
                            </div>
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                              Module
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    {!selectedLiveModule ? (
                      <div className="flex h-full min-h-55 flex-col items-center justify-center text-center text-slate-500">
                        <p className="text-sm font-semibold">Select a module to manage live recording sessions.</p>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{selectedLiveModule.name}</p>
                            <p className="text-xs text-slate-500 mt-1">Add YouTube/video sessions for this module.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setShowLiveSessionForm(true); setEditingLiveSessionId(null); setLiveSessionTitle(""); setLiveSessionUrl(""); }}
                            className="text-sm bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-xl transition-all"
                          >
                            + Add Session
                          </button>
                        </div>

                        <div className="space-y-3">
                          {(selectedLiveModule.liveSessions || []).length === 0 ? (
                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                              No live recording sessions added yet.
                            </div>
                          ) : (
                            (selectedLiveModule.liveSessions || []).map((session: any) => (
                              <div key={session.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="min-w-0">
                                    <p className="font-semibold text-slate-900 truncate">{session.title || "Untitled session"}</p>
                                    <a href={session.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800 break-all">
                                      {session.url}
                                    </a>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => startLiveSessionEdit(selectedLiveModule.moduleId, session)}
                                      className="text-sm bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 px-3 py-2 rounded-xl transition-all"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removeLiveSession(selectedLiveModule.moduleId, session.id)}
                                      className="text-sm bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 px-3 py-2 rounded-xl transition-all"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {showLiveSessionForm && (
                          <div className="rounded-3xl border border-indigo-100 bg-indigo-50 p-5">
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-700">Session Title</label>
                                <input
                                  value={liveSessionTitle}
                                  onChange={(e) => setLiveSessionTitle(e.target.value)}
                                  placeholder="Enter a title for the session"
                                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-indigo-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700">YouTube / Video URL</label>
                                <input
                                  value={liveSessionUrl}
                                  onChange={(e) => setLiveSessionUrl(e.target.value)}
                                  placeholder="https://www.youtube.com/watch?v=..."
                                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-indigo-500"
                                />
                              </div>
                              <div className="flex flex-wrap gap-3 justify-end">
                                <button
                                  type="button"
                                  onClick={resetLiveSessionForm}
                                  className="text-sm bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 px-4 py-2 rounded-xl transition-all"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={saveLiveSession}
                                  className="text-sm bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-xl transition-all"
                                >
                                  Save Session
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t bg-slate-50 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={saveCourse}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-95"
          >
            <Save size={18} />
            Save Changes
          </button>
        </div>
      </div>

      <AddSessionQuiz
        isOpen={!!addTarget}
        target={addTarget}
        editingCourse={editingCourse}
        setEditingCourse={setEditingCourse}
        onClose={() => setAddTarget(null)}
      />
    </div>
  );
}