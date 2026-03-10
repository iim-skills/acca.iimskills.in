import db from "./db";

async function columnExists(table: string, column: string) {
  const [rows]: any = await db.query(
    `
    SELECT COUNT(*) as count
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?
    `,
    [table, column]
  );

  return rows[0].count > 0;
}

export async function ensureOtpTable() {
  // 1️⃣ Ensure table exists
  await db.query(`
    CREATE TABLE IF NOT EXISTS admin_otp (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      otp VARCHAR(6) NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2️⃣ Ensure columns exist (safe ALTER)
  if (!(await columnExists("admin_otp", "attempts"))) {
    await db.query(`ALTER TABLE admin_otp ADD attempts INT DEFAULT 0`);
  }

  if (!(await columnExists("admin_otp", "resend_count"))) {
    await db.query(`ALTER TABLE admin_otp ADD resend_count INT DEFAULT 0`);
  }

  if (!(await columnExists("admin_otp", "last_sent_at"))) {
    await db.query(`ALTER TABLE admin_otp ADD last_sent_at DATETIME NULL`);
  }
}
