"use client";

import React, { useEffect, useMemo, useState } from "react";
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

type MsgType = "success" | "error" | "";

type Video = {
  id?: string | number;
  _id?: string | number;
  name?: string;
  title?: string;
  uploaded_at?: string;
  uploadedAt?: string;
  created_at?: string;
  createdAt?: string;
  s3_url?: string;
  s3Url?: string;
  url?: string;
  secure_url?: string;
  thumb_url?: string;
  thumbUrl?: string;
  public_id?: string;
  duration?: number;
  size?: number;
  [k: string]: any;
};

type VPSUploadResponse = {
  url?: string;
  secure_url?: string;
  file_name?: string;
  size?: number;
  original_name?: string;
  mime_type?: string;
  thumb_url?: string;
};

const generateId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2);

function uploadVideoToVPS(
  file: File,
  onProgress?: (percent: number) => void
): Promise<VPSUploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("POST", "/api/admin/videos/upload", true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data);
        } else {
          reject(
            new Error(
              data?.error || data?.details || "Upload failed"
            )
          );
        }
      } catch {
        reject(new Error("Invalid server response"));
      }
    };

    xhr.onerror = () => reject(new Error("Network upload error"));

    const formData = new FormData();
    formData.append("file", file);

    xhr.send(formData);
  });
}

