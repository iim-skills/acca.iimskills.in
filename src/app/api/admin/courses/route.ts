// app/api/admin/courses/route.ts
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Adjust path: project root /data/course/course.json
    const filePath = path.join(process.cwd(), "data", "acca", "course.json");
    const raw = await fs.promises.readFile(filePath, "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Failed to read course JSON:", err?.message ?? err);
    return NextResponse.json({ error: "Course data not found" }, { status: 404 });
  }
}
