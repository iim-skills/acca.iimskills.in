import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

/* ================= DB CONNECTION ================= */

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
});

const STUDENTS_TABLE = "lms_students";
const COURSES_TABLE = "courses";

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

const humanizeSlug = (slug: string) =>
  normalizeText(slug)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

async function hasColumn(conn: any, columnName: string) {
  const [rows]: any = await conn.execute(
    `SELECT COUNT(*) AS cnt
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [process.env.DB_NAME, STUDENTS_TABLE, columnName]
  );

  return Number(rows?.[0]?.cnt ?? 0) > 0;
}

async function ensureColumn(conn: any, columnName: string, definition: string) {
  if (await hasColumn(conn, columnName)) return true;

  try {
    await conn.execute(
      `ALTER TABLE ${STUDENTS_TABLE} ADD COLUMN ${columnName} ${definition}`
    );
  } catch (error) {
    console.warn(`Could not add '${columnName}' column automatically:`, error);
  }

  return hasColumn(conn, columnName);
}

const buildCourseSubmodulesFromAccess = (accessEntry: any) => {
  const courseSubmodules: Record<string, string[]> = {};

  if (!accessEntry?.modules || typeof accessEntry.modules !== "object") {
    return courseSubmodules;
  }

  Object.entries(accessEntry.modules).forEach(([moduleId, moduleValue]) => {
    const submodules = Array.isArray((moduleValue as any)?.submodules)
      ? (moduleValue as any).submodules
      : [];

    courseSubmodules[moduleId] = submodules
      .map((submodule: any) =>
        normalizeText(submodule?.submodule_id ?? submodule?.submoduleId)
      )
      .filter(Boolean);
  });

  return courseSubmodules;
};

const buildFreeStudentAccessEntry = (
  slug: string,
  courseRow: any,
  selectedSubmodulesByModule: Record<string, string[]>
) => {
  const courseSlug = normalizeText(slug);
  const courseTitle =
    normalizeText(courseRow?.name) || humanizeSlug(courseSlug);
  const courseData = safeJsonParse<any>(courseRow?.courseData, {});
  const courseModules = Array.isArray(courseData?.modules)
    ? courseData.modules
    : [];

  const moduleLookup = new Map<string, any>();
  courseModules.forEach((module: any) => {
    const moduleId = normalizeText(
      module?.moduleId ?? module?.id ?? module?.slug ?? module?.name
    );
    if (moduleId) {
      moduleLookup.set(moduleId, module);
    }
  });

  const normalizedModules = Object.entries(selectedSubmodulesByModule ?? {}).reduce(
    (acc, [moduleId, submoduleIds]) => {
      const normalizedModuleId = normalizeText(moduleId);
      if (!normalizedModuleId) return acc;

      const moduleFromCourse = moduleLookup.get(normalizedModuleId);
      const moduleName =
        normalizeText(moduleFromCourse?.name) || normalizedModuleId;
      const moduleSubmodules = Array.isArray(moduleFromCourse?.submodules)
        ? moduleFromCourse.submodules
        : [];
      const submoduleLookup = new Map<string, any>();

      moduleSubmodules.forEach((submodule: any) => {
        const submoduleId = normalizeText(
          submodule?.submoduleId ?? submodule?.id ?? submodule?.title
        );
        if (submoduleId) {
          submoduleLookup.set(submoduleId, submodule);
        }
      });

      const normalizedSubmodules = Array.isArray(submoduleIds)
        ? Array.from(
            new Set(
              submoduleIds
                .map((submoduleId) => normalizeText(submoduleId))
                .filter(Boolean)
            )
          )
        : [];

      acc[normalizedModuleId] = {
        module_id: normalizedModuleId,
        module_name: moduleName,
        submodules: normalizedSubmodules.map((submoduleId) => {
          const submoduleFromCourse = submoduleLookup.get(submoduleId);

          return {
            submodule_id: submoduleId,
            submodule_name:
              normalizeText(submoduleFromCourse?.title) || submoduleId,
          };
        }),
      };

      return acc;
    },
    {} as Record<
      string,
      {
        module_id: string;
        module_name: string;
        submodules: Array<{
          submodule_id: string;
          submodule_name: string;
        }>;
      }
    >
  );

  return {
    course_slug: courseSlug,
    course_title: courseTitle,
    modules: normalizedModules,
  };
};

/* ==================================================
   GET STUDENT (FOR EDIT PANEL)
================================================== */

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  let conn;

  try {
    const { id } = await context.params;

    conn = await pool.getConnection();
    const hasFreeStudentAccessColumn = await hasColumn(
      conn,
      "free_student_access"
    );

    const selectFields = hasFreeStudentAccessColumn
      ? "id, name, email, phone, student_type, courses, free_student_access"
      : "id, name, email, phone, student_type, courses";

    const [rows]: any = await conn.execute(
      `SELECT ${selectFields}
       FROM ${STUDENTS_TABLE}
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    if (!rows.length) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    const student = rows[0];

    student.courses = safeJsonParse<any[]>(student.courses, []);

    if (
      student.student_type === "free" &&
      hasFreeStudentAccessColumn &&
      student.free_student_access
    ) {
      const freeStudentAccess = safeJsonParse<Record<string, any>>(
        student.free_student_access,
        {}
      );

      student.courses = student.courses.map((course: any) => {
        const slug = normalizeText(course?.course_slug ?? course?.slug);
        if (!slug) return course;
        if (course?.submodules && typeof course.submodules === "object") {
          return course;
        }

        const accessEntry = freeStudentAccess?.[slug];
        if (!accessEntry) return course;

        return {
          ...course,
          submodules: buildCourseSubmodulesFromAccess(accessEntry),
        };
      });
    }

    return NextResponse.json({
      ok: true,
      student,
    });

  } catch (error) {
    console.error("GET STUDENT ERROR:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}

/* ==================================================
   UPDATE STUDENT
================================================== */

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  let conn;

  try {
    const { id } = await context.params;
    const body = await req.json();

    const name = body?.name ?? null;
    const email = body?.email ?? null;
    const phone = body?.phone ?? null;
    const rawStudentType = String(body?.studentType ?? "")
      .trim()
      .toLowerCase();
    const studentType = rawStudentType === "free" ? "free" : "paid";

    const courseSlugs: string[] = Array.isArray(body?.courseSlugs)
      ? body.courseSlugs
      : [];

    const modulesMap: Record<string, string[]> =
      body?.modulesMap ?? {};
    const submodulesMap: Record<string, Record<string, string[]>> =
      body?.submodulesMap ?? {};

    const batchIds: string[] = Array.isArray(body?.batchIds)
      ? body.batchIds
      : [];

    const batchName = body?.batchName ?? "";

    conn = await pool.getConnection();
    const hasFreeStudentAccessColumn = await ensureColumn(
      conn,
      "free_student_access",
      "LONGTEXT NULL"
    );

    /* ================= LOAD EXISTING COURSES ================= */

    const [rows]: any = await conn.execute(
      `SELECT courses FROM ${STUDENTS_TABLE} WHERE id = ? LIMIT 1`,
      [id]
    );

    if (!rows.length) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    const existingCourses = safeJsonParse<any[]>(rows[0].courses, []);

    const normalizedCourseSlugs = Array.from(
      new Set(courseSlugs.map((slug) => normalizeText(slug)).filter(Boolean))
    );
    const courseRowsBySlug = new Map<string, any>();

    if (normalizedCourseSlugs.length > 0) {
      const placeholders = normalizedCourseSlugs.map(() => "?").join(", ");
      const [courseRows]: any = await conn.execute(
        `SELECT slug, name, courseData
         FROM ${COURSES_TABLE}
         WHERE slug IN (${placeholders})`,
        normalizedCourseSlugs
      );

      courseRows.forEach((course: any) => {
        const slug = normalizeText(course?.slug);
        if (slug) {
          courseRowsBySlug.set(slug, course);
        }
      });
    }

    /* ================= BUILD UPDATED COURSES ================= */

    const updatedCourses: any[] = [];
    const freeStudentAccess: Record<string, any> = {};

    for (const slug of normalizedCourseSlugs) {
      const existing = existingCourses.find(
        (c: any) => normalizeText(c?.course_slug) === slug
      );
      const courseRow = courseRowsBySlug.get(slug);

      const modules = Array.isArray(modulesMap[slug])
        ? Array.from(
            new Set(
              modulesMap[slug]
                .map((moduleId) => normalizeText(moduleId))
                .filter(Boolean)
            )
          )
        : [];

      const batchId = batchIds.length ? batchIds[0] : null;
      const accessEntry = buildFreeStudentAccessEntry(
        slug,
        courseRow,
        submodulesMap[slug] ?? {}
      );
      const courseSubmodules = buildCourseSubmodulesFromAccess(accessEntry);

      if (studentType === "free") {
        freeStudentAccess[slug] = accessEntry;
      }

      const nextCourse = existing
        ? {
            ...existing,
            course_slug: slug,
            course_title:
              normalizeText(courseRow?.name) ||
              normalizeText(existing?.course_title) ||
              humanizeSlug(slug),
            modules,
            progress: existing?.progress ?? {},
            batch_id: batchId,
            batch_name: batchName,
          }
        : {
            course_slug: slug,
            course_title:
              normalizeText(courseRow?.name) || humanizeSlug(slug),
            modules,
            progress: {},
            batch_id: batchId,
            batch_name: batchName,
          };

      if (studentType === "free") {
        updatedCourses.push({
          ...nextCourse,
          submodules: courseSubmodules,
        });
      } else {
        const { submodules: _unusedSubmodules, ...paidCourse } = nextCourse;
        updatedCourses.push(paidCourse);
      }
    }

    /* ================= UPDATE STUDENT ================= */

    const updateFields = [
      "name = COALESCE(?, name)",
      "email = COALESCE(?, email)",
      "phone = COALESCE(?, phone)",
      "student_type = ?",
      "courses = ?",
    ];
    const updateValues: any[] = [
      name,
      email,
      phone,
      studentType,
      JSON.stringify(updatedCourses),
    ];

    if (hasFreeStudentAccessColumn) {
      updateFields.push("free_student_access = ?");
      updateValues.push(
        studentType === "free" ? JSON.stringify(freeStudentAccess) : null
      );
    }

    updateFields.push("updated_at = NOW()");
    updateValues.push(id);

    await conn.execute(
      `
      UPDATE ${STUDENTS_TABLE}
      SET 
        ${updateFields.join(",\n        ")}
      WHERE id = ?
      `,
      updateValues
    );

    return NextResponse.json({
      ok: true,
      message: "Student updated successfully",
      courses: updatedCourses,
    });

  } catch (error: any) {
    console.error("PUT STUDENT ERROR:", error);

    return NextResponse.json(
      { error: "Server error", detail: error.message },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}
