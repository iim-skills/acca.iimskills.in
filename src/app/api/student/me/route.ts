import { NextResponse } from "next/server";
import db from "../../../../lib/db";

const safeJsonParse = <T,>(value: unknown, fallback: T): T => {
  if (value == null || value === "") return fallback;
  if (typeof value !== "string") return value as T;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const normalizeText = (value: unknown) => String(value ?? "").trim();
const normalizeSlug = (value: unknown) => normalizeText(value).toLowerCase();

const normalizeStudentType = (
  value: unknown,
  hasCourses: boolean
): "free" | "paid" => {
  const raw = normalizeSlug(value);

  if (raw === "free") return "free";
  if (raw === "paid") return "paid";

  return hasCourses ? "paid" : "free";
};

const normalizeCourseSubmodules = (value: any) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce((acc, [moduleId, submoduleIds]) => {
    const normalizedModuleId = normalizeText(moduleId);
    if (!normalizedModuleId) return acc;

    acc[normalizedModuleId] = Array.isArray(submoduleIds)
      ? Array.from(
          new Set(
            submoduleIds
              .map((submoduleId) => normalizeText(submoduleId))
              .filter(Boolean)
          )
        )
      : [];

    return acc;
  }, {} as Record<string, string[]>);
};

const buildScopedFreeSubmodules = (
  slug: string,
  courseSubmodules: any,
  freeStudentAccess: Record<string, any>
) => {
  const normalizedSlug = normalizeSlug(slug);
  if (!normalizedSlug) return undefined;

  const parsedCourseSubmodules = safeJsonParse<any>(courseSubmodules, courseSubmodules);

  if (
    parsedCourseSubmodules &&
    typeof parsedCourseSubmodules === "object" &&
    !Array.isArray(parsedCourseSubmodules)
  ) {
    const nestedCourseSubmodules = Object.entries(parsedCourseSubmodules).find(
      ([courseKey, value]) =>
        normalizeSlug(courseKey) === normalizedSlug &&
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
    )?.[1];

    if (nestedCourseSubmodules) {
      return {
        [normalizedSlug]: normalizeCourseSubmodules(nestedCourseSubmodules),
      };
    }

    const normalizedDirectSubmodules = normalizeCourseSubmodules(
      parsedCourseSubmodules
    );
    if (Object.keys(normalizedDirectSubmodules).length > 0) {
      return {
        [normalizedSlug]: normalizedDirectSubmodules,
      };
    }
  }

  const accessEntry = Object.entries(freeStudentAccess ?? {}).find(
    ([courseKey]) => normalizeSlug(courseKey) === normalizedSlug
  )?.[1];
  if (!accessEntry?.modules || typeof accessEntry.modules !== "object") {
    return undefined;
  }

  const normalizedFromAccess = Object.entries(accessEntry.modules).reduce(
    (acc, [moduleId, moduleValue]) => {
      const normalizedModuleId = normalizeText(moduleId);
      if (!normalizedModuleId) return acc;

      acc[normalizedModuleId] = Array.isArray((moduleValue as any)?.submodules)
        ? Array.from(
            new Set(
              (moduleValue as any).submodules
                .map((submodule: any) =>
                  normalizeText(
                    submodule?.submodule_id ?? submodule?.submoduleId
                  )
                )
                .filter(Boolean)
            )
          )
        : [];

      return acc;
    },
    {} as Record<string, string[]>
  );

  if (Object.keys(normalizedFromAccess).length === 0) {
    return undefined;
  }

  return {
    [normalizedSlug]: normalizedFromAccess,
  };
};

export async function GET(req:Request){

  const email = req.headers.get("x-user-email");

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if(!email){
    return NextResponse.json({error:"Unauthorized"},{status:401});
  }

  const [rows]:any = await db.query(
    `SELECT * FROM lms_students WHERE email=?`,
    [email]
  );

  if(!rows.length){
    return NextResponse.json({error:"Student not found"});
  }

  const student = rows[0];

  const courses = safeJsonParse<any[]>(student.courses, []);
  const freeStudentAccess = safeJsonParse<Record<string, any>>(
    student.free_student_access,
    {}
  );
  const studentType = normalizeStudentType(
    student.student_type,
    Array.isArray(courses) && courses.length > 0
  );

  const responsePayload: any = {
    name: student.name,
    email: student.email,
    student_type: studentType,
    studentType,
  };

  if (slug) {
    const normalizedSlug = normalizeSlug(slug);
    const course = courses.find(
      (c: any) =>
        normalizeSlug(c?.course_slug ?? c?.courseSlug ?? c?.slug) ===
        normalizedSlug
    );
    responsePayload.modules = course?.modules || [];
    responsePayload.progress = course?.progress || {};
    if (studentType === "free") {
      const scopedSubmodules = buildScopedFreeSubmodules(
        slug,
        course?.submodules,
        freeStudentAccess
      );

      if (scopedSubmodules) {
        responsePayload.submodules = scopedSubmodules;
      }
    }
  } else {
    responsePayload.courses = courses;
  }

  return NextResponse.json(responsePayload);
}
