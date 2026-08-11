import { NextResponse } from "next/server";
import db from "../../../../../lib/db";

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

export async function POST(req: Request) {
  try {
    const { id, name, slug } = await req.json();

    if (!id || !name || !slug) {
      return NextResponse.json(
        { error: "id, name and slug are required" },
        { status: 400 }
      );
    }

    /* check duplicate slug (excluding current course) */
    const [exists]: any = await db.execute(
      "SELECT id FROM courses WHERE slug = ? AND id != ? LIMIT 1",
      [slug, id]
    );

    if (exists.length > 0) {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 409 }
      );
    }

    // Grab the OLD slug before updating — it's the only key we can use
    // to find this course inside students' `courses` JSON.
    const [beforeRows]: any = await db.execute(
      "SELECT slug FROM courses WHERE id = ? LIMIT 1",
      [id]
    );

    if (!beforeRows.length) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const oldSlug: string = beforeRows[0].slug;

    const [result]: any = await db.execute(
      `UPDATE courses 
       SET name = ?, slug = ?, updatedAt = NOW() 
       WHERE id = ?`,
      [name, slug, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    // ---- Sync the denormalized copy in every enrolled student's JSON ----
    let studentsUpdated = 0;

    try {
      // Only bother searching if the slug actually changed. If the admin
      // only changed the display name and kept the same slug, we still
      // need to sync course_title, so we search either way — but we
      // always search by oldSlug since that's what students still have.
      const [studentRows]: any = await db.query(
        `
        SELECT id, courses
        FROM lms_students
        WHERE JSON_SEARCH(courses, 'one', ?, NULL, '$[*].course_slug') IS NOT NULL
        `,
        [oldSlug]
      );

      for (const student of studentRows) {
        const courses = safeJsonParse<any[]>(student.courses, []);
        if (!Array.isArray(courses) || courses.length === 0) continue;

        let changed = false;

        const updatedCourses = courses.map((course: any) => {
          if (
            String(course?.course_slug ?? "").toLowerCase() !==
            oldSlug.toLowerCase()
          ) {
            return course;
          }

          changed = true;
          return {
            ...course,
            course_slug: slug,
            course_title: name,
          };
        });

        if (changed) {
          await db.execute(`UPDATE lms_students SET courses = ? WHERE id = ?`, [
            JSON.stringify(updatedCourses),
            student.id,
          ]);
          studentsUpdated += 1;
        }
      }
    } catch (syncError) {
      // Don't fail the whole request if sync has an issue — course table
      // itself is already updated correctly.
      console.error("STUDENT COURSE SYNC ERROR:", syncError);
    }

    // ---- Also sync free_student_access, which stores its own slug copy ----
    try {
      const [freeAccessRows]: any = await db.query(
        `
        SELECT id, free_student_access
        FROM lms_students
        WHERE JSON_SEARCH(free_student_access, 'one', ?, NULL, '$.*') IS NOT NULL
          OR JSON_CONTAINS_PATH(free_student_access, 'one', CONCAT('$."', ?, '"'))
        `,
        [oldSlug, oldSlug]
      );

      for (const student of freeAccessRows) {
        const access = safeJsonParse<Record<string, any>>(
          student.free_student_access,
          {}
        );
        if (!access || typeof access !== "object") continue;

        const matchKey = Object.keys(access).find(
          (key) => key.toLowerCase() === oldSlug.toLowerCase()
        );
        if (!matchKey) continue;

        const updatedAccess = { ...access };
        updatedAccess[slug] = updatedAccess[matchKey];
        if (matchKey !== slug) {
          delete updatedAccess[matchKey];
        }

        await db.execute(
          `UPDATE lms_students SET free_student_access = ? WHERE id = ?`,
          [JSON.stringify(updatedAccess), student.id]
        );
      }
    } catch (freeAccessSyncError) {
      console.error("FREE ACCESS SYNC ERROR:", freeAccessSyncError);
    }

    return NextResponse.json({ success: true, studentsUpdated });
  } catch (error) {
    console.error("UPDATE COURSE ERROR:", error);

    return NextResponse.json(
      { error: "Failed to update course" },
      { status: 500 }
    );
  }
}1