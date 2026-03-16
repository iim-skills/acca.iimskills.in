import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10
});

export async function GET(req: Request) {
  try {

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({
        success: false,
        message: "Email required"
      });
    }

    /* ===============================
       GET STUDENT
    =============================== */

    const [rows]: any = await pool.query(
      `SELECT courses FROM lms_students WHERE email = ? LIMIT 1`,
      [email]
    );

    if (!rows.length) {
      return NextResponse.json({
        success: false,
        assignedModules: []
      });
    }

    const courses = JSON.parse(rows[0].courses || "[]");

    /* ===============================
       COLLECT MODULES
    =============================== */

    let assignedModules: string[] = [];

    courses.forEach((course: any) => {
      if (Array.isArray(course.modules)) {
        assignedModules.push(...course.modules);
      }
    });

    /* remove duplicates */

    assignedModules = [...new Set(assignedModules)];

    return NextResponse.json({
      success: true,
      assignedModules
    });

  } catch (error) {

    console.error("Assigned Modules API Error:", error);

    return NextResponse.json({
      success: false,
      assignedModules: []
    });

  }
}