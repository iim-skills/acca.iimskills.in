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

/**
 * NOTE (security): current legacy behavior stores the initial password as the email.
 * For production you should hash passwords (bcrypt) or generate a random one and force password reset.
 */

export async function POST(req: Request) {
  let conn: any;
  try {
    const body = await req.json();

    const name = (body?.name ?? "").toString().trim();
    const emailRaw = (body?.email ?? "").toString().trim().toLowerCase();
    const phone = (body?.phone ?? "").toString().trim();
    const courseSlug = (body?.courseSlug ?? "").toString().trim();

    // Prefer explicit courseTitle from request; otherwise map or humanize slug
    const courseTitleInput = (body?.courseTitle ?? "").toString().trim();

    // Accept modules either as array or JSON string
    let modules: string[] = [];
    if (Array.isArray(body?.modules)) {
      modules = body.modules;
    } else if (typeof body?.modules === "string" && body.modules.trim() !== "") {
      try {
        const parsed = JSON.parse(body.modules);
        if (Array.isArray(parsed)) modules = parsed;
      } catch {
        // fallback: treat comma-separated string
        modules = body.modules.split(",").map((s: string) => s.trim()).filter(Boolean);
      }
    }

    // Add explicit mappings here if needed
    const slugToTitleMap: Record<string, string> = {
      "free-data-analytics-course": "Free Data Analytics Course",
      // add more mappings as needed
    };

    const courseTitle =
      courseTitleInput || slugToTitleMap[courseSlug] || humanizeSlug(courseSlug);

    if (!emailRaw || !courseSlug) {
      return NextResponse.json({ error: "Missing email or courseSlug" }, { status: 400 });
    }

    conn = await pool.getConnection();

    // Auto-create table if not exists (idempotent)
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
        modules JSON,
        progress JSON,
        enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'active',
        UNIQUE KEY ux_email_course (email, course_slug)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    /* ----------------------------------------
       Prevent duplicate enrollment (email + course)
    ---------------------------------------- */
    const [existingRows]: any = await conn.execute(
      `SELECT id FROM lms_students WHERE email = ? AND course_slug = ? LIMIT 1`,
      [emailRaw, courseSlug]
    );

    if (existingRows && existingRows.length) {
      return NextResponse.json({ exists: true, error: "Already enrolled" }, { status: 409 });
    }

    /* ----------------------------------------
       Insert enrollment
    ---------------------------------------- */
    const loginPassword = emailRaw; // legacy behavior (plaintext). Consider changing.
    const loginId = emailRaw;

    const modulesJson = modules.length ? JSON.stringify(modules) : JSON.stringify([]);

    // empty progress object (can be extended later)
    const progressJson = JSON.stringify({});

    const [insertResult]: any = await conn.execute(
      `INSERT INTO lms_students
        (name, email, phone, login_id, password, course_slug, course_title, modules, progress, enrolled_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
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
      ]
    );

    /* ----------------------------------------
       Send Welcome Email (Non-blocking)
    ---------------------------------------- */
    try {
      const baseUrl = process.env.BASE_URL || "https://iimskills.com";
      const changePasswordUrl = `${baseUrl.replace(/\/$/, "")}/change-password`;

      await sendMail(
        emailRaw,
        `Welcome to ${courseTitle} | IIM SKILLS`,
        `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body>
      <h2>Welcome to ${courseTitle}!</h2>
      <p>Hi ${name || emailRaw.split("@")[0]},</p>
      <p>You've been enrolled in <strong>${courseTitle}</strong> at IIM SKILLS.</p>
      <h3>Your Login Details</h3>
      <p><strong>Login ID:</strong> ${loginId}</p>
      <p><strong>Password:</strong> ${loginPassword}</p>
      <p>Assigned Modules:</p>
      <ul>
        ${(modules.length ? modules.map(m => `<li>${m}</li>`).join("") : "<li>None</li>")}
      </ul>
      <p>Enroll Date: ${new Date().toLocaleString()}</p>
      <p>Please change your password after first login: <a href="${changePasswordUrl}">${changePasswordUrl}</a></p>
      <hr />
      <p>Team IIM SKILLS</p>
    </body>
    </html>
    `
      );
    } catch (mailErr) {
      console.warn("⚠ Welcome email failed:", mailErr);
      // do not fail the enrollment if email sending fails
    }

    return NextResponse.json({
      ok: true,
      insertId: insertResult.insertId ?? insertResult.insert_id ?? null,
      email: emailRaw,
      courseSlug,
      courseTitle,
      modules,
    });
  } catch (err) {
    console.error("ENROL API ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally {
    try {
      if (conn) {
        await conn.release();
      }
    } catch {}
  }
}
