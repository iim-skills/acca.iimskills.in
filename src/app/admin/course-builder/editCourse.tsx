"use client";

import { useState, useEffect, useRef } from "react";
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
  Upload,
  Loader2,
  ExternalLink,
} from "lucide-react";

import AddSessionQuiz from "./addSessionQuiz";
import { Course, TargetType, ItemType } from "./types/course";

type Props = {
  isOpen: boolean;
  course: Course | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function EditCourse({
  isOpen,
  course,
  onClose,
  onSaved,
}: Props) {
  const [editingCourse, setEditingCourse] = useState<Course | null>(course);
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

  // Per-module Full Study Material files pending upload, keyed by moduleId
  const [moduleStudyMaterialFiles, setModuleStudyMaterialFiles] = useState<
    Record<string, File>
  >({});
  const [savingCourse, setSavingCourse] = useState(false);

  const [dragItem, setDragItem] = useState<{
    moduleId: string;
    submoduleId: string;
    index: number;
  } | null>(null);

  const [editingItemKey, setEditingItemKey] = useState<string | null>(null);

  // One hidden file input per module, keyed by moduleId
  const fullStudyMaterialInputRefs = useRef<Record<string, HTMLInputElement | null>>(
    {}
  );

  useEffect(() => {
    setEditingCourse(course);
    setModuleStudyMaterialFiles({});
    setSavingCourse(false);
  }, [course]);

  if (!isOpen || !editingCourse) return null;

  /* ================= HELPERS ================= */

  const updateModules = (modules: typeof editingCourse.courseData.modules) => {
    setEditingCourse({
      ...editingCourse,
      courseData: { ...editingCourse.courseData, modules },
    });
  };

  const toggleModule = (id: string) => {
    setOpenModules((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getItemId = (item: ItemType): string => {
    if (item.type === "video") return item.sessionId;
    if (item.type === "quiz") return item.quizRefId;
    if (item.type === "pdf") return item.pdfId;
    return "";
  };

  const getItemKey = (item: ItemType): string => {
    return `${item.type}-${getItemId(item)}`;
  };

  const isSameItem = (a: ItemType, b: ItemType): boolean => {
    return getItemKey(a) === getItemKey(b);
  };

  const reorderItems = (
    list: ItemType[],
    startIndex: number,
    endIndex: number
  ) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  /* ================= MODULE ================= */

  const addModule = () => {
    updateModules([
      ...editingCourse.courseData.modules,
      {
        moduleId: `MOD_${Date.now()}`,
        name: "New Module",
        submodules: [],
      },
    ]);
  };

  const deleteModule = (moduleId: string) => {
    updateModules(
      editingCourse.courseData.modules.filter((m) => m.moduleId !== moduleId)
    );

    setModuleStudyMaterialFiles((prev) => {
      if (!(moduleId in prev)) return prev;
      const next = { ...prev };
      delete next[moduleId];
      return next;
    });
  };

  const updateModuleName = (moduleId: string, name: string) => {
    updateModules(
      editingCourse.courseData.modules.map((m) =>
        m.moduleId === moduleId ? { ...m, name } : m
      )
    );
  };

  /* ================= MODULE FULL STUDY MATERIAL ================= */

  const handleModuleStudyMaterialChange = (
    moduleId: string,
    file: File | null
  ) => {
    setModuleStudyMaterialFiles((prev) => {
      const next = { ...prev };
      if (file) {
        next[moduleId] = file;
      } else {
        delete next[moduleId];
      }
      return next;
    });
  };

  /* ================= SUBMODULE ================= */

  const addSubmodule = (moduleId: string) => {
    updateModules(
      editingCourse.courseData.modules.map((m) =>
        m.moduleId === moduleId
          ? {
              ...m,
              submodules: [
                ...m.submodules,
                {
                  submoduleId: `SUB_${Date.now()}`,
                  title: "New Submodule",
                  items: [],
                },
              ],
            }
          : m
      )
    );

    if (!openModules.includes(moduleId)) toggleModule(moduleId);
  };

  const updateSubmoduleName = (
    moduleId: string,
    subId: string,
    title: string
  ) => {
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
  };

  const deleteSubmodule = (moduleId: string, subId: string) => {
    updateModules(
      editingCourse.courseData.modules.map((m) =>
        m.moduleId === moduleId
          ? {
              ...m,
              submodules: m.submodules.filter((s) => s.submoduleId !== subId),
            }
          : m
      )
    );
  };

  /* ================= ITEMS ================= */

  const updateItemName = (
    moduleId: string,
    subId: string,
    item: ItemType,
    name: string
  ) => {
    updateModules(
      editingCourse.courseData.modules.map((m) =>
        m.moduleId === moduleId
          ? {
              ...m,
              submodules: m.submodules.map((s) =>
                s.submoduleId === subId
                  ? {
                      ...s,
                      items: (s.items || []).map((i) =>
                        isSameItem(i, item) ? { ...i, name } : i
                      ),
                    }
                  : s
              ),
            }
          : m
      )
    );
  };

  const deleteItem = (moduleId: string, subId: string, item: ItemType) => {
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
                        if (item.type === "video" && i.type === "video") {
                          return i.sessionId !== item.sessionId;
                        }

                        if (item.type === "quiz" && i.type === "quiz") {
                          return i.quizRefId !== item.quizRefId;
                        }

                        if (item.type === "pdf" && i.type === "pdf") {
                          return i.pdfId !== item.pdfId;
                        }

                        return true;
                      }),
                    }
                  : s
              ),
            }
          : m
      )
    );
  };

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

  const updateLiveSession = (moduleId: string, sessionId: string, payload: any) => {
    updateModules(
      editingCourse.courseData.modules.map((m) =>
        m.moduleId === moduleId
          ? {
              ...m,
              liveSessions: (m.liveSessions || []).map((session) =>
                session.id === sessionId ? { ...session, ...payload } : session
              ),
            }
          : m
      )
    );
  };

  const addLiveSession = (moduleId: string, payload: any) => {
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
  };

  const removeLiveSession = (moduleId: string, sessionId: string) => {
    updateModules(
      editingCourse.courseData.modules.map((m) =>
        m.moduleId === moduleId
          ? {
              ...m,
              liveSessions: (m.liveSessions || []).filter(
                (session) => session.id !== sessionId
              ),
            }
          : m
      )
    );
  };

  const saveLiveSession = () => {
    if (!selectedLiveModuleId) return;

    const title = liveSessionTitle.trim();
    const url = liveSessionUrl.trim();

    if (!url) {
      alert("Please enter a valid YouTube URL or video link.");
      return;
    }

    if (editingLiveSessionId) {
      updateLiveSession(selectedLiveModuleId, editingLiveSessionId, {
        title: title || "Live Recording",
        url,
      });
    } else {
      addLiveSession(selectedLiveModuleId, {
        title: title || "Live Recording",
        url,
      });
    }

    resetLiveSessionForm();
  };

  /* ================= SAVE ================= */

  const saveCourse = async () => {
    try {
      if (!editingCourse) return;

      setSavingCourse(true);

      let modules = editingCourse.courseData.modules;

      const moduleIdsToUpload = Object.keys(moduleStudyMaterialFiles);

      // Upload any pending per-module Full Study Material PDFs first
      if (moduleIdsToUpload.length > 0) {
        const uploadedByModule: Record<
          string,
          { name: string; fileUrl: string }
        > = {};

        for (const moduleId of moduleIdsToUpload) {
          const file = moduleStudyMaterialFiles[moduleId];
          if (!file) continue;
          const currentModule =
            modules.find((m) => m.moduleId === moduleId) ?? null;

          const formData = new FormData();
          formData.append("file", file);
          formData.append("name", file.name);
          formData.append("courseDbId", String(editingCourse.id));
          formData.append("courseName", editingCourse.name || "");
          formData.append("moduleId", moduleId);
          formData.append("moduleName", currentModule?.name || moduleId);

          const uploadRes = await fetch("/api/admin/upload-course-material", {
            method: "POST",
            body: formData,
          });

          const uploadData = await uploadRes.json();

          if (!uploadRes.ok) {
            throw new Error(
              uploadData?.message ||
                `Failed to upload Full Study Material for module "${
                  currentModule?.name || moduleId
                }"`
            );
          }

          uploadedByModule[moduleId] = {
            name:
              String(uploadData?.name || file.name || "Full Study Material").trim() ||
              "Full Study Material",
            fileUrl: String(uploadData?.fileUrl || "").trim(),
          };
        }

        modules = modules.map((m) =>
          uploadedByModule[m.moduleId]
            ? { ...m, fullStudyMaterial: uploadedByModule[m.moduleId] }
            : m
        );
      }

      const courseToSave = {
        ...editingCourse,
        courseData: { ...editingCourse.courseData, modules },
      };

      setEditingCourse(courseToSave);

      const res = await fetch("/api/admin/update-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(courseToSave),
      });

      if (!res.ok) {
        throw new Error("Failed to save course");
      }

      setModuleStudyMaterialFiles({});
      onSaved();
      onClose();
    } catch (error) {
      console.error("Save error:", error);
      alert(
        error instanceof Error ? error.message : "Failed to save course"
      );
    } finally {
      setSavingCourse(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-end z-50 transition-opacity">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* HEADER */}
        <div className="p-6 border-b flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Edit Curriculum</h2>
            <p className="text-sm text-slate-500">
              {editingCourse.name || "Untitled Course"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-700">Course Structure</h3>
            <button
              onClick={addModule}
              className="text-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all"
            >
              <Plus size={16} /> Add Module
            </button>
          </div>

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

          {/* Course Structure Tab */}
          {activeTab === "structure" && (
            <div className="space-y-4">
              <button
                onClick={addModule}
                className="text-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all"
              >
                <Plus size={16} /> Add Module
              </button>
            {editingCourse.courseData.modules.map((m: any) => {
              const isOpen = openModules.includes(m.moduleId);
              const pendingFile = moduleStudyMaterialFiles[m.moduleId];

              return (
                <div
                  key={m.moduleId}
                  className="group border border-slate-200 rounded-xl overflow-hidden bg-white hover:border-indigo-200 transition-all shadow-sm"
                >
                  {/* MODULE HEADER */}
                  <div
                    className={`flex items-center justify-between p-4 ${
                      isOpen ? "bg-slate-50 border-b" : "bg-white"
                    }`}
                  >
                    <div className="flex gap-3 items-center flex-1">
                      <button
                        onClick={() => toggleModule(m.moduleId)}
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        {isOpen ? (
                          <ChevronDown size={20} />
                        ) : (
                          <ChevronRight size={20} />
                        )}
                      </button>

                      {editingModuleId === m.moduleId ? (
                        <input
                          value={m.name}
                          onChange={(e) =>
                            updateModuleName(m.moduleId, e.target.value)
                          }
                          onBlur={() => setEditingModuleId(null)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && setEditingModuleId(null)
                          }
                          className="border-b-2 border-indigo-500 outline-none bg-transparent py-1 w-full font-semibold text-slate-800"
                          autoFocus
                        />
                      ) : (
                        <span
                          className="font-bold text-slate-800 cursor-pointer"
                          onClick={() => toggleModule(m.moduleId)}
                        >
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

                  {/* MODULE BODY: Full Study Material + SUBMODULES */}
                  {isOpen && (
                    <div className="p-4 bg-white space-y-4">
                      {/* FULL STUDY MATERIAL (per module) */}
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h4 className="font-semibold text-slate-800 text-sm">
                              Full Study Material
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">
                              Upload one PDF for this module. It will appear
                              above the submodules on the student course page.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              fullStudyMaterialInputRefs.current[
                                m.moduleId
                              ]?.click()
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-indigo-700 shrink-0"
                          >
                            <Upload size={14} />
                            Add Full Study Material
                          </button>
                        </div>

                        <input
                          ref={(el) => {
                            fullStudyMaterialInputRefs.current[m.moduleId] = el;
                          }}
                          type="file"
                          accept="application/pdf"
                          onChange={(e) =>
                            handleModuleStudyMaterialChange(
                              m.moduleId,
                              e.target.files?.[0] ?? null
                            )
                          }
                          className="hidden"
                        />

                        {pendingFile && (
                          <div className="rounded-xl border border-indigo-100 bg-white px-3 py-2 text-xs text-indigo-700">
                            Selected PDF: {pendingFile.name}
                          </div>
                        )}

                        {m.fullStudyMaterial?.fileUrl && (
                          <a
                            href={m.fullStudyMaterial.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                          >
                            <FileText size={14} />
                            Current uploaded PDF
                            <ExternalLink size={12} />
                          </a>
                        )}

                        <p className="text-[11px] text-slate-400">
                          The selected PDF will upload when you click Save
                          Changes.
                        </p>
                      </div>

                      {m.submodules.length === 0 && (
                        <p className="text-center text-sm text-slate-400 py-2 italic">
                          No submodules yet
                        </p>
                      )}

                      {m.submodules.map((s: any) => (
                        <div
                          key={s.submoduleId}
                          className="bg-slate-50/50 border border-slate-100 p-4 rounded-lg group/sub"
                        >
                          <div className="flex justify-between items-center mb-3">
                            {editingSubId === s.submoduleId ? (
                              <input
                                value={s.title}
                                onChange={(e) =>
                                  updateSubmoduleName(
                                    m.moduleId,
                                    s.submoduleId,
                                    e.target.value
                                  )
                                }
                                onBlur={() => setEditingSubId(null)}
                                onKeyDown={(e) =>
                                  e.key === "Enter" && setEditingSubId(null)
                                }
                                className="border-b border-indigo-500 outline-none bg-transparent py-1 font-medium"
                                autoFocus
                              />
                            ) : (
                              <h4 className="font-semibold text-slate-700 text-sm">
                                {s.title}
                              </h4>
                            )}

                            <div className="flex gap-1 items-center opacity-0 group-hover/sub:opacity-100 transition-opacity">
                              <button
                                onClick={() => setEditingSubId(s.submoduleId)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() =>
                                  deleteSubmodule(m.moduleId, s.submoduleId)
                                }
                                className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                              <button
                                onClick={() =>
                                  setAddTarget({
                                    moduleId: m.moduleId,
                                    submoduleId: s.submoduleId,
                                  })
                                }
                                className="ml-2 text-[11px] uppercase tracking-wider font-bold bg-indigo-600 text-white px-3 py-1 rounded shadow-sm hover:bg-indigo-700 transition-all"
                              >
                                Add Content
                              </button>
                            </div>
                          </div>

                          {/* ITEMS */}
                          <div className="flex flex-wrap gap-2">
                            {s.items.map((it: ItemType, index: number) => {
                              const itemKey = getItemKey(it);

                              return (
                                <div
                                  key={itemKey}
                                  draggable
                                  onDragStart={() =>
                                    setDragItem({
                                      moduleId: m.moduleId,
                                      submoduleId: s.submoduleId,
                                      index,
                                    })
                                  }
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={() => {
                                    if (
                                      !dragItem ||
                                      dragItem.moduleId !== m.moduleId ||
                                      dragItem.submoduleId !== s.submoduleId ||
                                      dragItem.index === index
                                    ) {
                                      return;
                                    }

                                    updateModules(
                                      editingCourse.courseData.modules.map(
                                        (mod) =>
                                          mod.moduleId === m.moduleId
                                            ? {
                                                ...mod,
                                                submodules: mod.submodules.map(
                                                  (sub) =>
                                                    sub.submoduleId ===
                                                    s.submoduleId
                                                      ? {
                                                          ...sub,
                                                          items: reorderItems(
                                                            sub.items,
                                                            dragItem.index,
                                                            index
                                                          ),
                                                        }
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
                                  {it.type === "video" && (
                                    <Video
                                      size={12}
                                      className="text-blue-500"
                                    />
                                  )}
                                  {it.type === "quiz" && (
                                    <FileQuestion
                                      size={12}
                                      className="text-orange-500"
                                    />
                                  )}
                                  {it.type === "pdf" && (
                                    <FileText
                                      size={12}
                                      className="text-emerald-500"
                                    />
                                  )}

                                  {editingItemKey === itemKey ? (
                                    <input
                                      value={it.name}
                                      onChange={(e) =>
                                        updateItemName(
                                          m.moduleId,
                                          s.submoduleId,
                                          it,
                                          e.target.value
                                        )
                                      }
                                      onBlur={() => setEditingItemKey(null)}
                                      onKeyDown={(e) =>
                                        e.key === "Enter" &&
                                        setEditingItemKey(null)
                                      }
                                      className="max-w-37.5 outline-none bg-transparent"
                                      autoFocus
                                    />
                                  ) : (
                                    <span
                                      className="max-w-37.5 truncate"
                                      onDoubleClick={() =>
                                        setEditingItemKey(itemKey)
                                      }
                                    >
                                      {it.name}
                                    </span>
                                  )}

                                  <button
                                    onClick={() =>
                                      deleteItem(m.moduleId, s.submoduleId, it)
                                    }
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

          {/* Live Recording Session Tab */}
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
                <p className="text-sm text-slate-400 italic">No modules yet. Add a module to start creating live recording sessions.</p>
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
                          onClick={() => {
                            setSelectedLiveModuleId(mod.moduleId);
                            resetLiveSessionForm();
                          }}
                          className={`w-full text-left rounded-3xl border p-4 transition-all ${
                            selected
                              ? "border-indigo-500 bg-indigo-50 shadow-sm"
                              : "border-slate-200 bg-white hover:border-indigo-200"
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
                        <p className="text-sm font-semibold">Select a module to add or edit live recording URLs.</p>
                        <p className="text-sm text-slate-400 mt-2">The session list appears here as soon as you select a module.</p>
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
                            onClick={() => {
                              setShowLiveSessionForm(true);
                              setEditingLiveSessionId(null);
                              setLiveSessionTitle("");
                              setLiveSessionUrl("");
                            }}
                            className="text-sm bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-xl transition-all"
                          >
                            + Add Session
                          </button>
                        </div>

                        <div className="space-y-3">
                          {(selectedLiveModule.liveSessions || []).length === 0 ? (
                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                              No live recording sessions added yet for this module.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {(selectedLiveModule.liveSessions || []).map((session: any) => (
                                <div
                                  key={session.id}
                                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                                >
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                      <p className="font-semibold text-slate-900 truncate">{session.title || "Untitled session"}</p>
                                      <a
                                        href={session.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs text-indigo-600 hover:text-indigo-800 wrap-break-word"
                                      >
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
                              ))}
                            </div>
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
            disabled={savingCourse}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-95"
          >
            {savingCourse ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {savingCourse ? "Saving..." : "Save Changes"}
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
