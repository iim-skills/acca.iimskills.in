import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseSlug = searchParams.get("courseSlug") || "";
    const batchIdsParam = searchParams.get("batchIds") || "";

    const viewerBatchIds = batchIdsParam.split(",").filter(Boolean);

    const [rows]: any = await pool.query(
      `SELECT * FROM videos WHERE course_slug=? ORDER BY uploaded_at ASC`,
      [courseSlug]
    );

    const videos = rows.map((v: any) => ({
      ...v,
      batch_ids: v.batch_ids ? JSON.parse(v.batch_ids) : [],
    }));

    const firstFiveIds = videos.slice(0, 5).map((v: any) => v.id);

    const result = videos.map((v: any) => {
      const matchBatch =
        viewerBatchIds.length === 0
          ? true
          : v.batch_ids.some((b: any) => viewerBatchIds.includes(String(b)));

      return {
        ...v,
        visible: firstFiveIds.includes(v.id) || matchBatch,
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}