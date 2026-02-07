import mysql from "mysql2/promise";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

// 👇 ensure single instance (important for Next.js dev)
declare global {
  // eslint-disable-next-line no-var
  var _dbPool: mysql.Pool | undefined;
}

const db =
  global._dbPool ??
  mysql.createPool({
    host: required("DB_HOST"),
    user: required("DB_USER"),
    password: required("DB_PASSWORD"),
    database: required("DB_NAME"),
    port: Number(process.env.DB_PORT || 3306),
    waitForConnections: true,
    connectionLimit: 3, // VERY IMPORTANT for CyberPanel
    queueLimit: 0,
    connectTimeout: 10_000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });

if (!global._dbPool) {
  global._dbPool = db;
  console.log("DB POOL CREATED");
}

export default db;
