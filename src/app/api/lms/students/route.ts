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

export async function GET() {
  try {
    const [rows]: any = await pool.query(`
      SELECT
        id,
        name,
        email,
        phone,
        course_slug,
        course_title,
        modules,
        progress,
        status,
        enrolled_at
      FROM lms_students
      ORDER BY id DESC
    `);

    const students = rows.map((r: any) => {
      let parsedModules: string[] = [];
      let parsedProgress: any = {};

      try {
        parsedModules = r.modules ? JSON.parse(r.modules) : [];
      } catch {
        parsedModules = [];
      }

      try {
        parsedProgress = r.progress ? JSON.parse(r.progress) : {};
      } catch {
        parsedProgress = {};
      }

      return {
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        course: r.course_title,
        courseSlug: r.course_slug,
        assignedModules: parsedModules,
        progress: parsedProgress,
        status: r.status || "active",
        completed: r.status === "completed",
        enrolledAt: r.enrolled_at,
      };
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error("LMS STUDENTS API ERROR:", error);
    return NextResponse.json(
      { error: "Failed to load students" },
      { status: 500 }
    );
  }
}
