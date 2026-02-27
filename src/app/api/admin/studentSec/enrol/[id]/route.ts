import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

/* ================= DB CONNECTION ================= */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

/* ==================================================
   GET STUDENT BY ID
================================================== */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  let conn;

  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    conn = await pool.getConnection();

    const [rows]: any = await conn.execute(
      `SELECT 
        id,
        name,
        email,
        phone,
        course_slug,
        course_title,
        modules,
        batch_id,
        batch_name,
        student_type
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

    // Safe JSON parse
    try {
      student.modules = JSON.parse(student.modules || "[]");
    } catch {
      student.modules = [];
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
   UPDATE STUDENT (ONLY EDITED FIELDS)
================================================== */
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  let conn;

  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const body = await req.json();

    // Map frontend keys -> DB columns
    const allowedFields: Record<string, string> = {
      name: "name",
      email: "email",
      phone: "phone",
      courseSlug: "course_slug",
      courseTitle: "course_title",
      modules: "modules",
      batchId: "batch_id",
      batchName: "batch_name",
      studentType: "student_type",
    };

    const updates: string[] = [];
    const values: any[] = [];

    for (const key in body) {
      if (allowedFields[key]) {
        let value = body[key];

        // Special handling
        if (key === "modules") {
          value = JSON.stringify(
            Array.isArray(value) ? value : []
          );
        }

        if (key === "batchId") {
          value =
            value === "" || value === undefined
              ? null
              : Number(value);
        }

        if (value === undefined) continue;

        updates.push(`${allowedFields[key]} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No fields provided to update" },
        { status: 400 }
      );
    }

    conn = await pool.getConnection();

    const sql = `
      UPDATE lms_students
      SET ${updates.join(", ")}
      WHERE id = ?
    `;

    values.push(id);

    const [result]: any = await conn.execute(sql, values);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Student updated successfully",
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