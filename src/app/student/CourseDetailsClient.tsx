"use client";

import React, { useEffect, useState } from "react";
import CourseModules, { Course } from "./CourseModules";
import { useSearchParams } from "next/navigation";

type Props = {
  onPlayVideo: (videoUrl: string, title?: string) => void;
};

export default function CourseDetailsClient({ onPlayVideo }: Props) {
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
        const res = await fetch("/api/student/course");
        const data = await res.json();

        const list: Course[] = Array.isArray(data) ? data : [];

        if (!list.length) throw new Error("No courses returned from API");

        const selected = slug
          ? list.find(
              (c) =>
                String(c.slug ?? "").toLowerCase().trim() === slug
            )
          : list[0];

        if (!selected) throw new Error("Requested course not found");

        if (mounted) setCourse(selected);
      } catch (err: any) {
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

  /* ---------- STATES ---------- */

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Loading course details…</div>;
  }

  if (error) {
    return <div className="p-6 text-sm text-red-500">Error: {error}</div>;
  }

  if (!course) {
    return <div className="p-6 text-sm text-gray-500">Course not found.</div>;
  }

  /* ---------- SAFE RENDER ---------- */

  return <CourseModules course={course} onPlayVideo={onPlayVideo} />;
}
