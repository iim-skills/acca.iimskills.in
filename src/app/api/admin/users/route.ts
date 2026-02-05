// app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

type UserBody = {
  id?: number;
  username?: string;
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  bio?: any;
  photo?: string;
  posts?: number;
};

type UserRow = RowDataPacket & {
  id: number;
  username: string;
  name: string;
  email: string;
  password?: string | null;
  role: string;
  bio?: string | null;
  photo?: string | null;
  posts?: number;
  created_at?: string;
  updated_at?: string | null;
};

function dbErrLog(err: any, ctx = "") {
  console.error(`DB Error ${ctx}:`, err?.message ?? err);
  if (err?.code) console.error("DB Err code:", err.code);
  if (err?.sqlMessage) console.error("SQL Message:", err.sqlMessage);
}

async function getConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 3306),
  });
}

// GET all users
export async function GET() {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute<UserRow[]>("SELECT * FROM users ORDER BY id DESC");
    await conn.end();
    return NextResponse.json(rows);
  } catch (err) {
    dbErrLog(err, "GET /api/admin/users");
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// POST create new user
export async function POST(req: Request) {
  try {
    const body: UserBody = await req.json();
    const { username, name, email, password, role, bio, photo } = body;

    if (!username || !name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Username, name, email, password, and role are required" },
        { status: 400 }
      );
    }

    const conn = await getConnection();

    // duplicate email check
    const [existingRows] = await conn.execute<RowDataPacket[]>(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    if ((existingRows as RowDataPacket[]).length > 0) {
      await conn.end();
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
    }

    // insert user (ResultSetHeader gives insertId)
    const [result] = await conn.execute<ResultSetHeader>(
      `INSERT INTO users (username, name, email, password, role, bio, photo, posts)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        username,
        name,
        email,
        password,
        role,
        typeof bio === "object" ? JSON.stringify(bio) : bio ?? null,
        photo ?? "/user.jpg",
        0,
      ]
    );

    const insertId = result.insertId;

    const [createdRows] = await conn.execute<UserRow[]>("SELECT * FROM users WHERE id = ?", [insertId]);

    await conn.end();
    return NextResponse.json((createdRows as UserRow[])[0] ?? { success: true }, { status: 200 });
  } catch (err) {
    dbErrLog(err, "POST /api/admin/users");
    return NextResponse.json({ error: "Failed to save user" }, { status: 500 });
  }
}

// PUT update user
export async function PUT(req: Request) {
  try {
    const body: UserBody = await req.json();
    const { id, username, name, email, password, role, bio, photo } = body;

    if (!id || !username || !name || !email || !role) {
      return NextResponse.json({ error: "ID, username, name, email, and role are required" }, { status: 400 });
    }

    const conn = await getConnection();

    // Duplicate email check for other users
    const [dupRows] = await conn.execute<RowDataPacket[]>(
      "SELECT id FROM users WHERE email = ? AND id <> ?",
      [email, id]
    );
    if ((dupRows as RowDataPacket[]).length > 0) {
      await conn.end();
      return NextResponse.json({ error: "Email already used by another user" }, { status: 400 });
    }

    // Update (ResultSetHeader returned, but we don't need it)
    await conn.execute<ResultSetHeader>(
      `UPDATE users SET
         username = ?,
         name = ?,
         email = ?,
         role = ?,
         bio = ?,
         photo = COALESCE(?, photo),
         password = COALESCE(?, password)
       WHERE id = ?`,
      [
        username,
        name,
        email,
        role,
        typeof bio === "object" ? JSON.stringify(bio) : bio ?? null,
        photo ?? null,
        password ?? null,
        id,
      ]
    );

    const [rows] = await conn.execute<UserRow[]>("SELECT * FROM users WHERE id = ?", [id]);
    await conn.end();

    return NextResponse.json((rows as UserRow[])[0], { status: 200 });
  } catch (err) {
    dbErrLog(err, "PUT /api/admin/users");
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// DELETE user
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id");
    const id = idParam ? parseInt(idParam, 10) : NaN;

    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const conn = await getConnection();
    await conn.execute<ResultSetHeader>("DELETE FROM users WHERE id = ?", [id]);
    await conn.end();

    return NextResponse.json({ success: true });
  } catch (err) {
    dbErrLog(err, "DELETE /api/admin/users");
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
