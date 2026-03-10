// src/app/api/db-test/route.ts
import { NextResponse } from 'next/server';
import mysql, { RowDataPacket } from 'mysql2/promise';

interface TimeRow extends RowDataPacket {
  time: string;
}

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function GET() {
  try {
    const [rows] = await db.query<TimeRow[]>('SELECT NOW() AS time');
    const time = rows[0]?.time ?? 'Unknown';

    return NextResponse.json({ serverTime: time });
  } catch (error) {
    console.error('DB Error:', error);
    return NextResponse.json({ error: 'DB connection failed' }, { status: 500 });
  }
}
