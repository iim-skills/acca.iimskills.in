"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import CourseModules from "../CourseModules";
import {
  User,
  Mail,
  Phone,
  BookOpen,
  LogOut,
  Play,
  Lock,
  Film,
  List,
} from "lucide-react";

/* ================= TYPES ================= */
type StudentAPIResp = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  courseSlug?: string;
  courseTitle?: string;
  modules?: string[] | string;
  progress: Record<string, number[]>; // DB may store array, JSON-string or CSV-string
};

type VideoItem = {
  id?: string;
  title?: string;
  url?: string;
};

type Submodule = {
  submoduleId?: string;
  title?: string;
  description?: string;
  videos?: VideoItem[]; // updated shape
};

type Module = {
  moduleId?: string;
  slug?: string;
  name?: string;
  description?: string;
  moduleVideo?: string;
  submodules?: Submodule[];
};

type CourseFile = {
  courseId?: string;
  slug?: string;
  name?: string;
  description?: string;
  modules?: Module[];
};

/* =============== COMPONENT ================= */
export default function StudentDashboardLMS(): React.ReactElement {
  const router = useRouter();

  const [student, setStudent] = useState<StudentAPIResp | null>(null);
  const [loadingStudent, setLoadingStudent] = useState<boolean>(true);

  const [course, setCourse] = useState<CourseFile | null>(null);
  const [loadingCourse, setLoadingCourse] = useState<boolean>(false);

  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [activeSubmoduleTitle, setActiveSubmoduleTitle] = useState<string | null>(null);

  // global index of the currently playing video (flattened index)
  const [activeGlobalIndex, setActiveGlobalIndex] = useState<number | null>(null);

  // resume time (seconds) and autoplay flag when starting a video
  const [resumeAt, setResumeAt] = useState<number>(0);
  const [autoplayFlag, setAutoplayFlag] = useState<boolean>(false);

  // video element refs & tracking
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastSavedRef = useRef<number>(0);

  // --- helpers ---
  const parseStudentModules = (s: any): string[] => {
    if (!s) return [];
    if (Array.isArray(s)) return s as string[];
    if (typeof s === "string") {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // fallback: comma separated list
        return s.split(",").map((x: string) => x.trim()).filter(Boolean);
      }
    }
    return [];
  };

  // Convert incoming URL to playable form (local mp4, absolute mp4, or youtube embed)
  const toPlayableUrl = (url?: string | null): string | null => {
    if (!url) return null;
    if (url.startsWith("/")) return url;
    if (url.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) return url;
    try {
      const u = new URL(url);
      const host = u.hostname.replace("www.", "");
      if (host.includes("youtube.com")) {
        const v = u.searchParams.get("v");
        if (v) return `https://www.youtube.com/embed/${v}`;
      }
      if (host.includes("youtu.be")) {
        const id = u.pathname.slice(1);
        if (id) return `https://www.youtube.com/embed/${id}`;
      }
    } catch {
      return url;
    }
    return url;
  };

  function toEmbedUrl(url?: string | null): string | null {
    if (!url) return null;
    try {
      const u = new URL(url);
      const host = u.hostname.replace("www.", "");
      if (host.includes("youtube.com")) {
        const v = u.searchParams.get("v");
        if (v) return `https://www.youtube.com/embed/${v}`;
      }
      if (host.includes("youtu.be")) {
        const id = u.pathname.slice(1);
        if (id) return `https://www.youtube.com/embed/${id}`;
      }
      if (host.includes("vimeo.com")) {
        const id = u.pathname.split("/").pop();
        if (id) return `https://player.vimeo.com/video/${id}`;
      }
    } catch {
      // not a valid URL → probably mp4 or local file
    }
    return url;
  }

  /* ---------- LOAD STUDENT ---------- */
  useEffect(() => {
    const raw = localStorage.getItem("user") ?? sessionStorage.getItem("user");
    if (!raw) {
      router.push("/");
      return;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
      router.push("/");
      return;
    }

    if (parsed.loginType !== "student" && parsed.role !== "student") {
      router.push("/");
      return;
    }

    async function fetchStudent() {
      setLoadingStudent(true);
      try {
        const res = await fetch("/api/student/me", {
          headers: { "x-user-email": parsed.email },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch student data");
        }

        const data: StudentAPIResp = await res.json();
        setStudent(data);
      } catch (err) {
        console.error("Failed to load student", err);
        localStorage.removeItem("user");
        sessionStorage.removeItem("user");
        router.push("/");
      } finally {
        setLoadingStudent(false);
      }
    }

    fetchStudent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // derive safe values for hooks to depend on (avoids using 'student' directly in dependencies)
  const courseSlug: string = student?.courseSlug ?? "";
  const studentModulesRaw = student?.modules;

  /* ---------- LOAD COURSE JSON WHEN courseSlug AVAILABLE ---------- */
  useEffect(() => {
    if (!courseSlug) {
      setCourse(null);
      return;
    }

    async function fetchCourse() {
      setLoadingCourse(true);

      try {
        const res = await fetch("/api/student/course");
        if (!res.ok) throw new Error("Course API failed");

        const list = await res.json();
        console.log("📚 Courses from API:", list);

        if (!Array.isArray(list) || !list.length) {
          throw new Error("No courses returned");
        }

        const selected = list[0]; // FORCE FIRST COURSE for now
        console.log("🎯 Selected course:", selected);
        setCourse(selected);
      } catch (err) {
        console.error("❌ Failed to load course:", err);
        setCourse(null);
      } finally {
        setLoadingCourse(false);
      }
    }

    fetchCourse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseSlug]);

  /* ---------- PLAY / PROGRESS HELPERS ---------- */

  // Flatten course videos to compute globalIndex by url
  const flattenVideosForIndex = useCallback(() => {
    const out: Array<{ url?: string; moduleId?: string; submoduleId?: string; title?: string }> = [];
    if (!course?.modules) return out;
    for (let mi = 0; mi < course.modules.length; mi++) {
      const m = course.modules[mi];
      const submodules = m.submodules ?? [];
      for (let si = 0; si < submodules.length; si++) {
        const s = submodules[si];
        const vids = s.videos ?? [];
        for (let vi = 0; vi < vids.length; vi++) {
          out.push({ url: vids[vi].url, moduleId: m.moduleId, submoduleId: s.submoduleId, title: vids[vi].title });
        }
      }
    }
    return out;
  }, [course]);

  const findGlobalIndexByUrl = useCallback(
    (url?: string | null) => {
      if (!course || !url) return -1;
      const flat = flattenVideosForIndex();
      // compare raw strings; allow trailing slashes or query differences by simple normalization
      const normalize = (u?: string | null) => (u ? u.replace(/\/+$/, "").trim() : "");
      const target = normalize(url);
      for (let i = 0; i < flat.length; i++) {
        if (normalize(flat[i].url) === target) return i;
      }
      // fallback: try matching endsWith (sometimes with signed urls)
      for (let i = 0; i < flat.length; i++) {
        if (flat[i].url && url && (flat[i].url as string).endsWith(url) || (url as string).endsWith(flat[i].url || "")) {
          return i;
        }
      }
      return -1;
    },
    [course, flattenVideosForIndex]
  );

  // ensure userKey in localStorage
  const getUserKey = (): string => {
    try {
      let k = localStorage.getItem("course_user_key");
      if (!k) {
        k = crypto.randomUUID();
        localStorage.setItem("course_user_key", k);
      }
      return k;
    } catch {
      return "guest-" + Date.now();
    }
  };

  // Report progress to server (guest flow)
  const reportProgress = useCallback(
    async (globalIndex: number, positionSeconds: number, completed?: boolean) => {
      try {
        if (!course?.courseId) return;
        const userKey = getUserKey();
        console.log("[StudentDashboard] reportProgress ->", { globalIndex, positionSeconds, completed, userKey, courseId: course.courseId });
        await fetch("/api/course_progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userKey,
            courseId: course.courseId,
            globalIndex,
            positionSeconds,
            completed: Boolean(completed),
          }),
        });
      } catch (err) {
        console.error("[StudentDashboard] reportProgress error", err);
      }
    },
    [course]
  );

  // Called by CourseModules when user clicks a video
  const onPlayVideo = useCallback(
    (videoUrl: string, title?: string, moduleId?: string, videoIndex?: number, options?: { resumeSeconds?: number; autoplay?: boolean }) => {
      console.log("[StudentDashboard] onPlayVideo called", { videoUrl, moduleId, videoIndex, options });
      if (!videoUrl) return;

      // prefer embed URL for iframes (YouTube/Vimeo), otherwise use playable
      const embed = toEmbedUrl(videoUrl);
      const playable = toPlayableUrl(videoUrl);

      // compute global index by matching URL in course
      const gIndex = findGlobalIndexByUrl(videoUrl);
      setActiveGlobalIndex(gIndex >= 0 ? gIndex : null);

      // set resume/autoplay flags (CourseModules will pass resumeSeconds if available)
      setResumeAt(options?.resumeSeconds ?? 0);
      setAutoplayFlag(Boolean(options?.autoplay));

      // set active video URL to embed (iframe) or playable (video tag)
      // prefer embed for youtube/vimeo, otherwise playable (mp4)
      if (embed && (embed.includes("youtube.com") || embed.includes("player.vimeo.com"))) {
        setActiveVideoUrl(embed);
      } else {
        setActiveVideoUrl(playable);
      }

      // store which module is active (moduleId)
      setActiveModuleId(moduleId ?? null);
      setActiveSubmoduleTitle(title ?? null);
    },
    [findGlobalIndexByUrl]
  );

  /* ---------- NATIVE VIDEO EVENT HANDLERS ---------- */

  // set resumeAt when video loads and optionally autoplay
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    // set resume when src changes
    try {
      // reset lastSaved to avoid immediate double save
      lastSavedRef.current = 0;
      if (resumeAt && resumeAt > 1) {
        // clamp to duration after metadata loads
        const onLoaded = () => {
          try {
            el.currentTime = Math.min(resumeAt, Math.floor(el.duration || resumeAt));
            if (autoplayFlag) {
              el.play().catch((e) => console.warn("[StudentDashboard] autoplay blocked", e));
            }
          } catch (err) {
            // ignore
          }
        };
        el.addEventListener("loadedmetadata", onLoaded, { once: true });
        // clean
        return () => el.removeEventListener("loadedmetadata", onLoaded);
      } else {
        if (autoplayFlag) {
          el.play().catch((e) => console.warn("[StudentDashboard] autoplay blocked", e));
        }
      }
    } catch {
      // ignore
    }
  }, [activeVideoUrl, resumeAt, autoplayFlag]);

  // timeupdate -> throttle saves roughly every 5 seconds
  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const el = e.currentTarget;
    const now = Math.floor(el.currentTime || 0);
    if (activeGlobalIndex === null) return;
    if (Math.abs(now - lastSavedRef.current) >= 5) {
      lastSavedRef.current = now;
      console.log("[StudentDashboard] timeupdate report", { globalIndex: activeGlobalIndex, now });
      reportProgress(activeGlobalIndex, now, false);
    }
  };

  // on ended -> save final progress & dispatch completion event
  const handleEnded = async () => {
    if (activeGlobalIndex === null) return;
    const dur = Math.floor(videoRef.current?.duration || 0);
    console.log("[StudentDashboard] video ended", { globalIndex: activeGlobalIndex, dur });
    // final save as completed
    await reportProgress(activeGlobalIndex, dur, true);

    // dispatch custom event so CourseModules can react (auto-play next)
    const ev = new CustomEvent("lms_video_completed", { detail: { globalIndex: activeGlobalIndex } });
    window.dispatchEvent(ev);
  };

  // For robustness: if user selects a new mp4 while an old one is playing, reset flags
  useEffect(() => {
    lastSavedRef.current = 0;
  }, [activeGlobalIndex]);

  /* ---------- RENDER / GUARDS ---------- */
  if (loadingStudent || loadingCourse) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  if (student === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-slate-500">Session expired. Please login again.</div>
      </div>
    );
  }

  const studentModuleIds = parseStudentModules(student.modules);
  const totalModules = Array.isArray(course?.modules) ? course!.modules!.length : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HERO */}
      <div className="max-w-full mx-auto mb-8 bg-gradient-to-r from-indigo-600 to-indigo-400 text-white shadow-lg overflow-hidden">
        <div className="max-w-7xl  mx-auto p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 rounded-full p-4">
              <User size={36} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{student.name}</h1>
              <div className="flex items-center gap-3">
                <p className="text-sm md:text-base opacity-90">{student.courseTitle ?? "Your Course"}</p>
                <span className="text-xs bg-white/10 px-2 py-1 rounded-full">{totalModules} modules</span>
              </div>
              <div className="mt-2 text-sm flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Mail size={14} /> <span className="text-sm">{student.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} /> <span className="text-sm">{student.phone ?? "—"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                localStorage.removeItem("user");
                router.push("/");
              }}
              className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl flex items-center gap-2"
            >
              <LogOut size={16} /> Logout
            </button>
            <div className="hidden md:flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
                <BookOpen size={16} /> {course?.name ?? "Course"}
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
                <List size={16} /> {course?.modules?.length ?? 0} modules
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT: Modules list */}
        <aside className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow p-4 sticky top-6">
            <h3 className="font-semibold mb-3">All Modules</h3>

            <div className="space-y-3 min-h-[70vh] overflow-y-auto pr-2">
              <CourseModules
                course={course}
                allowedModules={studentModuleIds}
                progress={student.progress ?? {}}
                onPlayVideo={onPlayVideo}
                onReportPlayerProgress={(globalIndex, positionSeconds, completed) => {
                  // parent reportProgress used by CourseModules when it wants to save
                  reportProgress(globalIndex, positionSeconds, completed);
                }}
              />
            </div>
          </div>
        </aside>

        {/* RIGHT: Video player & module detail */}
        <section className="lg:col-span-3">
          <h1 className="text-2xl font-bold mb-4">Course details</h1>

          <div className="bg-white rounded-2xl shadow p-4">
            <div className="w-full aspect-video bg-black rounded-xl overflow-hidden mb-4 flex items-center justify-center">
              {activeVideoUrl ? (
                // embed iframe (youtube/vimeo) or native video
                activeVideoUrl.includes("youtube.com/embed") || activeVideoUrl.includes("player.vimeo.com") ? (
                  <iframe
                    src={activeVideoUrl}
                    title={activeSubmoduleTitle ?? activeModuleId ?? "Video"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                ) : activeVideoUrl.match(/\.(mp4|webm|ogg)(\?.*)?$/i) ? (
                  <video
                    ref={videoRef}
                    controls
                    className="w-full h-full"
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleEnded}
                  >
                    <source src={activeVideoUrl} />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  // fallback embed (if some other embed URL)
                  <iframe src={activeVideoUrl} title="Video" className="w-full h-full" />
                )
              ) : (
                <div className="text-center text-slate-400">
                  <Film size={36} className="mx-auto mb-2" />
                  <div className="text-sm">Select an accessible module to play its video</div>
                </div>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">
                  {(() => {
                    const mod = course?.modules?.find((m) => {
                      const idRaw = m.moduleId ?? m.slug ?? m.name;
                      return idRaw ? String(idRaw) === activeModuleId : false;
                    });
                    return mod ? mod.name : "Module details";
                  })()}
                </h3>
                <p className="text-sm text-slate-600 mb-3">
                  {(() => {
                    const mod = course?.modules?.find((m) => {
                      const idRaw = m.moduleId ?? m.slug ?? m.name;
                      return idRaw ? String(idRaw) === activeModuleId : false;
                    });
                    return mod ? mod.description : "Select a module on the left to view details and play videos.";
                  })()}
                </p>

                <div className="mt-4">
                  <h4 className="text-sm font-semibold mb-2">Submodules</h4>
                  <div className="space-y-2">
                    {(() => {
                      const mod = course?.modules?.find((m) => {
                        const idRaw = m.moduleId ?? m.slug ?? m.name;
                        return idRaw ? String(idRaw) === activeModuleId : false;
                      });
                      if (!mod?.submodules?.length) {
                        return <div className="text-sm text-slate-500">No submodules listed.</div>;
                      }
                      return mod.submodules.map((s) => {
                        const moduleIdRaw = mod.moduleId ?? mod.slug ?? mod.name;
                        const moduleId = moduleIdRaw ? String(moduleIdRaw) : "";
                        const isActive = parseStudentModules(student.modules).includes(moduleId);
                        return (
                          <div key={s.submoduleId ?? s.title} className={`w-full`}>
                            <button
                              onClick={() => {
                                // call CourseModules handler via DOM? better to update state and let CourseModules selection be independent
                                const moduleIdRaw2 = mod.moduleId ?? mod.slug ?? mod.name;
                                const moduleId2 = moduleIdRaw2 ? String(moduleIdRaw2) : "";
                                if (!isActive) return;
                                setActiveModuleId(moduleId2);
                                const firstVideo = s.videos?.[0]?.url ?? null;
                                setActiveVideoUrl(toPlayableUrl(firstVideo));
                                setActiveSubmoduleTitle(s.title ?? null);
                                // compute global index
                                const gIdx = findGlobalIndexByUrl(firstVideo);
                                setActiveGlobalIndex(gIdx >= 0 ? gIdx : null);
                              }}
                              className={`w-full text-left p-3 rounded-lg border ${isActive ? "hover:bg-indigo-50" : "opacity-60 cursor-not-allowed"}`}
                              disabled={!isActive}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium">{s.title}</div>
                                  <div className="text-xs text-slate-400">{s.description}</div>
                                </div>
                                <div className="ml-4">{isActive ? <Play size={16} /> : <Lock size={16} />}</div>
                              </div>
                            </button>

                            {/* show videos list under each submodule when it is the active submodule and has videos */}
                            {isActive && s.videos && s.videos.length > 0 && activeSubmoduleTitle === s.title && (
                              <div className="mt-2 space-y-1 ml-4">
                                {s.videos.map((v) => (
                                  <button
                                    key={v.id ?? v.title}
                                    onClick={() => {
                                      setActiveVideoUrl(toPlayableUrl(v.url ?? null));
                                      setActiveSubmoduleTitle(s.title ?? null);
                                      const gIdx = findGlobalIndexByUrl(v.url ?? null);
                                      setActiveGlobalIndex(gIdx >= 0 ? gIdx : null);
                                    }}
                                    className="text-sm text-indigo-600 hover:underline"
                                  >
                                    ▶ {v.title}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>

              <aside className="w-full md:w-64">
                <div className="bg-slate-50 rounded-lg p-3">
                  <h4 className="text-sm font-semibold mb-2">Module access</h4>
                  <div className="text-xs text-slate-500 mb-3">
                    Only modules assigned to you are playable. Locked modules are visible but inaccessible.
                  </div>

                  <div className="flex flex-col gap-2">
                    {course?.modules?.slice(0, 6).map((m) => {
                      const idRaw = m.moduleId ?? m.slug ?? m.name;
                      const id = idRaw ? String(idRaw) : "";
                      const isActive = parseStudentModules(student.modules).includes(id);
                      return (
                        <div key={String(id)} className="flex items-center justify-between text-sm">
                          <div className="truncate">{m.name}</div>
                          <div className={`text-xs font-semibold ${isActive ? "text-emerald-600" : "text-slate-400"}`}>
                            {isActive ? "Active" : "Locked"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
