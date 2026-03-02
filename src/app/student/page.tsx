// components/Students/StudentDashboardLMS.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import HeaderHero from "@/components/Students/HeaderHero";
import CourseModules from "@/components/Students/CourseModules";
import VideoPlayer from "@/components/Students/VideoPlayer";
import ModuleDetails from "@/components/Students/ModuleDetails";
import ModuleAccess from "@/components/Students/ModuleAccess";

import { Film } from "lucide-react";

import type { StudentAPIResp, CourseFile } from "@/components/Students/types";
import { parseStudentModules, toPlayableUrl, toEmbedUrl, preloadThumbnails } from "@/components/Students/utils";

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

  const [activeGlobalIndex, setActiveGlobalIndex] = useState<number | null>(null);
  const [resumeAt, setResumeAt] = useState<number>(0);
  const [autoplayFlag, setAutoplayFlag] = useState<boolean>(false);

  const lastSavedRef = useRef<number>(0);
  const lastProgressPayloadRef = useRef<Record<string, unknown> | null>(null);

  // ========== LOAD STUDENT (param-based) ==========
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

    if (parsed && parsed.ok && parsed.user) parsed = parsed.user;

    if (parsed.loginType !== "student" && parsed.role !== "student") {
      router.push("/");
      return;
    }

    async function fetchStudent() {
      setLoadingStudent(true);

      try {
        const raw = localStorage.getItem("user") ?? sessionStorage.getItem("user");
        if (!raw) throw new Error("User not found");

        const parsed = JSON.parse(raw);

        const studentId =
          parsed?.id ??
          parsed?.userId ??
          parsed?.studentId ??
          parsed?.user?.id ??
          null;

        if (!studentId) {
          console.error("Student ID missing in localStorage:", parsed);
          throw new Error("Missing student id");
        }

        console.log("[StudentDashboard] fetchStudent -> studentId:", studentId);

        // ✅ ALWAYS USE POST with studentId to avoid GET without params
        const res = await fetch("/api/student/me", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId }),
        });

        console.log("[StudentDashboard] /api/student/me POST status:", res.status);

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          console.error("[StudentDashboard] /api/student/me POST error text:", text);
          throw new Error("Failed to fetch student");
        }

        const json = await res.json();
        const data = json?.user ?? json;

        console.log("[StudentDashboard] student data received:", data);

        setStudent(data);

        if (data?.email) {
          localStorage.setItem("course_user_key", data.email.toLowerCase());
        }

      } catch (err) {
        console.error("Student fetch error:", err);
        localStorage.removeItem("user");
        sessionStorage.removeItem("user");
        router.push("/");
      } finally {
        setLoadingStudent(false);
      }
    }

    fetchStudent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const courseSlug: string = student?.courseSlug ?? "";

  // ========== LOAD COURSE JSON WHEN courseSlug AVAILABLE ========== //
  useEffect(() => {
    if (!courseSlug) {
      setCourse(null);
      return;
    }
    let ignore = false;

    async function fetchCourse() {
      setLoadingCourse(true);

      try {
        // prefer student id param (works even if other parts call GET incorrectly)
        const tryStudentId = student?.id ?? null;
        const tryEmail = student?.email ?? null;

        // Build primary URL (query param studentId) if available
        let primaryUrl = "/api/student/course";
        if (tryStudentId) primaryUrl = `/api/student/course?studentId=${encodeURIComponent(String(tryStudentId))}`;

        const headers: Record<string, string> = {};
        if (tryEmail) headers["x-user-email"] = tryEmail;

        console.log("[StudentDashboard] fetchCourse -> attempt url:", primaryUrl, "headers:", headers);

        // Primary attempt
        let res = await fetch(primaryUrl, { headers });

        console.log("[StudentDashboard] fetchCourse primary status:", res.status);

        // If primary fails and we have an alternate, try alternate strategies
        if (!res.ok) {
          // Try fallback: if primary used studentId query param and email exists, try GET without query but with email header
          if (tryStudentId && tryEmail) {
            const altUrl = "/api/student/course";
            console.warn("[StudentDashboard] fetchCourse primary failed; trying fallback with email header:", altUrl);
            res = await fetch(altUrl, { headers });
            console.log("[StudentDashboard] fetchCourse fallback(status):", res.status);
          }

          // If still not ok and we have studentId but didn't use it earlier, try using query param
          if (!res.ok && !tryStudentId && student?.id) {
            const alt2 = `/api/student/course?studentId=${encodeURIComponent(String(student.id))}`;
            console.warn("[StudentDashboard] fetchCourse trying second fallback with studentId:", alt2);
            res = await fetch(alt2, { headers });
            console.log("[StudentDashboard] fetchCourse fallback2(status):", res.status);
          }
        }

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          console.error("[StudentDashboard] fetchCourse final failure. status:", res.status, "text:", text);
          throw new Error("Course API failed");
        }

        // parse and validate
        const list = await res.json();
        console.log("[StudentDashboard] fetchCourse response body:", list);

        if (!Array.isArray(list) || !list.length) {
          // Still allow single-object response if your API returns object instead of array
          if (list && typeof list === "object" && list.courseSlug) {
            if (!ignore) setCourse(list as CourseFile);
          } else {
            throw new Error("No courses returned from course API");
          }
        } else {
          const selected = list[0];
          if (!ignore) setCourse(selected);
        }
      } catch (err) {
        console.error("[StudentDashboard] fetchCourse error:", err);
        if (!ignore) setCourse(null);
      } finally {
        if (!ignore) setLoadingCourse(false);
      }
    }

    fetchCourse();
    return () => {
      ignore = true;
    };
  }, [courseSlug, student?.id, student?.email]);

  // prefetch thumbnails
  useEffect(() => {
    if (!course?.modules) return;
    preloadThumbnails(course.modules);
  }, [course]);

  // ========== FLATTEN & INDEX VIDEOS ========== //
  const { flatVideos, urlToIndex } = useMemo(() => {
    const out: Array<{ id?: string; url?: string; moduleId?: string; submoduleId?: string; title?: string }> = [];
    const map = new Map<string, number>();
    if (!course?.modules) return { flatVideos: out, urlToIndex: map };
    for (let mi = 0; mi < course.modules.length; mi++) {
      const m = course.modules[mi];
      const submodules = m.submodules ?? [];
      for (let si = 0; si < submodules.length; si++) {
        const s = submodules[si];
        const vids = s.videos ?? [];
        for (let vi = 0; vi < vids.length; vi++) {
          const item = { id: vids[vi].id, url: vids[vi].url, moduleId: m.moduleId, submoduleId: s.submoduleId, title: vids[vi].title };
          const idx = out.length;
          out.push(item);
          if (item.url) {
            const key = String(item.url).replace(/\/+$/, "").trim();
            if (!map.has(key)) map.set(key, idx);
          }
        }
      }
    }
    return { flatVideos: out, urlToIndex: map };
  }, [course]);

  const findGlobalIndexByUrl = useCallback(
    (url?: string | null) => {
      if (!course || !url) return -1;
      const normalize = (u?: string | null) => (u ? u.replace(/\/+$/, "").trim() : "");
      const key = normalize(url);
      const direct = urlToIndex.get(key);
      if (typeof direct === "number") return direct;

      // fallback: linear endsWith match (rare)
      for (let i = 0; i < flatVideos.length; i++) {
        const a = flatVideos[i].url ?? "";
        if (a && (a.endsWith(url ?? "") || (url ?? "").endsWith(a))) return i;
      }
      return -1;
    },
    [course, flatVideos, urlToIndex]
  );

  // ========== PROGRESS REPORTING ========== //
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

  const reportProgress = useCallback(
    async (globalIndex: number, positionSeconds: number, completed?: boolean) => {
      try {
        if (!course?.courseId) {
          console.warn("[StudentDashboard] reportProgress called but course.courseId missing");
          return;
        }
        const userKey = getUserKey();

        const flat = flatVideos;
        let videoId: string | undefined;
        if (typeof globalIndex === "number" && globalIndex >= 0 && globalIndex < flat.length) {
          videoId = flat[globalIndex].id;
        }

        const payload: Record<string, unknown> = {
          userKey,
          courseId: course.courseId,
          positionSeconds,
          completed: Boolean(completed),
        };

        if (videoId) (payload as any).videoId = videoId;
        else (payload as any).globalIndex = globalIndex;

        lastProgressPayloadRef.current = payload;

        console.log("[StudentDashboard] reportProgress payload:", payload);

        await fetch("/api/courseApi/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.error("[StudentDashboard] reportProgress error", err);
      }
    },
    [course, flatVideos]
  );

  // flush on unload using sendBeacon if available
  useEffect(() => {
    const flushOnUnload = () => {
      const payload = lastProgressPayloadRef.current;
      if (!payload) return;
      try {
        const url = "/api/courseApi/progress";
        const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
        if (navigator.sendBeacon) {
          navigator.sendBeacon(url, blob);
        } else {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", url, false);
          xhr.setRequestHeader("Content-Type", "application/json");
          xhr.send(JSON.stringify(payload));
        }
      } catch (err) {
        // ignore
      }
    };

    window.addEventListener("beforeunload", flushOnUnload);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushOnUnload();
    });

    return () => {
      window.removeEventListener("beforeunload", flushOnUnload);
    };
  }, []);

  // time update handler
  const dashboardHandleTimeUpdate = (positionSeconds: number) => {
    if (activeGlobalIndex === null) return;
    const now = Math.floor(positionSeconds || 0);
    if (Math.abs(now - lastSavedRef.current) >= 5) {
      lastSavedRef.current = now;
      reportProgress(activeGlobalIndex, now, false);
    }
  };

  const dashboardHandleEnded = async (durationSeconds?: number) => {
    if (activeGlobalIndex === null) return;
    const dur = Math.floor(durationSeconds ?? 0);
    await reportProgress(activeGlobalIndex, dur, true);
    const ev = new CustomEvent("lms_video_completed", { detail: { globalIndex: activeGlobalIndex } });
    window.dispatchEvent(ev);
  };

  useEffect(() => {
    lastSavedRef.current = 0;
  }, [activeGlobalIndex]);

  // keyboard shortcuts: disable space default
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ---------- onPlayVideoInternal ---------- */
  const onPlayVideoInternal = useCallback(
    (videoUrl: string | null, title?: string, moduleId?: string | number, videoIndex?: number, options?: { resumeSeconds?: number; autoplay?: boolean }) => {
      try {
        const playable = toPlayableUrl(videoUrl);
        setActiveSubmoduleTitle(title ?? null);
        if (moduleId !== undefined && moduleId !== null) setActiveModuleId(String(moduleId));
        setActiveVideoUrl(playable);
        setResumeAt(options?.resumeSeconds ?? 0);
        setAutoplayFlag(Boolean(options?.autoplay));

        const gIdx = findGlobalIndexByUrl(videoUrl);
        setActiveGlobalIndex(gIdx >= 0 ? gIdx : null);

        setTimeout(() => {
          try {
            window.dispatchEvent(new CustomEvent("lms_request_play"));
          } catch {
            // ignore
          }
        }, 200);
      } catch (err) {
        // ignore
      }
    },
    [findGlobalIndexByUrl]
  );

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

  const currentVideoId =
    activeGlobalIndex !== null && typeof activeGlobalIndex === "number" && flatVideos[activeGlobalIndex]
      ? flatVideos[activeGlobalIndex].id
      : undefined;

  const safeUserKey: string = getUserKey();
  const safeCourseId: string | null = course?.courseId ?? null;
  const safeVideoId: string | number | null =
    activeGlobalIndex !== null && flatVideos[activeGlobalIndex] && flatVideos[activeGlobalIndex].id
      ? (flatVideos[activeGlobalIndex].id as string | number)
      : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <HeaderHero student={student} course={course} />

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6 px-4">
        <aside className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow p-4 sticky top-6">
            <h3 className="font-semibold mb-3">All Modules</h3>
            <div className="space-y-3 min-h-[70vh] overflow-y-auto pr-2">
              <CourseModules
                course={course}
                allowedModules={studentModuleIds}
                progress={student.progress ?? {}}
                onPlayVideo={onPlayVideoInternal}
                onReportPlayerProgress={(globalIndex, positionSeconds, completed) => {
                  reportProgress(globalIndex, positionSeconds, completed);
                }}
              />
            </div>
          </div>
        </aside>

        <section className="lg:col-span-3">
          <h1 className="text-2xl font-bold mb-4">Course details</h1>
          <div className="bg-white rounded-2xl shadow p-4">
            <div className="w-full aspect-video bg-black rounded-xl overflow-hidden mb-4 flex items-center justify-center">
              {activeVideoUrl ? (
                // embed handling for youtube/vimeo
                activeVideoUrl.includes("youtube.com/embed") || activeVideoUrl.includes("player.vimeo.com") ? (
                  <iframe
                    src={activeVideoUrl}
                    title={activeSubmoduleTitle ?? activeModuleId ?? "Video"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                ) : activeVideoUrl.match(/\.(mp4|webm|ogg)(\?.*)?$/i) && safeCourseId && safeVideoId ? (
                  <VideoPlayer
                    userKey={safeUserKey}
                    courseId={safeCourseId}
                    videoId={safeVideoId}
                    src={activeVideoUrl}
                    resumeAt={resumeAt}
                    autoplay={autoplayFlag}
                    onProgress={(posSeconds, completed) => {
                      if (activeGlobalIndex !== null) {
                        dashboardHandleTimeUpdate(posSeconds);
                        if (completed) dashboardHandleEnded(posSeconds);
                      }
                    }}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="text-white text-sm">
                    {activeVideoUrl ? "Loading video..." : "Select a video to start learning"}
                  </div>
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
                <ModuleDetails
                  course={course}
                  student={student}
                  activeModuleId={activeModuleId}
                  activeSubmoduleTitle={activeSubmoduleTitle}
                  setActiveModuleId={setActiveModuleId}
                  setActiveVideoUrl={setActiveVideoUrl}
                  setActiveSubmoduleTitle={setActiveSubmoduleTitle}
                  findGlobalIndexByUrl={findGlobalIndexByUrl}
                  setActiveGlobalIndex={setActiveGlobalIndex}
                />
              </div>

              <aside className="w-full md:w-64">
                <ModuleAccess course={course} student={student} />
              </aside>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}