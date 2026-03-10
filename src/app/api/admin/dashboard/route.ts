import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

export const runtime = "nodejs";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

/* ================= SAFE QUERY HELPER ================= */
async function safeQuery(conn: any, query: string) {
  try {
    const [rows]: any = await conn.query(query);
    return rows?.[0] ?? null;
  } catch (error) {
    console.error("Dashboard Query Error:", error);
    return null; // return null if query fails
  }
}

export async function GET() {
  const conn = await pool.getConnection();

  try {
    // 1. Fetch Course Count
    const courses = await safeQuery(
      conn,
      `
      SELECT COUNT(*) as totalCourses 
      FROM courses
      `
    );

    // 2. Fetch Batch Metrics (Active vs Upcoming)
    const batches = await safeQuery(
      conn,
      `
      SELECT 
        COUNT(*) as totalBatches,
        SUM(CASE WHEN startDate <= CURDATE() THEN 1 ELSE 0 END) as activeBatches,
        SUM(CASE WHEN startDate > CURDATE() THEN 1 ELSE 0 END) as upcomingBatches
      FROM batch
      `
    );

    // 3. Fetch Student Count
    const students = await safeQuery(
      conn,
      `
      SELECT COUNT(*) as totalStudents 
      FROM lms_students
      `
    );

    // 4. Fetch Quiz Count
    const quiz = await safeQuery(
      conn,
      `
      SELECT COUNT(*) as totalQuiz 
      FROM quizzes
      `
    );

    // 5. Fetch Video Count
    const videos = await safeQuery(
      conn,
      `
      SELECT COUNT(*) as totalVideos 
      FROM videos
      `
    );

    // 6. Fetch Coupon Metrics (Active vs Expired)
    const coupons = await safeQuery(
      conn,
      `
      SELECT 
        COUNT(*) as totalCoupons,
        SUM(CASE WHEN expiry >= CURDATE() THEN 1 ELSE 0 END) as activeCoupons,
        SUM(CASE WHEN expiry < CURDATE() THEN 1 ELSE 0 END) as expiredCoupons
      FROM coupon
      `
    );

    // 7. Fetch Mentor Slot Metrics using JSON_TABLE for nested slot data
    const mentorSlots = await safeQuery(
  conn,
  `
  SELECT
    COUNT(jt.time) as totalSlots,
    SUM(jt.capacity) as totalCapacity,
    SUM(jt.booked) as filledSlots
  FROM mentor_slots,
  JSON_TABLE(
    slot_times,
    '$[*]' COLUMNS (
      time TIME PATH '$.time',
      capacity INT PATH '$.capacity',
      booked INT PATH '$.booked'
    )
  ) jt
  `
);
    return NextResponse.json({
      courses,
      batches,
      students,
      quiz,
      videos,
      coupons,
      mentorSlots,
    });

  } catch (err) {
    console.error("Dashboard Fatal Error:", err);

    // Fallback safe response to prevent frontend crashes
    return NextResponse.json({
      courses: null,
      batches: null,
      students: null,
      quiz: null,
      videos: null,
      coupons: null,
      mentorSlots: null,
    });
  } finally {
    conn.release();
  }
}