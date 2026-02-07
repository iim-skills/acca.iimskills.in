// app/api/course/route.ts
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const candidatePaths = [
  path.resolve(process.cwd(), "course.json"),
  path.resolve(process.cwd(), "data/acca/course.json"),
  path.resolve(process.cwd(), "data/course.json"),
];

async function readCourseJson(): Promise<any> {
  let lastErr: any = null;
  for (const p of candidatePaths) {
    try {
      const raw = await fs.readFile(p, "utf-8");
      return JSON.parse(raw);
    } catch (err: any) {
      lastErr = err;
      // try next
    }
  }
  // nothing found
  throw lastErr ?? new Error("course JSON not found");
}

export async function GET() {
  try {
    const json = await readCourseJson();

    // Normalize to array of courses
    const courses = Array.isArray(json) ? json : [json];

    // Ensure modules exist as arrays
    const normalized = courses.map((c: any) => ({
      ...c,
      modules: Array.isArray(c?.modules) ? c.modules : [],
    }));

    return NextResponse.json(normalized, { status: 200 });
  } catch (err: any) {
    console.error("Course API error:", err?.message ?? err);
    if (err?.code === "ENOENT") {
      return NextResponse.json({ error: "Course file not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to load course data" }, { status: 500 });
  }
}
