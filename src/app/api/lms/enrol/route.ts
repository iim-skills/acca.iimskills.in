import { NextResponse } from "next/server";
import db from "../../../../lib/db";

function humanizeSlug(slug: string) {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const normalizeStudentType = (value: unknown) =>
  String(value ?? "").trim().toLowerCase() === "free" ? "free" : "paid";

async function hasColumn(conn: any, columnName: string) {
  const [rows]: any = await conn.execute(
    `SELECT COUNT(*) AS cnt
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME = 'lms_students'
       AND COLUMN_NAME = ?`,
    [process.env.DB_NAME, columnName]
  );

  return Number(rows?.[0]?.cnt ?? 0) > 0;
}

async function ensureColumn(conn: any, columnName: string, definition: string) {
  if (await hasColumn(conn, columnName)) return true;

  try {
    await conn.execute(
      `ALTER TABLE lms_students ADD COLUMN ${columnName} ${definition}`
    );
  } catch (error) {
    console.warn(`Could not add '${columnName}' column automatically:`, error);
  }

  return hasColumn(conn, columnName);
}

export async function POST(req: Request) {
  let conn: any;

  try {
    const body = await req.json();

    const name = String(body?.name ?? "").trim();
    const emailRaw = String(body?.email ?? "").trim().toLowerCase();
    const phone = String(body?.phone ?? "").trim();
    const courseSlug = String(body?.courseSlug ?? "").trim();
    const courseTitleFromBody = String(body?.courseTitle ?? "").trim();
    const courseTitle = courseTitleFromBody || humanizeSlug(courseSlug);
    const studentType = normalizeStudentType(body?.studentType);
    const batchId = body?.batchId ?? null;
    const batchName = String(body?.batchName ?? "").trim();
    const modules = Array.isArray(body?.modules) ? body.modules : [];

    if (!emailRaw || !courseSlug) {
      return NextResponse.json(
        { error: "Missing email or courseSlug" },
        { status: 400 }
      );
    }

    conn = await db.getConnection();
    await conn.beginTransaction();

    const hasCoursesColumn = await ensureColumn(conn, "courses", "JSON NULL");
    const hasStudentTypeColumn = await ensureColumn(
      conn,
      "student_type",
      "VARCHAR(32) NOT NULL DEFAULT 'paid'"
    );

    const [existingRows]: any = await conn.execute(
      `SELECT id, courses, course_slug, course_title, modules, progress
       FROM lms_students
       WHERE email = ?
       LIMIT 1`,
      [emailRaw]
    );

    const newCourse = {
      course_slug: courseSlug,
      course_title: courseTitle,
      modules,
      progress: {},
      batch_id: batchId,
      batch_name: batchName,
    };

    let studentId: number | undefined;
    let finalCourses: any[] = [];

    if (existingRows.length) {
      const student = existingRows[0];
      studentId = student.id;

      let courses: any[] = [];

      if (hasCoursesColumn && student.courses) {
        try {
          courses =
            typeof student.courses === "string"
              ? JSON.parse(student.courses)
              : student.courses;
          if (!Array.isArray(courses)) courses = [];
        } catch {
          courses = [];
        }
      } else {
        const legacyCourseSlug = student.course_slug ?? "";

        if (legacyCourseSlug) {
          let legacyModules: any[] = [];

          try {
            if (student.modules) {
              if (
                typeof student.modules === "string" &&
                student.modules.trim().startsWith("[")
              ) {
                legacyModules = JSON.parse(student.modules);
              } else if (typeof student.modules === "string") {
                legacyModules = student.modules
                  .split(",")
                  .map((value: string) => value.trim())
                  .filter(Boolean);
              }
            }
          } catch {
            legacyModules = [];
          }

          let legacyProgress = {};

          try {
            if (student.progress) {
              legacyProgress =
                typeof student.progress === "string"
                  ? JSON.parse(student.progress)
                  : student.progress;
            }
          } catch {
            legacyProgress = {};
          }

          courses.push({
            course_slug: legacyCourseSlug,
            course_title:
              student.course_title ?? humanizeSlug(legacyCourseSlug),
            modules: legacyModules,
            progress: legacyProgress,
            batch_id: null,
            batch_name: "",
          });
        }
      }

      const existingIndex = courses.findIndex(
        (course: any) => course.course_slug === courseSlug
      );

      if (existingIndex >= 0) {
        courses[existingIndex] = {
          ...courses[existingIndex],
          ...newCourse,
          progress: courses[existingIndex]?.progress ?? {},
        };
      } else {
        courses.push(newCourse);
      }

      if (hasCoursesColumn) {
        if (hasStudentTypeColumn) {
          await conn.execute(
            `UPDATE lms_students
             SET courses = ?, student_type = ?, updated_at = NOW()
             WHERE id = ?`,
            [JSON.stringify(courses), studentType, studentId]
          );
        } else {
          await conn.execute(
            `UPDATE lms_students
             SET courses = ?, updated_at = NOW()
             WHERE id = ?`,
            [JSON.stringify(courses), studentId]
          );
        }
      } else if (hasStudentTypeColumn) {
        await conn.execute(
          `UPDATE lms_students
           SET course_slug = ?, course_title = ?, student_type = ?, modules = ?, progress = ?, updated_at = NOW()
           WHERE id = ?`,
          [
            courseSlug,
            courseTitle,
            studentType,
            JSON.stringify(modules),
            JSON.stringify({}),
            studentId,
          ]
        );
      } else {
        await conn.execute(
          `UPDATE lms_students
           SET course_slug = ?, course_title = ?, modules = ?, progress = ?, updated_at = NOW()
           WHERE id = ?`,
          [
            courseSlug,
            courseTitle,
            JSON.stringify(modules),
            JSON.stringify({}),
            studentId,
          ]
        );
      }

      finalCourses = courses;
      await conn.commit();

      return NextResponse.json({ ok: true, studentId, courses: finalCourses });
    }

    const coursesToInsert = [newCourse];

    if (hasCoursesColumn) {
      if (hasStudentTypeColumn) {
        const [insertResult]: any = await conn.execute(
          `INSERT INTO lms_students
           (name, email, phone, login_id, password, student_type, courses, enrolled_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            name || emailRaw.split("@")[0],
            emailRaw,
            phone,
            emailRaw,
            emailRaw,
            studentType,
            JSON.stringify(coursesToInsert),
          ]
        );

        studentId = insertResult.insertId;
      } else {
        const [insertResult]: any = await conn.execute(
          `INSERT INTO lms_students
           (name, email, phone, login_id, password, courses, enrolled_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            name || emailRaw.split("@")[0],
            emailRaw,
            phone,
            emailRaw,
            emailRaw,
            JSON.stringify(coursesToInsert),
          ]
        );

        studentId = insertResult.insertId;
      }

      finalCourses = coursesToInsert;
      await conn.commit();

      return NextResponse.json({ ok: true, studentId, courses: finalCourses });
    }

    if (hasStudentTypeColumn) {
      const [insertResult]: any = await conn.execute(
        `INSERT INTO lms_students
         (name, email, phone, login_id, password, course_slug, course_title, student_type, modules, progress, enrolled_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          name || emailRaw.split("@")[0],
          emailRaw,
          phone,
          emailRaw,
          emailRaw,
          courseSlug,
          courseTitle,
          studentType,
          JSON.stringify(modules),
          JSON.stringify({}),
        ]
      );

      studentId = insertResult.insertId;
    } else {
      const [insertResult]: any = await conn.execute(
        `INSERT INTO lms_students
         (name, email, phone, login_id, password, course_slug, course_title, modules, progress, enrolled_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          name || emailRaw.split("@")[0],
          emailRaw,
          phone,
          emailRaw,
          emailRaw,
          courseSlug,
          courseTitle,
          JSON.stringify(modules),
          JSON.stringify({}),
        ]
      );

      studentId = insertResult.insertId;
    }

    finalCourses = coursesToInsert;
    await conn.commit();

    return NextResponse.json({ ok: true, studentId, courses: finalCourses });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("ENROL API ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}
