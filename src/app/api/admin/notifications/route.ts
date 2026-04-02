import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

/* ================= DB ================= */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

/* ================= GET (LIST) ================= */
export async function GET() {
  console.log("📥 GET /api/admin/notifications called");

  try {
    const [rows] = await pool.execute(
      "SELECT * FROM notifications ORDER BY created_at DESC"
    );

    console.log("📦 Notifications fetched:", rows);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("❌ GET ERROR:", error);
    return NextResponse.json([], { status: 500 });
  }
}

/* ================= CREATE ================= */
export async function POST(req: Request) {
  console.log("📥 POST /api/admin/notifications called");

  try {
    const body = await req.json();
    console.log("📨 Incoming data:", body);

    const { title, message } = body;

    if (!title || !message) {
      console.warn("⚠️ Missing title or message");
      return NextResponse.json(
        { success: false, message: "Title & message required" },
        { status: 400 }
      );
    }

    const [result]: any = await pool.execute(
      "INSERT INTO notifications (title, message) VALUES (?, ?)",
      [title, message]
    );

    console.log("✅ Notification created with ID:", result.insertId);

    return NextResponse.json({
      success: true,
      id: result.insertId,
    });
  } catch (error) {
    console.error("❌ POST ERROR:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

/* ================= UPDATE ================= */
export async function PUT(req: Request) {
  console.log("📥 PUT /api/admin/notifications called");

  try {
    const body = await req.json();
    console.log("📨 Update data:", body);

    const { id, title, message } = body;

    if (!id) {
      console.warn("⚠️ Missing ID for update");
      return NextResponse.json(
        { success: false, message: "ID required" },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      "UPDATE notifications SET title = ?, message = ? WHERE id = ?",
      [title, message, id]
    );

    console.log("✅ Notification updated:", {
      id,
      title,
      message,
      result,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ PUT ERROR:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

/* ================= DELETE ================= */
export async function DELETE(req: Request) {
  console.log("📥 DELETE /api/admin/notifications called");

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    console.log("🗑️ Delete request ID:", id);

    if (!id) {
      console.warn("⚠️ Missing ID for delete");
      return NextResponse.json(
        { success: false, message: "ID required" },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      "DELETE FROM notifications WHERE id = ?",
      [id]
    );

    console.log("✅ Notification deleted:", { id, result });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ DELETE ERROR:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}