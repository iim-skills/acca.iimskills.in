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

/* ================= DELETE BATCH ================= */
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> } // 👈 params is Promise now
) {
  try {
    const { id } = await context.params; // ✅ MUST await

    const [result]: any = await pool.query(
      `DELETE FROM batch WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Batch not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Batch deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE BATCH ERROR:", error);
    return NextResponse.json(
      { error: "Failed to delete batch" },
      { status: 500 }
    );
  }
}

/* ================= UPDATE BATCH ================= */
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // ✅ MUST await
    const body = await req.json();

    const { name, level, type, startDate, maxStudents } = body;

    await pool.query(
      `UPDATE batch 
       SET name=?, level=?, type=?, startDate=?, maxStudents=? 
       WHERE id=?`,
      [name, level, type, startDate, maxStudents, id]
    );

    const [rows]: any = await pool.query(
      `SELECT * FROM batch WHERE id=?`,
      [id]
    );

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("UPDATE BATCH ERROR:", error);
    return NextResponse.json(
      { error: "Failed to update batch" },
      { status: 500 }
    );
  }
}
