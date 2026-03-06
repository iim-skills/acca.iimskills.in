// import { NextResponse } from "next/server";
// import mysql from "mysql2/promise";

// type AnyObj = { [k: string]: any };

// declare global {
//   var __coursePool: mysql.Pool | undefined;
// }

// function getPool() {
//   if (global.__coursePool) return global.__coursePool;

//   const pool = mysql.createPool({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,
//     connectionLimit: 10,
//   });

//   global.__coursePool = pool;
//   return pool;
// }

// function safeParseJson(v: any) {
//   if (!v) return null;
//   if (typeof v === "object") return v;
//   try {
//     return JSON.parse(v);
//   } catch {
//     return null;
//   }
// }

// export async function GET(req: Request) {
//   const pool = getPool();

//   try {
//     /* =========================
//        GET STUDENT BATCH
//     ========================= */

//     const email = req.headers.get("x-user-email");

//     let studentBatchId: string | null = null;

//     if (email) {
//       const [stu]: any = await pool.query(
//         `SELECT batch_id FROM lms_students WHERE email=? LIMIT 1`,
//         [email]
//       );

//       if (stu.length) studentBatchId = String(stu[0].batch_id);
//     }

//     console.log("🎓 Student Batch:", studentBatchId);

//     /* =========================
//        FETCH COURSES
//     ========================= */

//     const [courseRows]: any = await pool.query(
//       `SELECT courseId, slug, name, description, courseData FROM courses`
//     );

//     /* =========================
//        FETCH VIDEOS
//     ========================= */

//     const [videoRows]: any = await pool.query(
//       `
//       SELECT id,name,secure_url,course_slug,module_id,submodule_id
//       FROM videos
//       WHERE
//         JSON_LENGTH(batch_ids)=0
//         OR JSON_CONTAINS(batch_ids, JSON_QUOTE(?))
//       `,
//       [String(studentBatchId)]
//     );

//     /* =========================
//        FETCH QUIZZES
//     ========================= */

//     const [quizRows]: any = await pool.query(
//       `
//       SELECT id,name,course_slug,submodule_id,questions,time_minutes
//       FROM quizzes
//       WHERE
//         JSON_LENGTH(batch_ids)=0
//         OR JSON_CONTAINS(batch_ids, JSON_QUOTE(?))
//       `,
//       [String(studentBatchId)]
//     );

//     console.log("⚡ Videos:", videoRows.length);
//     console.log("🧠 Quizzes:", quizRows.length);

//     /* =========================
//        MERGE DATA
//     ========================= */

//     const normalized = courseRows.map((course: AnyObj) => {
//       const courseData = safeParseJson(course.courseData) || {};
//       const modulesArr = Array.isArray(courseData.modules)
//         ? courseData.modules
//         : [];

//       const mergedModules = modulesArr.map((mod: AnyObj) => {
//         const moduleId = String(mod.moduleId ?? "");

//         const submodulesArr = Array.isArray(mod.submodules)
//           ? mod.submodules
//           : [];

//         const mergedSubmodules = submodulesArr.map((sub: AnyObj) => {
//           const submoduleId = String(sub.submoduleId ?? "");

//           /* =========================
//              VIDEOS (sessions → videos)
//           ========================= */

//           const videos = (sub.sessions || []).map((ses: AnyObj) => {
//             const video = videoRows.find(
//               (v: AnyObj) =>
//                 String(v.id) === String(ses.videoId) &&
//                 String(v.course_slug) === String(course.slug)
//             );

//             return {
//               id: ses.videoId,
//               title: ses.videoTitle || ses.name,
//               url: video?.secure_url || null,
//             };
//           });

//           /* =========================
//              QUIZZES
//           ========================= */

//           const quizzes = (sub.quizzes || []).map((q: AnyObj) => {
//             const quiz = quizRows.find(
//               (qq: AnyObj) =>
//                 String(qq.id) === String(q.quizId) &&
//                 String(qq.course_slug) === String(course.slug)
//             );

