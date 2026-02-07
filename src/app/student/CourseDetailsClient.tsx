"use client";

import React, { useEffect, useState } from "react";
import CourseModules, { Course } from "./CourseModules";
import { useSearchParams } from "next/navigation";

type Props = {
  onPlayVideo: (videoUrl: string, title?: string) => void;
};

export default function CourseDetailsClient({
  onPlayVideo,
}: Props): React.ReactElement {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const search = useSearchParams();
  const slug = search?.get("slug")?.toLowerCase().trim() ?? "";

  useEffect(() => {
    let mounted = true;

    async function loadCourse() {
      setLoading(true);
      setError(null);

      try {
        console.log("➡️ Fetching course from API...");

        const res = await fetch("/api/student/course");
        console.log("✅ API response status:", res.status);

        const data = await res.json();
        console.log("📦 RAW API DATA:", data);

        const list: Course[] = Array.isArray(data) ? data : [];
        console.log("📚 COURSE LIST (array):", list);

        if (!list.length) {
          console.error("❌ Course list empty");
          throw new Error("No courses returned from API");
        }

        // pick by slug if provided, otherwise first course
        const selected = slug
          ? list.find(
              (c) =>
                String(c.slug ?? "")
                  .toLowerCase()
                  .trim() === slug
            )
          : list[0];

        console.log("🎯 Selected (by slug or first):", selected);
        console.log("🧩 Selected.modules:", selected?.modules);

        if (!selected) {
          throw new Error("Requested course not found");
        }

        if (mounted) setCourse(selected);
      } catch (err: any) {
        console.error("❌ Course fetch error:", err);
        if (mounted) setError(err?.message ?? "Failed to load course");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadCourse();
    return () => {
      mounted = false;
    };
  }, [slug]);

  /* ---------- UI ---------- */
  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Loading course details…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-sm text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <CourseModules
      course={course}
      onPlayVideo={onPlayVideo}
    />
  );
}
