import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

/* ================= DB POOL ================= */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
});

/* ================= GET ALL BATCHES ================= */
export async function GET() {
  try {
    const [rows]: any = await pool.query(
      `SELECT * FROM batch ORDER BY id DESC`
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("GET BATCHES ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch batches" },
      { status: 500 }
    );
  }
}

/* ================= CREATE BATCH ================= */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      name,
      level,
      type, // Weekend or Weekdays
      startDate,
      maxStudents
    } = body;

    // Validation
    if (!name || !level || !type || !startDate || !maxStudents) {
      return NextResponse.json(
        { error: "Missing required fields: name, level, type, date, or capacity" },
        { status: 400 }
      );
    }

    // Insert into MySQL
    const [result]: any = await pool.query(
      `INSERT INTO batch 
      (name, level, type, startDate, maxStudents, currentStudents)
      VALUES (?, ?, ?, ?, ?, 0)`,
      [
        name,
        level,
        type,
        startDate,
        maxStudents
      ]
    );

    // Fetch the newly created batch to return to the UI
    const [newBatch]: any = await pool.query(
      `SELECT * FROM batch WHERE id = ?`,
      [result.insertId]
    );

    return NextResponse.json(newBatch[0]);
  } catch (error: any) {
    console.error("CREATE BATCH ERROR:", error);
    return NextResponse.json(
      { error: "Failed to create batch" },
      { status: 500 }
    );
  }
}

/* ================= DELETE BATCH ================= */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await pool.query(`DELETE FROM batch WHERE id = ?`, [id]);

    return NextResponse.json({ message: "Batch deleted successfully" });
  } catch (error) {
    console.error("DELETE BATCH ERROR:", error);
    return NextResponse.json({ error: "Failed to delete batch" }, { status: 500 });
  }
}