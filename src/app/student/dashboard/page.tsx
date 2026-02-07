"use client";

import React, { useEffect, useState } from "react";
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
  const [activeVideoIndex, setActiveVideoIndex] = useState<number | null>(null);
 
  

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

    // local path (starts with /) — return as-is
    if (url.startsWith("/")) return url;

    // absolute mp4/webm/ogg
    if (url.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) return url;

    // attempt youtube parsing
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
      // if URL constructor fails, return the string (may be relative)
      return url;
    }

    // fallback: return original
    return url;
  };

  function toEmbedUrl(url?: string | null): string | null {
  if (!url) return null;

  try {
    const u = new URL(url);
    const host = u.hostname.replace("www.", "");

    // YouTube long URL
    if (host.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }

    // YouTube short URL
    if (host.includes("youtu.be")) {
      const id = u.pathname.slice(1);
      if (id) return `https://www.youtube.com/embed/${id}`;
    }

    // Vimeo
    if (host.includes("vimeo.com")) {
      const id = u.pathname.split("/").pop();
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    // not a valid URL → probably mp4 or local file
  }

  // mp4 / webm / already-embed → return as-is
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

    // allow only student sessions here
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

    const selected = list[0]; // ✅ FORCE FIRST COURSE

    console.log("🎯 Selected course:", selected);
    console.log("🧩 Modules:", selected.modules);

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
  }, [courseSlug, /* studentModulesRaw intentionally not included to avoid extra fetch loops */]);

  /* ---------- RENDER / GUARDS ---------- */
  if (loadingStudent || loadingCourse) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  // explicit guard: after loading is finished, if student is still null -> session expired
  if (student === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-slate-500">Session expired. Please login again.</div>
      </div>
    );
  }

  // now TypeScript knows `student` is non-null below this point
  const studentModuleIds = parseStudentModules(student.modules);

  // --- new: total modules count (safe)
  const totalModules = Array.isArray(course?.modules) ? course!.modules!.length : 0;

  /* ---------- HANDLERS ---------- */
  const handleModuleClick = (module: Module) => {
    const idRaw = module.moduleId ?? module.slug ?? module.name;
    const id = idRaw ? String(idRaw) : null;
    if (!id) return;

    const isActive = studentModuleIds.includes(id);
    if (!isActive) return;

    setActiveModuleId(id);

    // try moduleVideo first, otherwise first submodule's first video
    const video =
      module.moduleVideo ??
      module.submodules?.[0]?.videos?.[0]?.url ??
      null;

    setActiveVideoUrl(toPlayableUrl(video ?? null));
    setActiveSubmoduleTitle(module.submodules?.[0]?.title ?? null);
  };

  const handleSubmoduleClick = (module: Module, sub: Submodule) => {
    const moduleIdRaw = module.moduleId ?? module.slug ?? module.name;
    const moduleId = moduleIdRaw ? String(moduleIdRaw) : null;
    if (!moduleId) return;

    const isActive = studentModuleIds.includes(moduleId);
    if (!isActive) return;

    setActiveModuleId(moduleId);

    // choose first video from sub.videos
    const videoUrl = sub.videos?.[0]?.url ?? null;

    setActiveVideoUrl(toPlayableUrl(videoUrl ?? null));
    setActiveSubmoduleTitle(sub.title ?? null);
  };

  /* ---------- UI ---------- */
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* HERO */}
      <div className="max-w-6xl mx-auto mb-8 bg-gradient-to-r from-indigo-600 to-indigo-400 text-white rounded-3xl shadow-lg overflow-hidden">
        <div className="p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
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
  onPlayVideo={(url, title, moduleId, idx) => {
    setActiveVideoUrl(toEmbedUrl(url));
    setActiveSubmoduleTitle(title ?? null);
    setActiveModuleId(moduleId ?? null);
    setActiveVideoIndex(idx ?? null);
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
                activeVideoUrl.includes("youtube.com/embed") ? (
                  <iframe
                    src={activeVideoUrl}
                    title={activeSubmoduleTitle ?? activeModuleId ?? "Video"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                ) : activeVideoUrl.match(/\.(mp4|webm|ogg)(\?.*)?$/i) ? (
                  <video controls className="w-full h-full">
                    <source src={activeVideoUrl} />
                    Your browser does not support the video tag.
                  </video>
                ) : (
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
                        const isActive = studentModuleIds.includes(moduleId);
                        return (
                          <div key={s.submoduleId ?? s.title} className={`w-full`}>
                            <button
                              onClick={() => handleSubmoduleClick(mod, s)}
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
                      const isActive = studentModuleIds.includes(id);
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
