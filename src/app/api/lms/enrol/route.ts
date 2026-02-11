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
 * Behaviour:
 * - If email exists:
 *   - If student_type === 'free' => upgrade to paid, ensure login_id/password exist, send UPGRADE email (with credentials)
 *   - If student_type === 'paid' => update modules/course info (no upgrade email by default)
 * - If email does not exist:
 *   - Insert new paid user and send WELCOME email (with credentials)
 *
 * Note: This keeps progress (because email is the unique key) and avoids duplicate rows.
 */

export async function POST(req: Request) {
  let conn: any;
  try {
    const body = await req.json();

    const name = (body?.name ?? "").toString().trim();
    const emailRaw = (body?.email ?? "").toString().trim().toLowerCase();
    const phone = (body?.phone ?? "").toString().trim();
    const courseSlug = (body?.courseSlug ?? "").toString().trim();

    let modules: string[] = [];
    if (Array.isArray(body?.modules)) {
      modules = body.modules;
    } else if (typeof body?.modules === "string" && body.modules.trim() !== "") {
      try {
        const parsed = JSON.parse(body.modules);
        if (Array.isArray(parsed)) modules = parsed;
        else modules = body.modules.split(",").map((s: string) => s.trim()).filter(Boolean);
      } catch {
        modules = body.modules.split(",").map((s: string) => s.trim()).filter(Boolean);
      }
    }

    const courseTitleFromBody = (body?.courseTitle ?? "").toString().trim();
    const courseTitle = courseTitleFromBody || humanizeSlug(courseSlug);

    if (!emailRaw || !courseSlug) {
      return NextResponse.json({ error: "Missing email or courseSlug" }, { status: 400 });
    }

    conn = await pool.getConnection();

    // Ensure table exists (idempotent) - keeps your previous behaviour
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
        enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY ux_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // check existing user (get login_id & password if present)
    const [existingRows]: any = await conn.execute(
      `SELECT id, student_type, login_id, password FROM lms_students WHERE email = ? LIMIT 1`,
      [emailRaw]
    );

    const modulesJson = JSON.stringify(modules || []);
    const progressJson = JSON.stringify({});

    let studentId: number | null = null;
    let loginId = emailRaw;
    let loginPassword = emailRaw; // legacy default (you may change to random + force reset)

    const now = new Date();

    // If user exists -> update (upgrade if free)
    if (existingRows && existingRows.length) {
      const existing = existingRows[0];
      studentId = existing.id;
      const wasFree = existing.student_type === "free";

      // if existing login_id/password exist, prefer them
      if (existing.login_id) loginId = existing.login_id;
      if (existing.password) loginPassword = existing.password;

      // If password is empty (very unlikely) set to emailRaw and persist it
      if (!existing.password || existing.password.trim() === "") {
        loginPassword = emailRaw;
        await conn.execute(`UPDATE lms_students SET password = ? WHERE id = ?`, [loginPassword, studentId]);
      }

      // Update student: set student_type to paid (if was free) and update modules/course info
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
          updated_at = NOW()
        WHERE id = ?
        `,
        [
          name || emailRaw.split("@")[0],
          phone || "",
          courseSlug,
          courseTitle,
          modulesJson,
          studentId,
        ]
      );

      // Send UPGRADE email only when user was FREE and now upgraded
      if (wasFree) {
        try {
          const baseUrl = process.env.BASE_URL || "https://iimskills.com";
          const changePasswordUrl = `${baseUrl.replace(/\/$/, "")}/change-password`;

          const html = `<!doctype html>
            <html>
              <head><meta charset="utf-8" /></head>
              <body>
                <h2>Your access has been upgraded — ${courseTitle}</h2>
                <p>Hi ${name || loginId.split("@")[0]},</p>
                <p>Your free account (${emailRaw}) has been upgraded to <strong>paid access</strong> for <strong>${courseTitle}</strong>.</p>
                <h3>Login details</h3>
                <p><strong>Login ID:</strong> ${loginId}</p>
                <p><strong>Password:</strong> ${loginPassword}</p>
                <p>Please change your password after first login: <a href="${changePasswordUrl}">${changePasswordUrl}</a></p>
                <h4>Assigned Modules</h4>
                <ul>
                  ${(modules.length ? modules.map(m => `<li>${m}</li>`).join("") : "<li>None</li>")}
                </ul>
                <p>If you have issues, reply to this email.</p>
                <hr />
                <p>Team IIM SKILLS</p>
              </body>
            </html>`;

          await sendMail(emailRaw, `Access upgraded: ${courseTitle} | IIM SKILLS`, html);
          console.log("Upgrade email sent to", emailRaw);
        } catch (mailErr) {
          console.warn("Upgrade email failed:", mailErr);
        }
      }

      console.log("✅ Existing user updated/upgraded:", emailRaw);
      return NextResponse.json({
        ok: true,
        studentId,
        email: emailRaw,
        courseSlug,
        courseTitle,
        modules,
        upgraded: wasFree,
      });
    }

    // If user does not exist -> create new paid user and send welcome email (with credentials)
    const [insertResult]: any = await conn.execute(
      `
      INSERT INTO lms_students
      (name,email,phone,login_id,password,course_slug,course_title,student_type,modules,progress,enrolled_at,updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'paid', ?, ?, NOW(), NOW())
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
      ]
    );

    studentId = insertResult.insertId ?? null;

    // Send welcome email for newly created paid user (non-blocking)
    try {
      const baseUrl = process.env.BASE_URL || "https://iimskills.com";
      const changePasswordUrl = `${baseUrl.replace(/\/$/, "")}/change-password`;

      const html = `<!doctype html>
        <html>
          <head><meta charset="utf-8" /></head>
          <body>
            <h2>Welcome to ${courseTitle}!</h2>
            <p>Hi ${name || loginId.split("@")[0]},</p>
            <p>You've been enrolled in <strong>${courseTitle}</strong> at IIM SKILLS.</p>
            <h3>Your Login Details</h3>
            <p><strong>Login ID:</strong> ${loginId}</p>
            <p><strong>Password:</strong> ${loginPassword}</p>
            <h4>Assigned Modules</h4>
            <ul>
              ${(modules.length ? modules.map(m => `<li>${m}</li>`).join("") : "<li>None</li>")}
            </ul>
            <p>Please change your password after first login: <a href="${changePasswordUrl}">${changePasswordUrl}</a></p>
            <hr />
            <p>Team IIM SKILLS</p>
          </body>
        </html>`;

      await sendMail(emailRaw, `Welcome to ${courseTitle} | IIM SKILLS`, html);
      console.log("Welcome email sent to", emailRaw);
    } catch (mailErr) {
      console.warn("Welcome email failed:", mailErr);
    }

    return NextResponse.json({
      ok: true,
      studentId,
      email: emailRaw,
      courseSlug,
      courseTitle,
      modules,
      upgraded: false,
    });
  } catch (err) {
    console.error("ENROL API ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally {
    try {
      if (conn) await conn.release();
    } catch {}
  }
}
