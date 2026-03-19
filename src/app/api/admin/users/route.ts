import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

/* ================= DB CONNECTION ================= */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
});

/* ================= ROLE NORMALIZER ================= */
function normalizeRole(role: string | null) {
  if (!role) return "";
  return role
    .toLowerCase()
    .trim()
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ");
}

function isSuperAdmin(role: string | null) {
  const r = normalizeRole(role);
  return (
    r === "super admin" ||
    r === "superadmin" ||
    r === "sa"
  );
}

/* =========================
   GET → LIST USERS
========================= */
export async function GET() {
  try {
    console.log("🚀 API HIT: /api/admin/users");

    const [rows]: any = await pool.execute(
      `SELECT id, name, email, role, photo, bio FROM users ORDER BY id DESC`
    );

    console.log("📦 RAW DB RESPONSE:", rows);
    console.log("📊 TOTAL USERS:", rows?.length);

    if (rows && rows.length > 0) {
      console.log("👤 SAMPLE USER:", rows[0]);
      console.log("🎭 USER ROLES:", rows.map((u: any) => u.role));
    } else {
      console.log("⚠️ NO USERS FOUND IN DATABASE");
    }

    const response = {
      success: true,
      data: rows || [],
    };

    console.log("📤 FINAL API RESPONSE:", response);

    return NextResponse.json(response);

  } catch (err) {
    console.error("❌ GET users error:", err);

    return NextResponse.json({
      success: false,
      message: "Failed to fetch users",
      error: String(err),
    });
  }
}

/* =========================
   POST → CREATE USER
========================= */
export async function POST(req: Request) {
  try {
    const roleHeader = req.headers.get("x-user-role");

    if (!isSuperAdmin(roleHeader)) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized: Only Super Admin can create users",
      }, { status: 403 });
    }

    const { name, email, password, role, bio, photo } =
      await req.json();

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: "Email & Password required",
      });
    }

    await pool.execute(
      `INSERT INTO users (name,email,password,role,bio,photo)
       VALUES (?,?,?,?,?,?)`,
      [name, email, password, role || "Admin", bio || null, photo || null]
    );

    return NextResponse.json({
      success: true,
      message: "User created",
    });
  } catch (err) {
    console.error("❌ CREATE error:", err);
    return NextResponse.json({
      success: false,
      message: "Create failed",
      error: String(err),
    });
  }
}

/* =========================
   PUT → UPDATE USER
========================= */
export async function PUT(req: Request) {
  try {
    const roleHeader = req.headers.get("x-user-role");

    if (!isSuperAdmin(roleHeader)) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized: Only Super Admin can update users",
      }, { status: 403 });
    }

    const { id, name, role, bio, photo } = await req.json();

    if (!id) {
      return NextResponse.json({
        success: false,
        message: "User ID required",
      });
    }

    await pool.execute(
      `UPDATE users 
       SET name=?, role=?, bio=?, photo=? 
       WHERE id=?`,
      [name, role, bio, photo, id]
    );

    return NextResponse.json({
      success: true,
      message: "User updated",
    });
  } catch (err) {
    console.error("❌ UPDATE error:", err);
    return NextResponse.json({
      success: false,
      message: "Update failed",
      error: String(err),
    });
  }
}

/* =========================
   DELETE → DELETE USER
========================= */
export async function DELETE(req: Request) {
  try {
    const roleHeader = req.headers.get("x-user-role");

    if (!isSuperAdmin(roleHeader)) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized: Only Super Admin can delete",
      }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({
        success: false,
        message: "User ID required",
      });
    }

    await pool.execute(`DELETE FROM users WHERE id=?`, [id]);

    return NextResponse.json({
      success: true,
      message: "User deleted",
    });
  } catch (err) {
    console.error("❌ DELETE error:", err);
    return NextResponse.json({
      success: false,
      message: "Delete failed",
      error: String(err),
    });
  }
}

/* =========================
   PATCH → CHANGE PASSWORD
========================= */
export async function PATCH(req: Request) {
  try {
    const roleHeader = req.headers.get("x-user-role");

    if (!isSuperAdmin(roleHeader)) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized: Only Super Admin can change password",
      }, { status: 403 });
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: "Email & password required",
      });
    }

    await pool.execute(
      `UPDATE users SET password=? WHERE email=?`,
      [password, email]
    );

    return NextResponse.json({
      success: true,
      message: "Password updated",
    });
  } catch (err) {
    console.error("❌ PASSWORD error:", err);
    return NextResponse.json({
      success: false,
      message: "Password update failed",
      error: String(err),
    });
  }
}