import { NextResponse } from "next/server";
import db from "../../../../lib/db";

/* ======================================================
   HELPER: Ensure valid courseData structure
====================================================== */

function normalizeCourseData(data: any) {
  if (!data || typeof data !== "object") {
    return { modules: [] };
  }

  if (!Array.isArray(data.modules)) {
    data.modules = [];
  }

  data.modules = data.modules.map((module: any) => ({
    ...module,
    submodules: Array.isArray(module.submodules)
      ? module.submodules.map((sub: any) => ({
          ...sub,
          sessions: Array.isArray(sub.sessions) ? sub.sessions : [],
          quizzes: Array.isArray(sub.quizzes) ? sub.quizzes : [],
        }))
      : [],
  }));

  return data;
}

/* ======================================================
   GET: Fetch Courses
====================================================== */

export async function GET() {
  try {
    const [rows]: any = await db.query(
      "SELECT * FROM courses ORDER BY id DESC"
    );

    const courses = rows.map((course: any) => {
      let courseData;

      try {
        courseData =
          typeof course.courseData === "string"
            ? JSON.parse(course.courseData)
            : course.courseData;
      } catch {
        courseData = { modules: [] };
      }

      courseData = normalizeCourseData(courseData);

      return {
        id: course.id,
        courseId: course.courseId ?? null,
        slug: course.slug,
        name: course.name,
        description: course.description,
        modules: courseData.modules,
        courseData,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
      };
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.error("GET /api/admin/courses error:", error);

    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

/* ======================================================
   POST: Create Course
====================================================== */

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = body.name?.trim();
    const slug = body.slug?.trim();
    const description = body.description || "";
    const courseId = body.courseId || null;

    let courseData = body.courseData || { modules: [] };

    if (!name || !slug) {
      return NextResponse.json(
        { error: "name and slug are required" },
        { status: 400 }
      );
    }

    /* normalize structure */
    courseData = normalizeCourseData(courseData);

    /* check slug duplicate */
    const [exists]: any = await db.execute(
      "SELECT id FROM courses WHERE slug = ? LIMIT 1",
      [slug]
    );

    if (exists.length > 0) {
      return NextResponse.json(
        { error: "slug already exists" },
        { status: 409 }
      );
    }

    const jsonStr = JSON.stringify(courseData);

    const [result]: any = await db.execute(
      `INSERT INTO courses 
      (courseId, name, slug, description, courseData) 
      VALUES (?, ?, ?, ?, ?)`,
      [courseId, name, slug, description, jsonStr]
    );

    const newCourse = {
      id: result.insertId,
      courseId,
      name,
      slug,
      description,
      modules: courseData.modules,
      courseData,
    };

    return NextResponse.json(newCourse, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/courses error:", error);

    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 }
    );
  }
}