"use client";

import CourseModule, { type CourseModuleProps } from "./CourseModule";

/** Curriculum for an enrolled learner. Keeps the existing player/progress API. */
export default function EnrolledCourse(props: CourseModuleProps) {
  return <CourseModule {...props} />;
}
