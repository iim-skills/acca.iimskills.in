import { NextRequest, NextResponse } from "next/server";
import db from "../../../../../utils/db";

// Helper: safely parse JSON fields stored as strings in DB
function safeParseArray(value: any): any[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // If it's a plain comma separated string, split it
      return value
        .split?.(",")
        .map((s: string) => s.trim())
        .filter(Boolean) || [];
    }
  }
  return [];
}

// ======================================================
// GET → Fetch logged-in user (via cookie email)
// ======================================================
export async function GET(req: NextRequest) {
  try {
    const email = req.cookies.get("email")?.value;
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [rows]: any = await db.query(
      "SELECT id, username, name, email, role, bio, expertIn, education, photo, authordesig FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = rows[0];

    return NextResponse.json(
      {
        ...user,
        education: safeParseArray(user.education),
        expertIn: safeParseArray(user.expertIn),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /api/admin/users/me Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch user details" },
      { status: 500 }
    );
  }
}

// ======================================================
// PUT → Update logged-in user (via cookie email)
// ======================================================
export async function PUT(req: NextRequest) {
  try {
    const email = req.cookies.get("email")?.value;
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      bio,
      photo,
      expertIn,
      education,
      authordesig,
      role,
      password,
    } = body;

    // Ensure user exists
    const [rows]: any = await db.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build update map
    const updateFields: Record<string, any> = {};
    if (bio !== undefined) updateFields.bio = bio;
    if (photo !== undefined) updateFields.photo = photo;
    if (expertIn !== undefined) {
      // Accept array or string
      updateFields.expertIn = Array.isArray(expertIn)
        ? JSON.stringify(expertIn)
        : typeof expertIn === "string"
        ? JSON.stringify(
            expertIn
              .split?.(",")
              .map((s: string) => s.trim())
              .filter(Boolean) || []
          )
        : JSON.stringify([]);
    }
    if (education !== undefined) {
      updateFields.education = Array.isArray(education)
        ? JSON.stringify(education)
        : typeof education === "string"
        ? JSON.stringify(
            education
              .split?.(",")
              .map((s: string) => s.trim())
              .filter(Boolean) || []
          )
        : JSON.stringify([]);
    }
    if (authordesig !== undefined) updateFields.authordesig = authordesig;
    if (role !== undefined) updateFields.role = role;
    if (password !== undefined && password !== "") updateFields.password = password;

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const setSQL = Object.keys(updateFields).map((k) => `${k} = ?`).join(", ");
    const values = Object.values(updateFields);

    await db.query(`UPDATE users SET ${setSQL} WHERE email = ?`, [...values, email]);

    // Return the updated user (normalized)
    const [updatedRows]: any = await db.query(
      "SELECT id, username, name, email, role, bio, expertIn, education, photo, authordesig FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (!updatedRows || updatedRows.length === 0) {
      return NextResponse.json({ error: "User not found after update" }, { status: 500 });
    }

    const updatedUser = updatedRows[0];

    return NextResponse.json(
      {
        ...updatedUser,
        education: safeParseArray(updatedUser.education),
        expertIn: safeParseArray(updatedUser.expertIn),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("PUT /api/admin/users/me Error:", err);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
