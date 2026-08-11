import type { Course } from "./CourseModule";

export type CourseAccess = {
  modules?: string[] | number[];
  submodules?: Record<string, Record<string, string[]>> | Record<string, string[]>;
  progress?: Record<string, number[]>;
};

export async function getCourse(slug: string): Promise<Course | null> {
  const response = await fetch(`/api/student/course/course-details?slug=${encodeURIComponent(slug)}`);
  if (!response.ok) return null;
  const data = await response.json();
  return data?.course ?? null;
}
