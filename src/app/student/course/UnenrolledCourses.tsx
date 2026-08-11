"use client";

import Link from "next/link";
import type { Course } from "./CourseModule";

type Props = { course: Course | null };

/** Upgrade state for learners who have not enrolled in a course yet. */
export default function UnenrolledCourses({ course }: Props) {
  if (!course) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">{course.name}</h2>
      <p className="mt-1 text-sm text-slate-500">Enroll to access this course curriculum.</p>
      <Link
        className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        href={`/enroll?course=${encodeURIComponent(course.slug ?? "")}`}
      >
        Enroll now
      </Link>
    </div>
  );
}
