import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

/* ================= DB CONNECTION ================= */

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
});

/* ==================================================
   GET STUDENT (FOR EDIT PANEL)
================================================== */

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  let conn;

  try {
    const { id } = await context.params;

    conn = await pool.getConnection();

    const [rows]: any = await conn.execute(
      `SELECT id,name,email,phone,courses
       FROM lms_students
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    if (!rows.length) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    const student = rows[0];

    try {
      student.courses =
        typeof student.courses === "string"
          ? JSON.parse(student.courses || "[]")
          : student.courses || [];
    } catch {
      student.courses = [];
    }

    return NextResponse.json({
      ok: true,
      student,
    });

  } catch (error) {
    console.error("GET STUDENT ERROR:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}

/* ==================================================
   UPDATE STUDENT
================================================== */

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  let conn;

  try {
    const { id } = await context.params;
    const body = await req.json();

    const name = body?.name ?? null;
    const email = body?.email ?? null;
    const phone = body?.phone ?? null;

    const courseSlugs: string[] = Array.isArray(body?.courseSlugs)
      ? body.courseSlugs
      : [];

    const modulesMap: Record<string, string[]> =
      body?.modulesMap ?? {};

    const batchIds: string[] = Array.isArray(body?.batchIds)
      ? body.batchIds
      : [];

    const batchName = body?.batchName ?? "";

    conn = await pool.getConnection();

    /* ================= LOAD EXISTING COURSES ================= */

    const [rows]: any = await conn.execute(
      `SELECT courses FROM lms_students WHERE id = ? LIMIT 1`,
      [id]
    );

    if (!rows.length) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    let existingCourses: any[] = [];

    try {
      existingCourses =
        typeof rows[0].courses === "string"
          ? JSON.parse(rows[0].courses)
          : rows[0].courses || [];
    } catch {
      existingCourses = [];
    }

    /* ================= BUILD UPDATED COURSES ================= */

    const updatedCourses: any[] = [];

    for (const slug of courseSlugs) {
      const existing = existingCourses.find(
        (c: any) => c.course_slug === slug
      );

      const modules = Array.isArray(modulesMap[slug])
        ? modulesMap[slug]
        : [];

      const batchId = batchIds.length ? batchIds[0] : null;

      if (existing) {
        updatedCourses.push({
          ...existing,
          modules,
          batch_id: batchId,
          batch_name: batchName,
        });
      } else {
        updatedCourses.push({
          course_slug: slug,
          course_title: slug,
          modules,
          progress: {},
          batch_id: batchId,
          batch_name: batchName,
        });
      }
    }

    /* ================= UPDATE STUDENT ================= */

    await conn.execute(
      `
      UPDATE lms_students
      SET 
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        courses = ?,
        updated_at = NOW()
      WHERE id = ?
      `,
      [
        name,
        email,
        phone,
        JSON.stringify(updatedCourses),
        id,
      ]
    );

    return NextResponse.json({
      ok: true,
      message: "Student updated successfully",
      courses: updatedCourses,
    });

  } catch (error: any) {
    console.error("PUT STUDENT ERROR:", error);

    return NextResponse.json(
      { error: "Server error", detail: error.message },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}