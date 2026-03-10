import mysql from "mysql2/promise";

export async function getUser(userId: number) {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT) || 3306,
    });

    const [rows] = await conn.execute("SELECT * FROM users WHERE id = ?", [
      userId,
    ]);

    await conn.end();

    if (!Array.isArray(rows) || rows.length === 0) return null;

    return rows[0]; // <-- SAME RETURN AS BEFORE
  } catch (err) {
    console.error("DB Error in getUser:", err);
    return null;
  }
}
