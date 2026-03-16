import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
});

function humanizeSlug(slug: string) {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function POST(req: Request) {
  let conn: any;

  try {
    const body = await req.json();

    const name = (body?.name ?? "").toString().trim();
    const emailRaw = (body?.email ?? "").toString().trim().toLowerCase();
    const phone = (body?.phone ?? "").toString().trim();
    const courseSlug = (body?.courseSlug ?? "").toString().trim();

    const batchId = body?.batchId ?? null;
    const batchName = (body?.batchName ?? "").toString().trim();

    const modules = Array.isArray(body?.modules) ? body.modules : [];
    const courseTitleFromBody = (body?.courseTitle ?? "").toString().trim();
    const courseTitle = courseTitleFromBody || humanizeSlug(courseSlug);

    if (!emailRaw || !courseSlug) {
      return NextResponse.json({ error: "Missing email or courseSlug" }, { status: 400 });
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    // 1) detect if 'courses' column exists in the table
    const [colRows]: any = await conn.execute(
      `SELECT COUNT(*) as cnt
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'lms_students' AND COLUMN_NAME = 'courses'`,
      [process.env.DB_NAME]
    );
    const hasCoursesColumn = (colRows && colRows[0] && Number(colRows[0].cnt) > 0) || false;

    // If column missing, try to add it (best-effort; catch permission errors)
    if (!hasCoursesColumn) {
      try {
        await conn.execute(`ALTER TABLE lms_students ADD COLUMN courses JSON NULL`);
        // mark as present for the remainder of the logic
      } catch (err) {
        // can't alter table (missing privileges?) — continue; we'll still try to work with legacy columns
        console.warn("Could not add 'courses' column automatically:", err);
      }
    }

    // re-check (in case ALTER succeeded)
    const [colRows2]: any = await conn.execute(
      `SELECT COUNT(*) as cnt
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'lms_students' AND COLUMN_NAME = 'courses'`,
      [process.env.DB_NAME]
    );
    const effectiveHasCourses = (colRows2 && colRows2[0] && Number(colRows2[0].cnt) > 0) || false;

    // Fetch student row (fetch both legacy columns and courses if present)
    const [existingRows]: any = await conn.execute(
      `SELECT id, courses, course_slug, course_title, modules, progress
       FROM lms_students WHERE email = ? LIMIT 1`,
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

    /* ================================
       EXISTING STUDENT
    ================================= */
    if (existingRows.length) {
      const student = existingRows[0];
      studentId = student.id;

      // Build current courses array
      let courses: any[] = [];

      if (effectiveHasCourses && student.courses) {
        // Normal case: parse existing JSON
        try {
          courses = typeof student.courses === "string" ? JSON.parse(student.courses) : student.courses;
          if (!Array.isArray(courses)) courses = [];
        } catch {
          courses = [];
        }
      } else {
        // Legacy case: convert single-course columns into courses[] if present
        const legacyCourseSlug = student.course_slug ?? "";
        if (legacyCourseSlug) {
          let legacyModules: any[] = [];
          try {
            if (student.modules) {
              // modules might be stored as JSON string or comma-separated
              if (typeof student.modules === "string" && student.modules.trim().startsWith("[")) {
                legacyModules = JSON.parse(student.modules);
              } else if (typeof student.modules === "string") {
                legacyModules = student.modules.split(",").map((s: string) => s.trim()).filter(Boolean);
              }
            }
          } catch {
            legacyModules = [];
          }

          let legacyProgress = {};
          try {
            if (student.progress) {
              legacyProgress = typeof student.progress === "string" ? JSON.parse(student.progress) : student.progress;
            }
          } catch {
            legacyProgress = {};
          }

          courses.push({
            course_slug: legacyCourseSlug,
            course_title: student.course_title ?? humanizeSlug(legacyCourseSlug),
            modules: legacyModules,
            progress: legacyProgress,
            batch_id: null,
            batch_name: "",
          });
        }
      }

      // Prevent duplicates by course_slug
      const exists = courses.find((c: any) => c.course_slug === courseSlug);

      if (!exists) {
        courses.push(newCourse);
      }

      // Persist: if courses column exists, update it. Otherwise try to add the column then update; if not possible, try to keep legacy columns untouched and return error.
      if (effectiveHasCourses) {
        await conn.execute(`UPDATE lms_students SET courses = ?, updated_at = NOW() WHERE id = ?`, [
          JSON.stringify(courses),
          studentId,
        ]);
      } else {
        // Attempt to add column if not present
        try {
          await conn.execute(`ALTER TABLE lms_students ADD COLUMN courses JSON NULL`);
          await conn.execute(`UPDATE lms_students SET courses = ?, updated_at = NOW() WHERE id = ?`, [
            JSON.stringify(courses),
            studentId,
          ]);
        } catch (err) {
          // If we cannot add 'courses' column, fallback: update legacy single-course columns to the *new* course (this will overwrite old single-course info).
          // This fallback preserves operation but cannot represent multiple courses in single row.
          await conn.execute(
            `UPDATE lms_students SET course_slug = ?, course_title = ?, modules = ?, progress = ?, updated_at = NOW() WHERE id = ?`,
            [courseSlug, courseTitle, JSON.stringify(modules), JSON.stringify({}), studentId]
          );
        }
      }

      finalCourses = effectiveHasCourses ? courses : courses; // return courses array (even if we had to write them into legacy columns)
      await conn.commit();

      return NextResponse.json({ ok: true, studentId, courses: finalCourses });
    }

    /* ================================
       NEW STUDENT
    ================================= */

    // New student: create with courses[] if possible
    const coursesToInsert = [newCourse];

    if (effectiveHasCourses) {
      const [insertResult]: any = await conn.execute(
        `
        INSERT INTO lms_students
        (name, email, phone, login_id, password, courses, enrolled_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        `,
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
      finalCourses = coursesToInsert;
      await conn.commit();

      return NextResponse.json({ ok: true, studentId, courses: finalCourses });
    } else {
      // Try to ALTER and then insert with courses; if ALTER fails, fall back to legacy single-course insert
      try {
        await conn.execute(`ALTER TABLE lms_students ADD COLUMN courses JSON NULL`);
        const [insertResult]: any = await conn.execute(
          `
          INSERT INTO lms_students
          (name, email, phone, login_id, password, courses, enrolled_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
          `,
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
        finalCourses = coursesToInsert;
        await conn.commit();
        return NextResponse.json({ ok: true, studentId, courses: finalCourses });
      } catch (err) {
        // ALTER or insert with courses failed — fallback to legacy single-course columns insert
        const [insertResult]: any = await conn.execute(
          `
          INSERT INTO lms_students
          (name, email, phone, login_id, password, course_slug, course_title, student_type, modules, progress, enrolled_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          `,
          [
            name || emailRaw.split("@")[0],
            emailRaw,
            phone,
            emailRaw,
            emailRaw,
            courseSlug,
            courseTitle,
            "paid",
            JSON.stringify(modules),
            JSON.stringify({}),
          ]
        );

        studentId = insertResult.insertId;
        finalCourses = coursesToInsert; // return the courses array even though DB uses legacy columns
        await conn.commit();
        return NextResponse.json({ ok: true, studentId, courses: finalCourses });
      }
    }
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("ENROL API ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}