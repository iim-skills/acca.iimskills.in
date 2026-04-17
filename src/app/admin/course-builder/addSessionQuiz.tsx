"use client";

import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { X, Upload, Loader2, Video, FileQuestion, CheckCircle2 } from "lucide-react";

// ✅ SAME TYPE SOURCE
import { Course } from "./types/course";

/* ================= TYPES ================= */

type VideoData = {
  id: string | number;
  title: string;
};

type QuizData = {
  id: string | number;
  title: string;
};

type TargetType = {
  moduleId: string;
  submoduleId: string;
};

type VideoItem = {
  type: "video";
  sessionId: string;
  name: string;
  videoId?: string | number;
  videoTitle?: string;
  videoUrl?: string;
  thumbUrl?: string;
};

type QuizItem = {
  type: "quiz";
  quizRefId: string;
  name: string;
  quizId?: string | number;
};

type ItemType = VideoItem | QuizItem;

type Props = {
  isOpen: boolean;
  target: TargetType | null;
  editItem?: ItemType; // ✅ ADD THIS LINE
  editingCourse: Course;
  setEditingCourse: any;
  onClose: () => void;
};

export default function AddSessionQuiz({
  isOpen,
  target,
  editItem, // ✅ ADD THIS
  editingCourse,
  setEditingCourse,
  onClose,
}: Props) {
  const [type, setType] = useState<"Session Recording" | "Quiz">("Session Recording");
  const [name, setName] = useState("");
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [quizzes, setQuizzes] = useState<QuizData[]>([]);
  const [selected, setSelected] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  /* ================= LOAD ================= */
  useEffect(() => {
    if (!isOpen) return;

    fetch("/api/admin/videos")
      .then((r) => r.json())
      .then((d) => setVideos(Array.isArray(d) ? d : []));

    fetch("/api/admin/quizzes")
      .then((r) => r.json())
      .then((d) => setQuizzes(Array.isArray(d) ? d : []));
  }, [isOpen]);

  if (!isOpen) return null;

  /* ================= SAVE ================= */
  const save = async () => {
    if (!target) return;
    if (!name.trim()) return alert("Please enter a name for this content.");

    setLoading(true);

    try {
      let videoId: any = selected;
      let videoTitle = "";
      let videoUrl = "";
      let thumbUrl = "";

      /* ========= UPLOAD NEW VIDEO ========= */
      if (type !== "Quiz" && file) {
        const form = new FormData();
        form.append("file", file);

        const res = await fetch("/api/admin/videos/upload", {
          method: "POST",
          body: form,
        });

        const data = await res.json();
if (!res.ok) throw new Error(data?.error || "Upload failed");

videoId = data.file_name;   // ✅ FIX
videoUrl = data.url;        // ✅ FIX
thumbUrl = "";              // optional
videoTitle = name;

        /* ========= SAVE VIDEO TO DB ========= */
        await fetch("/api/admin/videos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: videoTitle,
            public_id: videoId,
            secure_url: videoUrl,
            thumb_url: thumbUrl,
          }),
        });
      }

      /* ========= EXISTING VIDEO ========= */
      if (type !== "Quiz" && selected && !file) {
        const selectedVideo = videos.find((v) => String(v.id) === selected);
        videoTitle = selectedVideo?.title || name;
        videoId = selected;
      }

      /* ========= UPDATE COURSE ========= */
      const modules = editingCourse.courseData.modules;
      const mIndex = modules.findIndex((m) => m.moduleId === target.moduleId);
      const sIndex = modules[mIndex].submodules.findIndex((s) => s.submoduleId === target.submoduleId);

      const newItem: ItemType = type === "Quiz"
        ? {
            type: "quiz",
            quizRefId: `QZ_${Date.now()}`,
            name,
            quizId: selected || undefined,
          }
        : {
            type: "video",
            sessionId: `SES_${Date.now()}`,
            name,
            videoId,
            videoTitle,
            videoUrl,
            thumbUrl,
          };

      const updatedModules = [...modules];
      updatedModules[mIndex].submodules[sIndex].items = [
        ...(updatedModules[mIndex].submodules[sIndex].items || []),
        newItem,
      ];

      setEditingCourse({
        ...editingCourse,
        courseData: { ...editingCourse.courseData, modules: updatedModules },
      });

      setName("");
      setSelected("");
      setFile(null);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error saving: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-800">Add Content</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* TYPE SWITCHER */}
          <div className="flex p-1.5 bg-slate-100 rounded-2xl">
            <button 
              onClick={() => { setType("Session Recording"); setSelected(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                type === "Session Recording" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Video size={16} /> Session
            </button>
            <button 
              onClick={() => { setType("Quiz"); setSelected(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                type === "Quiz" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <FileQuestion size={16} /> Quiz
            </button>
          </div>

          {/* NAME INPUT */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Content Title</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === "Quiz" ? "Enter quiz name" : "Enter session name"}
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-700 font-medium placeholder:text-slate-300"
            />
          </div>

          {/* SELECTION AREA */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                {type === "Quiz" ? "Select Existing Quiz" : "Link from Library"}
              </label>
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                disabled={!!file}
                className="w-full bg-white border border-slate-200 p-3 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-700 font-medium disabled:opacity-50 appearance-none"
              >
                <option value="">-- No existing selection --</option>
                {(type === "Quiz" ? quizzes : videos).map((item) => (
                  <option key={item.id} value={String(item.id)}>
                    {item.title}
                  </option>
                ))}
              </select>
            </div>

            {/* VIDEO UPLOAD DROPZONE */}
            {type === "Session Recording" && (
              <div className="relative">
                <div className="flex items-center gap-3 my-4">
                  <div className="h-px flex-1 bg-slate-100"></div>
                  <span className="text-[10px] text-slate-300 font-black tracking-tighter uppercase">OR</span>
                  <div className="h-px flex-1 bg-slate-100"></div>
                </div>
                
                <label className={`group flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 transition-all cursor-pointer ${
                  file ? "border-indigo-400 bg-indigo-50" : "border-slate-200 hover:border-indigo-300 bg-slate-50 hover:bg-white"
                }`}>
                  {file ? (
                    <CheckCircle2 size={32} className="text-indigo-500 animate-in zoom-in" />
                  ) : (
                    <Upload size={32} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                  )}
                  <span className="text-sm mt-3 font-bold text-slate-600 text-center px-4 line-clamp-1">
                    {file ? file.name : "Upload new video"}
                  </span>
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const selectedFile = e.target.files?.[0] || null;
                      setFile(selectedFile);
                      if (selectedFile) setSelected("");
                    }}
                  />
                </label>
                {file && (
                  <button 
                    onClick={() => setFile(null)}
                    className="absolute -top-1 -right-1 bg-white border border-slate-200 p-1 rounded-full shadow-sm hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
          <button 
            onClick={onClose} 
            disabled={loading}
            className="flex-1 py-3 px-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={save}
            disabled={loading || !name}
            className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:shadow-none active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Processing...
              </>
            ) : (
              "Save Content"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}