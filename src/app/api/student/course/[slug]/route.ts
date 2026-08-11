import { NextResponse } from "next/server";
import db from "../../../../../lib/db";

const normalizeSlug = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const safeJsonParse = <T,>(value: unknown, fallback: T): T => {
  try {
    if (value == null) return fallback;
    if (typeof value !== "string") return value as T;
    const parsed = JSON.parse(value);
    return (parsed as T) ?? fallback;
  } catch {
    return fallback;
  }
};

const countLessonsFromCourseData = (courseData: any) => {
  if (!Array.isArray(courseData?.modules)) return 0;

  let total = 0;
  courseData.modules.forEach((module: any) => {
    if (!Array.isArray(module?.submodules)) return;

    module.submodules.forEach((submodule: any) => {
      const directVideos = Array.isArray(submodule?.videos)
        ? submodule.videos
        : [];
      const itemVideos = Array.isArray(submodule?.items)
        ? submodule.items.filter((item: any) => item?.type === "video")
        : [];
      const videos = directVideos.length > 0 ? directVideos : itemVideos;

      total += videos.filter((video: any) => video?.visible !== false).length;
    });
  });

  return total;
};

const countCompletedLessons = (courseProgress: any) => {
  if (!courseProgress || typeof courseProgress !== "object") return 0;

  const entries =
    courseProgress.videos && typeof courseProgress.videos === "object"
      ? courseProgress.videos
      : courseProgress;

  return Object.entries(entries).reduce((count, [key, value]) => {
    if (key === "updated_at" || key.startsWith("quiz_")) {
      return count;
    }

    if (Array.isArray(value)) {
      return count + value.length;
    }

    if (value && typeof value === "object" && (value as any).completed) {
      return count + 1;
    }

    return count;
  }, 0);
};

export async function GET(req: Request) {
  try {
    const email = req.headers.get("x-user-email");

    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [rows]: any = await db.query(
      `SELECT courses, progress FROM lms_students WHERE email = ? LIMIT 1`,
      [email]
    );

    if (!rows.length) return NextResponse.json([]);

    const student = rows[0];
    const courses = safeJsonParse<any[]>(student.courses, []);
    const progressData = safeJsonParse<Record<string, any>>(student.progress, {});

    if (!Array.isArray(courses) || courses.length === 0) {
      return NextResponse.json([]);
    }

    const slugs = courses.map((course: any) => course?.course_slug).filter(Boolean);

    if (!slugs.length) {
      return NextResponse.json([]);
    }

    // course_slug is the only link back to the master `courses` table,
    // so it's the sole match key. This is why the admin update route
    // MUST rewrite every student's stored course_slug when a course's
    // slug changes — otherwise this join silently stops matching.
    const [courseDetails]: any = await db.query(
      `
      SELECT slug AS course_slug, name AS course_title, courseData
      FROM courses
      WHERE slug IN (?)
      `,
      [slugs]
    );

    const detailMap = new Map<string, any>();
    courseDetails.forEach((course: any) => {
      const key = normalizeSlug(course.course_slug);
      if (!detailMap.has(key)) {
        detailMap.set(key, course);
      }
    });

    const progressKeys = Object.keys(progressData);

    const formatted = courses.map((course: any, index: number) => {
      const slug = String(course?.course_slug ?? "");
      const detail = detailMap.get(normalizeSlug(slug));

      const courseData = safeJsonParse<any>(detail?.courseData, {});
      const totalLessons = countLessonsFromCourseData(courseData);
      const fallbackTotal = Array.isArray(course?.modules) ? course.modules.length : 0;
      const totalUnits = totalLessons > 0 ? totalLessons : fallbackTotal;

      // Progress keys in the top-level `progress` column use COURSE_xxx ids
      // which we have no link to here — fall back to slug, and to
      // whatever's at the same array index as a last resort (fragile,
      // kept only for backward compatibility with existing data).
      const progressKeyCandidates = [slug, progressKeys[index]].filter(Boolean);

      const matchedProgressKey = progressKeyCandidates.find(
        (key) => progressData[key]
      );
      const courseProgress = matchedProgressKey
        ? progressData[matchedProgressKey]
        : course?.progress ?? {};
      const completedUnitsRaw = countCompletedLessons(courseProgress);
      const completedUnits =
        totalUnits > 0
          ? Math.min(completedUnitsRaw, totalUnits)
          : completedUnitsRaw;
      const progress =
        totalUnits > 0
          ? Math.min(100, Math.round((completedUnits / totalUnits) * 100))
          : 0;

      return {
        course_slug: detail?.course_slug || slug,
        course_title: detail?.course_title || course?.course_title || slug,
        total_modules: totalUnits,
        completed_modules: completedUnits,
        total_lessons: totalLessons > 0 ? totalUnits : undefined,
        completed_lessons: totalLessons > 0 ? completedUnits : undefined,
        progress,
        last_accessed: new Date().toISOString(),
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Student dashboard course progress error:", error);

    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}