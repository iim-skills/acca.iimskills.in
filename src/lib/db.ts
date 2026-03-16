import mysql from "mysql2/promise";

/* ========================================
   ENV HELPER
======================================== */

function required(name: string): string {

  const value = process.env[name];

  if (!value) {
    throw new Error(`❌ Missing environment variable: ${name}`);
  }

  return value;

}

/* ========================================
   GLOBAL DECLARATION
======================================== */

declare global {
  // eslint-disable-next-line no-var
  var __MYSQL_POOL__: mysql.Pool | undefined;
}

/* ========================================
   CREATE POOL
======================================== */

const createPool = () => {

  return mysql.createPool({

    host: required("DB_HOST"),
    user: required("DB_USER"),
    password: required("DB_PASSWORD"),
    database: required("DB_NAME"),

    port: Number(process.env.DB_PORT || 3306),

    waitForConnections: true,

    /* Safe for shared hosting */
    connectionLimit: 5,

    queueLimit: 0,

    connectTimeout: 10000,

    enableKeepAlive: true,
    keepAliveInitialDelay: 0,

  });

};

/* ========================================
   SINGLETON POOL
======================================== */

const db = global.__MYSQL_POOL__ || createPool();

if (!global.__MYSQL_POOL__) {
  global.__MYSQL_POOL__ = db;
  console.log("✅ MySQL Pool Created");
}

/* ========================================
   OPTIONAL CONNECTION TEST (DEV ONLY)
======================================== */

if (process.env.NODE_ENV === "development") {

  (async () => {

    try {

      const conn = await db.getConnection();
      await conn.ping();
      conn.release();

      console.log("✅ MySQL Connected");

    } catch (err) {

      console.error("❌ MySQL Connection Failed:", err);

    }

  })();

}

/* ========================================
   EXPORT
======================================== */

export default db;