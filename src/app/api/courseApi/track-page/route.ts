import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "pageViews.json");

// Ensure data folder exists
if (!fs.existsSync(path.dirname(filePath))) fs.mkdirSync(path.dirname(filePath), { recursive: true });

// GET: Return all page views
export async function GET() {
  try {
    const data = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf-8")) : [];
    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json([], { status: 500 });
  }
}

// POST: Record a new page view
export async function POST(req: Request) {
  try {
    const { page } = await req.json();
    if (!page) return NextResponse.json({ error: "Page is required" }, { status: 400 });

    const allData = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf-8")) : [];

    allData.push({
      page,
      timestamp: new Date().toISOString(),
    });

    fs.writeFileSync(filePath, JSON.stringify(allData, null, 2));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to save page view" }, { status: 500 });
  }
}
