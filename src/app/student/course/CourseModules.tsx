"use client";

import EnrolledCourse from "./EnrolledCourse";
import type { CourseModuleProps } from "./CourseModule";

/** Backwards-compatible entry point for the student course page. */
export default function CourseModules(props: CourseModuleProps) {
  return <EnrolledCourse {...props} />;
}
