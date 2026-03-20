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

    const courses = student.courses ? JSON.parse(student.courses) : [];
    const progressData = student.progress ? JSON.parse(student.progress) : {};

    console.log("📚 COURSES:", courses);
    console.log("📊 PROGRESS:", progressData);

    const progressKeys = Object.keys(progressData);

    /* ================= 2️⃣ FETCH COURSE TITLES ================= */
    const slugs = courses.map((c: any) => c.course_slug);

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

    /* ================= 3️⃣ PROCESS ================= */
    const formatted = courses.map((course: any, index: number) => {
      const slug = course.course_slug;
      const modules = course.modules || [];

      const totalModules = modules.length;

      /* 🔥 KEY FIX: MAP BY INDEX */
      const progressKey = progressKeys[index]; // 👈 IMPORTANT
      const courseProgress = progressData[progressKey] || {};

      // Convert session → module
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

      /* ================= DEBUG ================= */
      console.log("------------ COURSE DEBUG ------------");
      console.log("📌 Course:", slug);
      console.log("🔑 Progress Key Used:", progressKey);
      console.log("📊 Raw Progress:", courseProgress);
      console.log("📈 Total Modules:", totalModules);
      console.log("✅ Completed Modules:", completedModules);
      console.log("📊 Progress:", progress + "%");
      console.log("-------------------------------------");

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