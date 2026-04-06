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

  const [dragItem, setDragItem] = useState<{
    moduleId: string;
    submoduleId: string;
    index: number;
  } | null>(null);

  const [editingItemKey, setEditingItemKey] = useState<string | null>(null);

  useEffect(() => {
    setEditingCourse(course);
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
  };

  const updateModuleName = (moduleId: string, name: string) => {
    updateModules(
      editingCourse.courseData.modules.map((m) =>
        m.moduleId === moduleId ? { ...m, name } : m
      )
    );
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

  /* ================= SAVE ================= */

  const saveCourse = async () => {
    try {
      const res = await fetch("/api/admin/update-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCourse),
      });

      if (!res.ok) {
        throw new Error("Failed to save course");
      }

      onSaved();
      onClose();
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save course");
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

          <div className="space-y-4">
            {editingCourse.courseData.modules.map((m) => {
              const isOpen = openModules.includes(m.moduleId);

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

                  {/* SUBMODULES */}
                  {isOpen && (
                    <div className="p-4 bg-white space-y-4">
                      {m.submodules.length === 0 && (
                        <p className="text-center text-sm text-slate-400 py-2 italic">
                          No submodules yet
                        </p>
                      )}

                      {m.submodules.map((s) => (
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
                                      className="max-w-[150px] outline-none bg-transparent"
                                      autoFocus
                                    />
                                  ) : (
                                    <span
                                      className="max-w-[150px] truncate"
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