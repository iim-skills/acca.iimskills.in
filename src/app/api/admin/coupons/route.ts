import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

/* ================= DB POOL ================= */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME, // iims_acca_iimskills
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
});

/* ================= GET ALL COUPONS ================= */
export async function GET() {
  try {
    const [rows]: any = await pool.query(
      `SELECT * FROM coupon ORDER BY id DESC`
    );

    return NextResponse.json({ coupons: rows });
  } catch (error) {
    console.error("GET COUPONS ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}

/* ================= CREATE COUPON ================= */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      code,
      type,
      value,
      expiry,
      applicability,
      moduleId,
      minModules,
      notes,
    } = body;

    if (!code || !type || value === undefined || !expiry) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await pool.query(
      `INSERT INTO coupon 
      (code,type,value,expiry,applicability,moduleId,minModules,notes)
      VALUES (?,?,?,?,?,?,?,?)`,
      [
        code.toUpperCase(),
        type,
        value,
        expiry,
        applicability || "all",
        moduleId || null,
        minModules || null,
        notes || null,
      ]
    );

    const [rows]: any = await pool.query(
      `SELECT * FROM coupon ORDER BY id DESC`
    );

    return NextResponse.json({ coupons: rows });
  } catch (error: any) {
    console.error("CREATE COUPON ERROR:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { error: "Coupon already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create coupon" },
      { status: 500 }
    );
  }
}

/* ================= UPDATE COUPON ================= */
export async function PUT(req: Request) {
  try {
    const body = await req.json();

    const {
      code,
      type,
      value,
      expiry,
      applicability,
      moduleId,
      minModules,
      notes,
    } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Code required" },
        { status: 400 }
      );
    }

    await pool.query(
      `UPDATE coupon SET
        type=?,
        value=?,
        expiry=?,
        applicability=?,
        moduleId=?,
        minModules=?,
        notes=?
       WHERE code=?`,
      [
        type,
        value,
        expiry,
        applicability || "all",
        moduleId || null,
        minModules || null,
        notes || null,
        code.toUpperCase(),
      ]
    );

    const [rows]: any = await pool.query(
      `SELECT * FROM coupon ORDER BY id DESC`
    );

    return NextResponse.json({ coupons: rows });
  } catch (error) {
    console.error("UPDATE COUPON ERROR:", error);
    return NextResponse.json(
      { error: "Failed to update coupon" },
      { status: 500 }
    );
  }
}

/* ================= DELETE COUPON ================= */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Code required" },
        { status: 400 }
      );
    }

    await pool.query(`DELETE FROM coupon WHERE code=?`, [
      code.toUpperCase(),
    ]);

    const [rows]: any = await pool.query(
      `SELECT * FROM coupon ORDER BY id DESC`
    );

    return NextResponse.json({ coupons: rows });
  } catch (error) {
    console.error("DELETE COUPON ERROR:", error);
    return NextResponse.json(
      { error: "Failed to delete coupon" },
      { status: 500 }
    );
  }
}
