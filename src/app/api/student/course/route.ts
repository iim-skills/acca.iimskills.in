import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

type AnyObj = { [k: string]: any };

declare global {
  var __coursePool: mysql.Pool | undefined;
}

function getPool() {
  if (global.__coursePool) return global.__coursePool;

  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10,
  });

  global.__coursePool = pool;
  return pool;
}

function safeParseJson(v: any) {
  if (!v) return null;
  if (typeof v === "object") return v;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const pool = getPool();

  try {
    /* =========================
       GET STUDENT BATCH
    ========================= */
    const email = req.headers.get("x-user-email");

    let studentBatchId: string | null = null;

    if (email) {
      const [stu]: any = await pool.query(
        `SELECT batch_id FROM lms_students WHERE email=? LIMIT 1`,
        [email]
      );

      if (stu.length) {
        studentBatchId = String(stu[0].batch_id);
      }
    }

    console.log("🎓 Student Batch:", studentBatchId);

    /* =========================
       FETCH COURSES
    ========================= */
    const [courseRows]: any = await pool.query(
      `SELECT courseId, slug, name, description, courseData FROM courses`
    );

    /* =========================
       ⭐ ULTRA FAST VIDEO QUERY
       JSON_CONTAINS handles batch filtering in SQL
    ========================= */
    const [videoRows]: any = await pool.query(
      
  `
  SELECT id,name,secure_url,course_slug,module_id,submodule_id
  FROM videos
  WHERE
    JSON_LENGTH(batch_ids)=0
    OR JSON_CONTAINS(batch_ids, JSON_QUOTE(?))
  `,
  [String(studentBatchId)]
);

    console.log("⚡ Videos After SQL Filter:", videoRows.length);
    console.log("Student batchId:", studentBatchId);

    const normalized = courseRows.map((course: AnyObj) => {
      const courseData = safeParseJson(course.courseData) || {};
      const modulesArr = Array.isArray(courseData.modules)
        ? courseData.modules
        : [];

      const mergedModules = modulesArr.map((mod: AnyObj) => {
        const moduleId = String(mod.moduleId ?? mod.slug ?? "");

        const submodulesArr = Array.isArray(mod.submodules)
          ? mod.submodules
          : [];

        const mergedSubmodules = submodulesArr.map((sub: AnyObj) => {
          const submoduleId = String(sub.submoduleId ?? sub.id ?? "");

          const vids = videoRows.filter(
            (v: AnyObj) =>
              String(v.course_slug) === String(course.slug) &&
              String(v.module_id) === moduleId &&
              String(v.submodule_id) === submoduleId
          );

          return {
            submoduleId: sub.submoduleId ?? null,
            title: sub.title ?? "",
            description: sub.description ?? "",
            videos: vids.map((v: AnyObj) => ({
              id: v.id,
              title: v.name,
              url: v.secure_url,
            })),
          };
        });

        return {
          moduleId: mod.moduleId ?? null,
          slug: mod.slug ?? null,
          name: mod.name ?? "",
          description: mod.description ?? "",
          submodules: mergedSubmodules,
        };
      });

      return {
        courseId: course.courseId,
        slug: course.slug,
        name: course.name,
        description: course.description,
        modules: mergedModules,
      };
    });

    return NextResponse.json(normalized);
  } catch (err) {
    console.error("❌ ULTRA FAST COURSE API ERROR:", err);
    return NextResponse.json([], { status: 500 });
  }
}