//             return {
//               quizRefId: q.quizRefId,
//               name: q.name,
//               quizId: q.quizId,
//               quizTitle: q.quizTitle,
//               quiz: quiz
//                 ? {
//                     id: quiz.id,
//                     title: quiz.name,
//                     time_minutes: quiz.time_minutes,
//                     questions: safeParseJson(quiz.questions),
//                   }
//                 : null,
//             };
//           });

//           return {
//             submoduleId: sub.submoduleId ?? null,
//             title: sub.title ?? "",
//             description: sub.description ?? "",
//             videos,
//             quizzes,
//           };
//         });

//         return {
//           moduleId: mod.moduleId ?? null,
//           name: mod.name ?? "",
//           description: mod.description ?? "",
//           submodules: mergedSubmodules,
//         };
//       });

//       return {
//         courseId: course.courseId,
//         slug: course.slug,
//         name: course.name,
//         description: course.description,
//         modules: mergedModules,
//       };
//     });

//     return NextResponse.json(normalized);
//   } catch (err) {
//     console.error("❌ LMS COURSE API ERROR:", err);
//     return NextResponse.json([], { status: 500 });
//   }
// }

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

      if (stu.length) studentBatchId = String(stu[0].batch_id);
    }

    console.log("🎓 Student Batch:", studentBatchId);

    /* =========================
       FETCH COURSES
    ========================= */

    const [courseRows]: any = await pool.query(
      `SELECT courseId, slug, name, description, courseData FROM courses`
    );

    /* =========================
       FETCH VIDEOS
    ========================= */

    const [videoRows]: any = await pool.query(`
      SELECT id,name,s3_url,course_slug,module_id,submodule_id
      FROM videos
    `);

    /* =========================
       FETCH QUIZZES
    ========================= */

    const [quizRows]: any = await pool.query(
      `
      SELECT id,name,course_slug,submodule_id,questions,time_minutes
      FROM quizzes
      WHERE
        JSON_LENGTH(batch_ids)=0
        OR JSON_CONTAINS(batch_ids, JSON_QUOTE(?))
      `,
      [String(studentBatchId)]
    );

    console.log("⚡ Videos:", videoRows.length);
    console.log("🧠 Quizzes:", quizRows.length);

    /* =========================
       MERGE DATA
    ========================= */

    const normalized = courseRows.map((course: AnyObj) => {
      const courseData = safeParseJson(course.courseData) || {};
      const modulesArr = Array.isArray(courseData.modules)
        ? courseData.modules
        : [];

      const mergedModules = modulesArr.map((mod: AnyObj) => {
        const submodulesArr = Array.isArray(mod.submodules)
          ? mod.submodules
          : [];

        const mergedSubmodules = submodulesArr.map((sub: AnyObj) => {

          /* =========================
             VIDEOS
          ========================= */

          const videos = (sub.sessions || []).map((ses: AnyObj) => {
            const video = videoRows.find(
              (v: AnyObj) =>
                String(v.id) === String(ses.videoId) &&
                String(v.course_slug) === String(course.slug)
            );

            return {
              id: ses.videoId,
              title: ses.videoTitle || ses.name,
              url: video?.s3_url || null,   // ✅ FIXED
            };
          });

          /* =========================
             QUIZZES
          ========================= */

          const quizzes = (sub.quizzes || []).map((q: AnyObj) => {
            const quiz = quizRows.find(
              (qq: AnyObj) =>
                String(qq.id) === String(q.quizId) &&
                String(qq.course_slug) === String(course.slug)
            );

            return {
              quizRefId: q.quizRefId,
              name: q.name,
              quizId: q.quizId,
              quizTitle: q.quizTitle,
              quiz: quiz
                ? {
                    id: quiz.id,
                    title: quiz.name,
                    time_minutes: quiz.time_minutes,
                    questions: safeParseJson(quiz.questions),
                  }
                : null,
            };
          });

          return {
            submoduleId: sub.submoduleId ?? null,
            title: sub.title ?? "",
            description: sub.description ?? "",
            videos,
            quizzes,
          };
        });

        return {
          moduleId: mod.moduleId ?? null,
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
    console.error("❌ LMS COURSE API ERROR:", err);
    return NextResponse.json([], { status: 500 });
  }
}