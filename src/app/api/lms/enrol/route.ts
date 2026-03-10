// src/app/api/lms/enrol/route.ts
import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { sendMail } from "../../../../lib/email";

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

    /* 🔥 NEW BATCH FIELDS */
    const batchId = body?.batchId ?? null;
    const batchName = (body?.batchName ?? "").toString().trim();

    let modules: string[] = [];
    if (Array.isArray(body?.modules)) {
      modules = body.modules;
    }

    const courseTitleFromBody = (body?.courseTitle ?? "").toString().trim();
    const courseTitle = courseTitleFromBody || humanizeSlug(courseSlug);

    if (!emailRaw || !courseSlug) {
      return NextResponse.json({ error: "Missing email or courseSlug" }, { status: 400 });
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    /* ================= TABLE MIGRATION ================= */
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS lms_students (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(191) NOT NULL,
        email VARCHAR(191) NOT NULL,
        phone VARCHAR(50),
        login_id VARCHAR(191) NOT NULL,
        password VARCHAR(191) NOT NULL,
        course_slug VARCHAR(191) NOT NULL,
        course_title VARCHAR(255) NOT NULL,
        student_type ENUM('free','paid') DEFAULT 'free',
        modules JSON,
        progress JSON,
        batch_id INT NULL,
        batch_name VARCHAR(255) NULL,
        enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY ux_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const [existingRows]: any = await conn.execute(
      `SELECT id, student_type, login_id, password FROM lms_students WHERE email = ? LIMIT 1`,
      [emailRaw]
    );

    const modulesJson = JSON.stringify(modules || []);
    const progressJson = JSON.stringify({});

    let studentId: number | null = null;
    let loginId = emailRaw;
    let loginPassword = emailRaw;

    /* =========================================================
       EXISTING STUDENT
    ========================================================= */
    if (existingRows.length) {
      const existing = existingRows[0];
      studentId = existing.id;
      const wasFree = existing.student_type === "free";

      if (existing.login_id) loginId = existing.login_id;
      if (existing.password) loginPassword = existing.password;

      await conn.execute(
        `
        UPDATE lms_students
        SET
          name = ?,
          phone = ?,
          course_slug = ?,
          course_title = ?,
          modules = ?,
          student_type = 'paid',
          batch_id = ?,
          batch_name = ?,
          updated_at = NOW()
        WHERE id = ?
        `,
        [
          name || emailRaw.split("@")[0],
          phone || "",
          courseSlug,
          courseTitle,
          modulesJson,
          batchId,
          batchName,
          studentId,
        ]
      );

      /* 🔥 INCREMENT BATCH COUNT */
      if (batchId) {
        await conn.execute(
          `UPDATE batch 
           SET currentStudents = currentStudents + 1
           WHERE id = ?`,
          [batchId]
        );
      }

      await conn.commit();

      return NextResponse.json({
        ok: true,
        studentId,
        upgraded: wasFree,
      });
    }

    /* =========================================================
       NEW STUDENT
    ========================================================= */

    const [insertResult]: any = await conn.execute(
      `
      INSERT INTO lms_students
      (name,email,phone,login_id,password,course_slug,course_title,student_type,modules,progress,batch_id,batch_name,enrolled_at,updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'paid', ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        name || emailRaw.split("@")[0],
        emailRaw,
        phone || "",
        loginId,
        loginPassword,
        courseSlug,
        courseTitle,
        modulesJson,
        progressJson,
        batchId,
        batchName,
      ]
    );

    studentId = insertResult.insertId ?? null;

    /* 🔥 INCREMENT BATCH COUNT */
    if (batchId) {
      await conn.execute(
        `UPDATE batch 
         SET currentStudents = currentStudents + 1
         WHERE id = ?`,
        [batchId]
      );
    }

    await conn.commit();

    return NextResponse.json({
      ok: true,
      studentId,
      upgraded: false,
    });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("ENROL API ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally {
    try {
      if (conn) await conn.release();
    } catch {}
  }
}