export default function VideoAdmin(): React.ReactElement {
  const [videos, setVideos] = useState<Video[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 12;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<{ text: string; type: MsgType }>({
    text: "",
    type: "",
  });

  const [videoName, setVideoName] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const res = await fetch("/api/admin/videos", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load videos");
      const data = await res.json();
      setVideos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("loadVideos:", err);
      setVideos([]);
    }
  };

  const showMsg = (text: string, type: MsgType = "error") => {
    setMessage({ text, type });
    if (type === "success") {
      setTimeout(() => setMessage({ text: "", type: "" }), 5000);
    }
  };

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

  const getVideoUrl = (v: Video) =>
    v?.secure_url ?? v?.s3_url ?? v?.s3Url ?? v?.url ?? v?.fileUrl ?? "#";

  const getThumbUrl = (v: Video) =>
    v?.thumb_url ?? v?.thumbUrl ?? "";

  const filteredVideos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return videos;
    return videos.filter((v) => {
      const name = (v?.name ?? v?.title ?? "").toString().toLowerCase();
      return name.includes(q);
    });
  }, [videos, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalItems = filteredVideos.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const pagedVideos = filteredVideos.slice(startIndex, endIndex);

  const handleUpload = async () => {
    if (!videoName.trim()) return showMsg("Provide a video name.");
    if (!file) return showMsg("Select a video file.");

    try {
      setUploading(true);
      setProgress(0);

      const uploadResult = await uploadVideoToVPS(file, setProgress);

      const secureUrl =
        uploadResult?.secure_url ?? uploadResult?.url ?? null;

      if (!secureUrl) {
        throw new Error("Upload response missing file URL");
      }

      const saveRes = await fetch("/api/admin/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: videoName.trim(),
          secure_url: secureUrl,
          url: secureUrl,
          thumb_url: uploadResult?.thumb_url ?? "",
          duration: null,
          size: uploadResult?.size ?? file.size,
          file_name: uploadResult?.file_name ?? file.name,
          original_name: uploadResult?.original_name ?? file.name,
          mime_type: uploadResult?.mime_type ?? file.type,
          uploaded_by: "admin",
        }),
      });

      if (!saveRes.ok) {
        let errorText = "Metadata save failed";
        try {
          const errData = await saveRes.json();
          errorText = errData?.error || errorText;
        } catch {}
        throw new Error(errorText);
      }

      showMsg("Video uploaded successfully!", "success");
      setVideoName("");
      setFile(null);
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
    if (!confirm("Are you sure you want to delete this video?")) return;
    try {
      const res = await fetch(
        `/api/admin/videos?id=${encodeURIComponent(String(id ?? ""))}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Delete failed");
      showMsg("Video deleted", "success");
      await loadVideos();
    } catch (err: unknown) {
      showMsg((err as Error)?.message ?? String(err));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b z-30">
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
        <div className="grid grid-cols-2 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="text-slate-500 text-[12px] md:text-sm font-medium mb-1 uppercase tracking-wider">
              Total Videos
            </div>
            <div className="text-3xl font-bold">{videos.length}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="text-slate-500 text-[12px] md:text-sm font-medium mb-1 uppercase tracking-wider">
              Recent Uploads
            </div>
            <div className="text-3xl font-bold">
              {videos.filter((v) => {
                const uploadedAt =
                  v?.uploaded_at ?? v?.uploadedAt ?? v?.created_at ?? v?.createdAt;
                if (!uploadedAt) return false;
                const date = new Date(uploadedAt);
                if (Number.isNaN(date.getTime())) return false;
                return date > new Date(Date.now() - 86400000 * 7);
              }).length}
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by video title..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {message.text && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 size={16} />
              ) : (
                <X size={16} />
              )}
              {message.text}
            </motion.div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {pagedVideos.length === 0 ? (
            <div className="p-20 text-center">
              <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Film size={32} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                No videos found
              </h3>
              <p className="text-slate-500">
                Upload your first video to see it in the gallery.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 p-5">
              {pagedVideos.map((v) => {
                const id = v?.id ?? v?._id ?? generateId();
                const name = v?.name ?? v?.title ?? "Untitled";
                const fileUrl = getVideoUrl(v);
                const thumbUrl = getThumbUrl(v);
                const uploadedAt =
                  v?.uploaded_at ?? v?.uploadedAt ?? v?.created_at ?? v?.createdAt;

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={String(id)}
                    className="group relative overflow-hidden rounded-2xl border bg-white shadow-sm"
                  >
                    <div className="relative aspect-video bg-slate-100 overflow-hidden">
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt={name}
                          className="h-full w-full object-cover"
                        />
                      ) : fileUrl !== "#" ? (
                        <video
                          src={fileUrl}
                          muted
                          playsInline
                          preload="metadata"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-slate-100 text-slate-400">
                          <PlayCircle size={44} />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/45 transition-all duration-300" />

                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <button
                          onClick={() =>
                            fileUrl !== "#" && window.open(fileUrl, "_blank")
                          }
                          className="rounded-full bg-white/95 p-3 shadow-md"
                        >
                          <PlayCircle className="w-6 h-6 text-gray-900" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeVideo(id)}
                        className="absolute top-3 right-3 rounded-full bg-white/95 p-2 shadow-md opacity-0 group-hover:opacity-100 transition"
                        title="Delete video"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>

                      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition">
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-4 text-white">
                          <p className="font-medium line-clamp-1">{name}</p>
                          <div className="flex items-center gap-1 text-xs text-white/80 mt-1">
                            <Clock size={12} />
                            {safeDate(uploadedAt)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 py-2">
                      <div className="mt-3 flex items-center justify-between">
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-blue-600 hover:underline inline-flex items-center gap-1"
                        >
                          <ExternalLink size={12} />
                          Open Video
                        </a>
                        <button
                          onClick={() => removeVideo(id)}
                          className="text-slate-400 hover:text-rose-600 transition"
                          title="Delete Video"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          <div className="px-6 py-4 flex items-center justify-between border-t bg-slate-50">
            <div className="text-sm text-slate-600">
              Showing {totalItems === 0 ? 0 : startIndex + 1} -{" "}
              {Math.min(totalItems, endIndex)} of {totalItems}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md text-sm font-semibold disabled:opacity-40 hover:bg-slate-100"
              >
                First
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md text-sm font-semibold disabled:opacity-40 hover:bg-slate-100"
              >
                Prev
              </button>

              <div className="inline-flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const page = idx + 1;
                  if (
                    totalPages > 7 &&
                    Math.abs(page - currentPage) > 3 &&
                    page !== 1 &&
                    page !== totalPages
                  ) {
                    return null;
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded-md text-sm font-semibold ${
                        currentPage === page
                          ? "bg-blue-600 text-white"
                          : "hover:bg-slate-100"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-md text-sm font-semibold disabled:opacity-40 hover:bg-slate-100"
              >
                Next
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-md text-sm font-semibold disabled:opacity-40 hover:bg-slate-100"
              >
                Last
              </button>
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !uploading && setIsDrawerOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-lg bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-lg">
                  <div className="text-blue-600 bg-blue-50 p-1.5 rounded">
                    <Upload size={20} />
                  </div>
                  New Video Upload
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  disabled={uploading}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-30"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Video Name
                  </label>
                  <input
                    value={videoName}
                    onChange={(e) => setVideoName(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                    placeholder="e.g. Masterclass Introduction"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Video File
                  </label>
                  <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50 hover:bg-slate-100 transition-colors group">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFile(e.target.files?.[0] || null)
                      }
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="text-center">
                      <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-slate-400 group-hover:text-blue-600 transition-colors">
                        <Upload size={24} />
                      </div>
                      {file ? (
                        <div className="text-sm font-bold text-slate-900 truncate px-4">
                          {file.name}
                          <div className="text-xs text-slate-500 font-normal mt-1">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            Click or drag video here
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            MP4, MOV, WEBM
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-slate-50">
                {uploading ? (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="flex items-center gap-2">
                        <Loader2
                          className="animate-spin text-blue-600"
                          size={18}
                        />
                        Uploading Content...
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsDrawerOpen(false)}
                      className="flex-1 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpload}
                      className="flex-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2"
                    >
                      Start Upload
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}

                {message.text && !uploading && (
                  <p
                    className={`mt-3 text-center text-xs font-bold ${
                      message.type === "error"
                        ? "text-rose-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {message.text}
                  </p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}