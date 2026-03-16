import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

/* ================= DB POOL ================= */

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

/* ================= SAFE JSON ================= */

function safeParse(value: any, fallback: any) {
  try {
    if (!value) return fallback;
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch (err) {
    console.error("JSON PARSE ERROR:", err);
    return fallback;
  }
}

/* ================= GET STUDENTS ================= */

export async function GET() {
  try {

    /* ---------- STUDENTS ---------- */

    const [studentRows]: any = await pool.query(`
      SELECT id,name,email,phone,courses,status,enrolled_at
      FROM lms_students
      ORDER BY id DESC
    `);

    console.log("TOTAL STUDENTS:", studentRows.length);

    /* ---------- MODULES ---------- */

    const [moduleRows]: any = await pool.query(`
      SELECT module_id,module_name
      FROM lms_modules
    `);

    const moduleMap: Record<string, string> = {};

    moduleRows.forEach((m: any) => {
      moduleMap[String(m.module_id)] = m.module_name;
    });

    console.log("MODULE MAP:", moduleMap);

    /* ---------- FORMAT STUDENTS ---------- */

    const students = studentRows.map((r: any) => {

      console.log("RAW COURSES JSON:", r.courses);

      const courses = safeParse(r.courses, []);

      const formattedCourses = courses.map((course: any) => {

        console.log("COURSE OBJECT:", course);

        let modules: string[] = [];

        if (Array.isArray(course.modules)) {

          console.log("COURSE MODULE IDS:", course.modules);

          modules = course.modules.map((m: any) => {

            let moduleId = "";

            if (typeof m === "string") {
              moduleId = m.trim();
            }

            else if (typeof m === "number") {
              moduleId = String(m);
            }

            else if (typeof m === "object" && m !== null) {
              moduleId = m.module_id || m.id || "";
            }

            const moduleName = moduleMap[moduleId] || moduleId;

            console.log(`MODULE MAP RESULT: ${moduleId} → ${moduleName}`);

            return moduleName;

          });

        }

        return {
          course_slug: course.course_slug ?? "",
          course_title: course.course_title ?? "",
          modules,
          progress: course.progress ?? {},
          batch_id: course.batch_id ?? null,
          batch_name: course.batch_name ?? "",
          enrolled_at: course.enrolled_at ?? null,
        };

      });

      return {
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        courses: formattedCourses,
        status: r.status ?? "active",
        enrolledAt: r.enrolled_at,
      };

    });

    console.log("FINAL STUDENTS RESPONSE:", students);

    return NextResponse.json(students);

  } catch (error) {

    console.error("LMS STUDENTS API ERROR:", error);

    return NextResponse.json(
      { error: "Failed to load students" },
      { status: 500 }
    );
  }
}