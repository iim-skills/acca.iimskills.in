import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

/* ================= DB POOL ================= */

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

/* ================= DELETE STUDENT ================= */

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // 👈 important
) {
  try {
    // ✅ FIX HERE
    const { id } = await params;
    const studentId = Number(id);

    if (!studentId) {
      return NextResponse.json(
        { error: "Invalid student ID" },
        { status: 400 }
      );
    }

    console.log("DELETE STUDENT ID:", studentId);

    const [result]: any = await pool.query(
      "DELETE FROM lms_students WHERE id = ?",
      [studentId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Student deleted successfully",
    });

  } catch (error) {
    console.error("DELETE ERROR:", error);

    return NextResponse.json(
      { error: "Failed to delete student" },
      { status: 500 }
    );
  }
}