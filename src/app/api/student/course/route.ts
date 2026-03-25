import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function GET(req: Request) {
  try {
    const email = req.headers.get("x-user-email");

    console.log("=================================");
    console.log("🚀 STUDENT DASHBOARD API CALLED");
    console.log("📧 EMAIL:", email);

    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* ================= 1️⃣ FETCH STUDENT ================= */
    const [rows]: any = await db.query(
      `SELECT courses, progress FROM lms_students WHERE email = ? LIMIT 1`,
      [email]
    );

    if (!rows.length) return NextResponse.json([]);

    const student = rows[0];

    let courses: any[] = [];
    let progressData: any = {};

    try {
      courses = student.courses ? JSON.parse(student.courses) : [];
      if (!Array.isArray(courses)) courses = [];
    } catch {
      courses = [];
    }

    try {
      progressData = student.progress ? JSON.parse(student.progress) : {};
    } catch {
      progressData = {};
    }

    console.log("📚 COURSES:", courses);
    console.log("📊 PROGRESS:", progressData);

    /* ================= 🚨 CRITICAL FIX ================= */
    if (!courses.length) {
      console.log("⚠ No courses → skipping DB query");

      return NextResponse.json([]); // no crash
    }

    /* ================= 2️⃣ FETCH COURSE TITLES ================= */
    const slugs = courses.map((c: any) => c.course_slug).filter(Boolean);

    if (!slugs.length) {
      return NextResponse.json([]);
    }

    const [courseDetails]: any = await db.query(
      `
      SELECT slug AS course_slug, name AS course_title
      FROM courses
      WHERE slug IN (?)
      `,
      [slugs]
    );

    const titleMap: any = {};
    courseDetails.forEach((c: any) => {
      titleMap[c.course_slug] = c.course_title;
    });

    const progressKeys = Object.keys(progressData);

    /* ================= 3️⃣ PROCESS ================= */
    const formatted = courses.map((course: any, index: number) => {
      const slug = course.course_slug;
      const modules = course.modules || [];

      const totalModules = modules.length;

      const progressKey = progressKeys[index];
      const courseProgress = progressData[progressKey] || {};

      const completedModuleSet = new Set(
        Object.keys(courseProgress)
          .filter((k) => courseProgress[k]?.completed)
          .map((k) => k.split("_SUB")[0])
      );

      const completedModules = completedModuleSet.size;

      const progress =
        totalModules > 0
          ? Math.round((completedModules / totalModules) * 100)
          : 0;

      return {
        course_slug: slug,
        course_title: titleMap[slug] || slug,
        total_modules: totalModules,
        completed_modules: completedModules,
        progress,
        last_accessed: new Date().toISOString(),
      };
    });

    console.log("✅ FINAL:", formatted);
    console.log("=================================");

    return NextResponse.json(formatted);

  } catch (error) {
    console.error("❌ ERROR:", error);

    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}