// lib/dbUser.ts
import mysql from "mysql2/promise";

async function getDB() {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
}

// 👉 Auto-create table if not exists
async function initTable() {
  const db = await getDB();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS free_course_enrollments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255),
      email VARCHAR(255) UNIQUE,
      phone VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await db.end();
}

export async function saveUser(user: { name: string; email: string; phone: string }) {
  await initTable();
  const db = await getDB();

  const { name, email, phone } = user;

  await db.execute(
    `INSERT INTO free_course_enrollments (name, email, phone)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name), phone = VALUES(phone)`
  );

  await db.end();
}

export async function getAllUsers() {
  await initTable();
  const db = await getDB();

  const [rows] = await db.execute(`SELECT * FROM free_course_enrollments ORDER BY id DESC`);
  
  await db.end();
  return rows;
}
