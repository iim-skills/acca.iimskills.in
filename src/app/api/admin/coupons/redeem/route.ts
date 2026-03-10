import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      code,
      email,
      moduleId,
      selectedModulesCount,
      recordNow = true,
    } = body;

    if (!code) {
      return NextResponse.json({ error: "code required" }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "email required" }, { status: 400 });
    }

    /* ================= FETCH COUPON ================= */
    const [rows]: any = await pool.query(
      `SELECT * FROM coupon WHERE code=?`,
      [code.toUpperCase()]
    );

    const coupon = rows?.[0];
    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    /* ================= EXPIRY CHECK ================= */
    const today = new Date();
    const expiry = new Date(coupon.expiry);

    if (expiry < today) {
      return NextResponse.json({ error: "Coupon expired" }, { status: 400 });
    }

    /* ================= APPLICABILITY CHECK ================= */
    if (coupon.applicability === "single") {
      if (coupon.moduleId && moduleId !== coupon.moduleId) {
        return NextResponse.json(
          { error: "Coupon only valid for specific module" },
          { status: 400 }
        );
      }

      if (!moduleId) {
        return NextResponse.json(
          { error: "moduleId required for single coupon" },
          { status: 400 }
        );
      }
    }

    if (coupon.applicability === "min_modules") {
      const minReq = Number(coupon.minModules || 0);
      if (Number(selectedModulesCount || 0) < minReq) {
        return NextResponse.json(
          { error: `Select minimum ${minReq} modules` },
          { status: 400 }
        );
      }
    }

    /* ================= ONE TIME PER EMAIL CHECK ================= */
    const [used]: any = await pool.query(
      `SELECT id FROM coupon_redemption WHERE coupon_code=? AND email=? LIMIT 1`,
      [coupon.code, email]
    );

    if (used.length > 0) {
      return NextResponse.json(
        { error: "Coupon already used with this email" },
        { status: 400 }
      );
    }

    /* ================= RECORD REDEMPTION ================= */
    if (recordNow) {
      await pool.query(
        `INSERT INTO coupon_redemption (coupon_code,email,module_id)
         VALUES (?,?,?)`,
        [coupon.code, email, moduleId || null]
      );
    }

    return NextResponse.json({
      ok: true,
      discount: {
        type: coupon.type,
        value: Number(coupon.value),
      },
      coupon,
    });
  } catch (err) {
    console.error("COUPON REDEEM ERROR:", err);
    return NextResponse.json(
      { error: "Failed to validate coupon" },
      { status: 500 }
    );
  }
}
