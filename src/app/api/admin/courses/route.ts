import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "acca", "course.json");

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "course.json not found", courses: [] },
        { status: 404 }
      );
    }

    const raw = fs.readFileSync(filePath, "utf8").trim();

    if (!raw) {
      return NextResponse.json(
        { error: "course.json is empty", courses: [] },
        { status: 200 }
      );
    }

    const courses = JSON.parse(raw);
    return NextResponse.json(courses);
  } catch (err) {
    console.error("Failed to load courses:", err);
    return NextResponse.json(
      { error: "Invalid course.json format" },
      { status: 500 }
    );
  }
}
