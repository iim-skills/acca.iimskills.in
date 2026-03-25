// File: app/api/enroll/route.ts

import { NextRequest, NextResponse } from "next/server";
import db from "../../../lib/db";
import nodemailer from "nodemailer";

const STUDENTS_TABLE = "lms_students";
const COURSES_TABLE = "courses";

type AnyObject = Record<string, any>;

function safeJsonParse<T>(value: any, fallback: T): T {
  try {
    if (value == null || value === "") return fallback;
    if (typeof value === "object") return value as T;
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeText(value: any) {
  return String(value ?? "").trim();
}

function normalizeSlug(value: any) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function extractModuleIds(courseData: any): string[] {
  const modules = courseData?.modules;
  if (!Array.isArray(modules)) return [];

  return modules
    .map((mod: any) => {
      if (typeof mod === "string") return mod.trim();
      return (
        normalizeText(mod?.moduleId) ||
        normalizeText(mod?.id) ||
        normalizeText(mod?.code) ||
        normalizeText(mod?.slug)
      );
    })
    .filter(Boolean);
}

function buildCourseAliases(input: string) {
  const raw = normalizeSlug(input);

  const aliasMap: Record<string, string> = {
    aak: "acca-applied-knowledge",
    aas: "acca-applied-skills-level",
    apl: "acca-professional-level",
  };

  return aliasMap[raw] || raw;
}

function getMailTransporter() {
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT || 587),
    secure: String(process.env.MAIL_SECURE || "false") === "true",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
}

function money(value: any) {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num.toFixed(2) : "0.00";
}

function buildStudentMailHtml(data: AnyObject) {
  const modulesList = Array.isArray(data.modules)
    ? data.modules.map((m: string) => `<li style="margin-bottom:6px;">${m}</li>`).join("")
    : "";

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
      <h2 style="margin:0 0 12px;">Upgrade Access Confirmed</h2>
      <p>Hi ${data.name},</p>
      <p>Your upgrade access has been activated successfully.</p>

      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:700px;">
        <tr><td style="padding:8px 0;"><strong>Course</strong></td><td>${data.courseTitle}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Course Slug</strong></td><td>${data.courseSlug}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Program Type</strong></td><td>${data.programType || "-"}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Program Name</strong></td><td>${data.programName || "-"}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Fee</strong></td><td>₹${money(data.fee)}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Discount</strong></td><td>₹${money(data.discount)}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Payable</strong></td><td>₹${money(data.payableFee)}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Batch</strong></td><td>${data.batchName || "-"} (${data.batchId || "-"})</td></tr>
        <tr><td style="padding:8px 0;"><strong>Login ID</strong></td><td>${data.loginId}</td></tr>
      </table>

      <h3 style="margin:20px 0 10px;">Modules Included</h3>
      <ul style="padding-left:20px;margin:0;">${modulesList || "<li>No modules found</li>"}</ul>

      <h3 style="margin:20px 0 10px;">Your Details</h3>
      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:700px;">
        <tr><td style="padding:8px 0;"><strong>Name</strong></td><td>${data.name}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Email</strong></td><td>${data.email}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Phone</strong></td><td>${data.phone}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Address</strong></td><td>${data.address || "-"}</td></tr>
        <tr><td style="padding:8px 0;"><strong>City/State</strong></td><td>${data.cityState || "-"}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Pincode</strong></td><td>${data.pincode || "-"}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Country</strong></td><td>${data.country || "-"}</td></tr>
      </table>

      <p style="margin-top:20px;">Thank you,<br/>Team</p>
    </div>
  `;
}

function buildAdminMailHtml(data: AnyObject) {
  const modulesList = Array.isArray(data.modules)
    ? data.modules.map((m: string) => `<li style="margin-bottom:6px;">${m}</li>`).join("")
    : "";

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
      <h2 style="margin:0 0 12px;">New Upgrade Access Enquiry</h2>
      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:900px;">
        <tr><td style="padding:8px 0;"><strong>Name</strong></td><td>${data.name}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Email</strong></td><td>${data.email}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Phone</strong></td><td>${data.phone}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Course</strong></td><td>${data.courseTitle}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Course Slug</strong></td><td>${data.courseSlug}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Program Type</strong></td><td>${data.programType || "-"}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Program Name</strong></td><td>${data.programName || "-"}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Fee</strong></td><td>₹${money(data.fee)}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Discount</strong></td><td>₹${money(data.discount)}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Coupon Code</strong></td><td>${data.couponCode || "-"}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Payable Fee</strong></td><td>₹${money(data.payableFee)}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Batch ID</strong></td><td>${data.batchId || "-"}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Batch Name</strong></td><td>${data.batchName || "-"}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Login ID</strong></td><td>${data.loginId}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Address</strong></td><td>${data.address || "-"}</td></tr>
        <tr><td style="padding:8px 0;"><strong>City/State</strong></td><td>${data.cityState || "-"}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Pincode</strong></td><td>${data.pincode || "-"}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Country</strong></td><td>${data.country || "-"}</td></tr>
      </table>

      <h3 style="margin:20px 0 10px;">Modules</h3>
      <ul style="padding-left:20px;margin:0;">${modulesList || "<li>No modules found</li>"}</ul>
    </div>
  `;
}

export async function POST(req: NextRequest) {
  let connection: any;

  try {
    const body = await req.json();

    console.log("Received enrollment data:", body);

    const name = normalizeText(body.name);
    const email = normalizeText(body.email).toLowerCase();
    const phone = normalizeText(body.phone);

    const rawCourseInput =
      body.url ||
      body.course_slug ||
      body.course ||
      body.courseSlug ||
      "";

    const courseSlug = buildCourseAliases(rawCourseInput);
    const courseName = normalizeText(body.courseName || body.course_title || "");

    const batchId = normalizeText(body.batch_id || body.batchId || "3");
    const batchName = normalizeText(body.batch_name || body.batchName || "JUlYWEEKEND");

    const programType = normalizeText(body.programType || body.program || "");
    const programName = normalizeText(body.programName || "");
    const fee = Number(body.fee || 0);
    const discount = Number(body.discount || 0);
    const couponCode = normalizeText(body.couponCode || "");
    const address = normalizeText(body.address || "");
    const pincode = normalizeText(body.pincode || "");
    const cityState = normalizeText(body.cityState || "");
    const country = normalizeText(body.country || "");

    const loginId = normalizeText(body.login_id || email);
    const password = body.password ? String(body.password) : null;

    if (!name || !email || !phone || !courseSlug) {
      return NextResponse.json(
        { error: "Name, email, phone, and course are required" },
        { status: 400 }
      );
    }

    connection = await db.getConnection();
    console.log("✅ MySQL Connected");

    await connection.beginTransaction();

    // 1) Find the course in courses table
    let courseRow: any = null;

    const [slugRows]: any = await connection.execute(
      `
      SELECT id, courseId, slug, name, description, courseData
      FROM ${COURSES_TABLE}
      WHERE LOWER(slug) = LOWER(?)
      LIMIT 1
      `,
      [courseSlug]
    );

    if (slugRows?.length) {
      courseRow = slugRows[0];
    } else if (courseName) {
      const [nameRows]: any = await connection.execute(
        `
        SELECT id, courseId, slug, name, description, courseData
        FROM ${COURSES_TABLE}
        WHERE LOWER(name) = LOWER(?)
           OR LOWER(name) LIKE LOWER(CONCAT('%', ?, '%'))
        LIMIT 1
        `,
        [courseName, courseName]
      );

      if (nameRows?.length) {
        courseRow = nameRows[0];
      }
    }

    if (!courseRow) {
      throw new Error(
        `Course not found in ${COURSES_TABLE}. Tried slug="${courseSlug}" name="${courseName}"`
      );
    }

    const courseData = safeJsonParse<any>(courseRow.courseData, {});
    const modules = extractModuleIds(courseData);

    const newCourseItem = {
      course_slug: normalizeSlug(courseRow.slug || courseSlug),
      course_title: normalizeText(courseRow.name || courseName || courseRow.slug || courseSlug),
      modules,
      progress: {},
      batch_id: batchId,
      batch_name: batchName,
    };

    const payableFee = Math.max(fee - discount, 0);

    // 2) Check if student already exists
    const [existingRows]: any = await connection.execute(
      `SELECT id, courses FROM ${STUDENTS_TABLE} WHERE email = ? LIMIT 1`,
      [email]
    );

    const existingStudent = existingRows?.[0];

    let savedCourses: any[] = [];

    if (!existingStudent) {
      const coursesToSave = [newCourseItem];
      savedCourses = coursesToSave;

      await connection.execute(
        `
        INSERT INTO ${STUDENTS_TABLE}
          (name, email, phone, login_id, password, courses)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [name, email, phone, loginId, password, JSON.stringify(coursesToSave)]
      );
    } else {
      let existingCourses = safeJsonParse<any[]>(existingStudent.courses, []);
      if (!Array.isArray(existingCourses)) existingCourses = [];

      const courseIndex = existingCourses.findIndex(
        (c: any) => normalizeSlug(c?.course_slug) === normalizeSlug(newCourseItem.course_slug)
      );

      if (courseIndex >= 0) {
        existingCourses[courseIndex] = {
          ...existingCourses[courseIndex],
          ...newCourseItem,
        };
      } else {
        existingCourses.push(newCourseItem);
      }

      savedCourses = existingCourses;

      await connection.execute(
        `
        UPDATE ${STUDENTS_TABLE}
        SET
          name = ?,
          phone = ?,
          login_id = ?,
          password = COALESCE(?, password),
          courses = ?
        WHERE email = ?
        `,
        [name, phone, loginId, password, JSON.stringify(existingCourses), email]
      );
    }

    await connection.commit();

    // 3) Send mails after DB commit
    const mailResults: any = {
      userMail: false,
      adminMail: false,
      error: null,
    };

    try {
      const transporter = getMailTransporter();

      const mailPayload = {
        name,
        email,
        phone,
        courseSlug: newCourseItem.course_slug,
        courseTitle: newCourseItem.course_title,
        programType,
        programName,
        fee,
        discount,
        couponCode,
        payableFee,
        batchId,
        batchName,
        loginId,
        address,
        pincode,
        cityState,
        country,
        modules,
      };

      const fromEmail =
        process.env.MAIL_FROM ||
        process.env.SMTP_USER ||
        "";

      const adminEmail = process.env.ADMIN_EMAIL || "";

      const sendUserMail = transporter.sendMail({
        from: fromEmail,
        to: email,
        subject: `Upgrade Access Confirmed - ${newCourseItem.course_title}`,
        html: buildStudentMailHtml(mailPayload),
      });

      const sendAdminMail = adminEmail
        ? transporter.sendMail({
            from: fromEmail,
            to: adminEmail,
            subject: `New Upgrade Access - ${name} - ${newCourseItem.course_title}`,
            html: buildAdminMailHtml(mailPayload),
          })
        : Promise.resolve(null);

      const [userRes, adminRes] = await Promise.allSettled([sendUserMail, sendAdminMail]);

      mailResults.userMail = userRes.status === "fulfilled";
      mailResults.adminMail = adminRes.status === "fulfilled";

      if (userRes.status === "rejected") {
        console.error("User mail error:", userRes.reason);
      }

      if (adminRes.status === "rejected") {
        console.error("Admin mail error:", adminRes.reason);
      }
    } catch (mailErr) {
      console.error("Mail send error:", mailErr);
      mailResults.error = "Mail service failed";
    }

    return NextResponse.json({
      success: true,
      message: existingStudent ? "Student updated successfully" : "Student created successfully",
      data: {
        name,
        email,
        phone,
        loginId,
        courseSlug: newCourseItem.course_slug,
        courseTitle: newCourseItem.course_title,
        programType,
        programName,
        fee,
        discount,
        payableFee,
        couponCode,
        address,
        pincode,
        cityState,
        country,
        batchId,
        batchName,
        courses: savedCourses,
      },
      mails: mailResults,
    });
  } catch (error: any) {
    if (connection) {
      try {
        await connection.rollback();
      } catch {}
    }

    console.error("Error in enroll API:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to save enrollment",
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}