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
    async function loadCourse() {
      setLoading(true);
      setError(null);

      try {
        /* ================= GET STUDENT ID ================= */
        const rawUser =
          localStorage.getItem("user") ??
          sessionStorage.getItem("user");

        if (!rawUser) throw new Error("User not logged in");

        let parsed: any;
        try {
          parsed = JSON.parse(rawUser);
        } catch {
          throw new Error("Invalid user data");
        }

        const studentId =
          parsed?.id ??
          parsed?.studentId ??
          parsed?.user?.id ??
          parsed?.data?.id ??
          null;

        if (!studentId) {
          console.error("❌ studentId missing in storage:", parsed);
          throw new Error("Student ID missing");
        }

        console.log("🆔 Sending studentId:", studentId);

        /* ================= FETCH COURSE ================= */
        const res = await fetch(
          `/api/student/course?studentId=${encodeURIComponent(
            String(studentId)
          )}`
        );

        console.log("📡 Course API status:", res.status);

        if (!res.ok) {
          const text = await res.text();
          console.error("❌ Course API error text:", text);
          throw new Error("Failed to fetch course");
        }

        const data = await res.json();
        console.log("📦 Course API response:", data);

        // If your API returns single object
        let selected: Course | null = null;

        if (Array.isArray(data)) {
          if (!data.length) throw new Error("No courses returned from API");

          selected = slug
            ? data.find(
                (c) =>
                  String(c.slug ?? "")
                    .toLowerCase()
                    .trim() === slug
              ) ?? null
            : data[0];
        } else {
          selected = data;
        }

        if (!selected) throw new Error("Requested course not found");

        setCourse(selected);
      } catch (err: any) {
        console.error("❌ CourseDetailsClient error:", err);
        setError(err?.message ?? "Failed to load course");
      } finally {
        setLoading(false);
      }
    }

    loadCourse();
  }, [slug]);

  /* ---------- STATES ---------- */

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

  if (!course) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Course not found.
      </div>
    );
  }

  return <CourseModules course={course} onPlayVideo={onPlayVideo} />;
}