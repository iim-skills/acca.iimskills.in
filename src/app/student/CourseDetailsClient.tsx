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
  const slug = search?.get("slug") ?? "";

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/student/course");
        if (!res.ok) throw new Error(`Failed to load courses (${res.status})`);

        const data = await res.json();

        // normalize array
        const list: any[] = Array.isArray(data) ? data : [data];

        // pick by slug if provided, otherwise first
        const found =
          (slug &&
            list.find(
              (c) =>
                String(c.slug ?? "")
                  .trim()
                  .toLowerCase() === slug.trim().toLowerCase()
            )) ||
          list[0] ||
          null;

        if (mounted) setCourse(found);
      } catch (err: any) {
        console.error("Course fetch error:", err);
        if (mounted) setError(err?.message ?? "Failed to fetch");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Loading course details...
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
    <div className="p-0">
      <CourseModules
        course={course}
        onPlayVideo={onPlayVideo}
      />
    </div>
  );
}
