import mysql from 'mysql2/promise';

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default db;

// utils/db.ts
import fs from "fs";
import path from "path";


const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");


export function ensureDataDir() {
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "[]", "utf-8");
}


export function readUsers(): any[] {
ensureDataDir();
const raw = fs.readFileSync(USERS_FILE, "utf-8");
return JSON.parse(raw || "[]");
}


export function writeUsers(users: any[]) {
ensureDataDir();
fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}
