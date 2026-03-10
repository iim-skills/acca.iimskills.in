import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

/* ---------- SAFE JSON ---------- */
function safeParse(value: any, fallback: any) {
  try {
    if (!value) return fallback;
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return fallback;
  }
}

/* ---------- GET STUDENT ---------- */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const [rows]: any = await pool.query(
    `SELECT
      name,
      email,
      course_slug,
      course_title,
      batch_name,
      batch_id,
      modules,
      status
     FROM lms_students
     WHERE email = ?
     LIMIT 1`,
    [email]
  );

  if (!rows.length) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const s = rows[0];

  return NextResponse.json({
    name: s.name,
    email: s.email,
    courseSlug: s.course_slug,
    course: s.course_title,
    batchName: s.batch_name,
    batchId: s.batch_id,
    assignedModules: safeParse(s.modules, []),
    status: s.status ?? "active",
  });
}

/* ---------- UPDATE STUDENT ---------- */
export async function PUT(req: Request) {
  const body = await req.json();

  if (!body.email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const email = body.email;

  // Get existing student
  const [rows]: any = await pool.query(
    `SELECT modules, course_slug, course_title, batch_name, batch_id, status
     FROM lms_students WHERE email=? LIMIT 1`,
    [email]
  );

  if (!rows.length) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const current = rows[0];

  let modules = safeParse(current.modules, []);

  /* ---------- MODULE ACTIONS ---------- */

  // Replace modules fully
  if (Array.isArray(body.modules)) {
    modules = body.modules;
  }

  // Add module
  if (body.addModule) {
    const exists = modules.find(
      (m: any) => m.moduleId === body.addModule.moduleId
    );
    if (!exists) modules.push(body.addModule);
  }

  // Remove module
  if (body.removeModuleId) {
    modules = modules.filter(
      (m: any) => m.moduleId !== body.removeModuleId
    );
  }

  /* ---------- COURSE CHANGE ---------- */
  let courseSlug = current.course_slug;
  let courseTitle = current.course_title;

  if (body.course) {
    courseSlug = body.course.slug ?? courseSlug;
    courseTitle = body.course.title ?? courseTitle;
  }

  /* ---------- BATCH CHANGE ---------- */
  const batchName = body.batchName ?? current.batch_name ?? null;
  const batchId = body.batchId ?? current.batch_id ?? null;

  /* ---------- STATUS ---------- */
  const status = body.status ?? current.status ?? "active";

  /* ---------- UPDATE QUERY ---------- */
  await pool.query(
    `UPDATE lms_students
     SET
       modules = ?,
       course_slug = ?,
       course_title = ?,
       batch_name = ?,
       batch_id = ?,
       status = ?,
       updated_at = NOW()
     WHERE email = ?`,
    [
      JSON.stringify(modules),
      courseSlug,
      courseTitle,
      batchName,
      batchId,
      status,
      email,
    ]
  );

  return NextResponse.json({
    ok: true,
    email,
    courseSlug,
    courseTitle,
    batchName,
    batchId,
    assignedModules: modules,
    status,
  });
}