import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "pageViews.json");

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const filter = url.searchParams.get("filter") || "weekly"; // daily, weekly, monthly, yearly
    const pageFilter = url.searchParams.get("page"); // optional page filter

    const data = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf-8")) : [];

    // Filter by page if provided
    let filteredData = pageFilter ? data.filter((v: any) => v.page === pageFilter) : data;

    // Group by date range
    const grouped: Record<string, number> = {};

    filteredData.forEach((v: any) => {
      const date = new Date(v.timestamp);

      let key = "";
      switch (filter) {
        case "daily":
          key = date.toISOString().split("T")[0]; // yyyy-mm-dd
          break;
        case "weekly":
          const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
          const weekNumber = Math.ceil((((date.getTime() - firstDayOfYear.getTime()) / 86400000) + firstDayOfYear.getDay() + 1) / 7);
          key = `Week ${weekNumber} ${date.getFullYear()}`;
          break;
        case "monthly":
          key = `${date.getFullYear()}-${date.getMonth() + 1}`;
          break;
        case "yearly":
          key = `${date.getFullYear()}`;
          break;
        default:
          key = date.toISOString().split("T")[0];
      }

      grouped[key] = (grouped[key] || 0) + 1;
    });

    const result = Object.entries(grouped).map(([k, v]) => ({ period: k, views: v }));
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 });
  }
}
