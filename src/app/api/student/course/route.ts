import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const candidatePaths = [
   
  path.resolve(process.cwd(), "data/acca/course.json"),
  
];

async function readCourseJson(): Promise<any> {
  let lastErr: any = null;

  for (const p of candidatePaths) {
    try {
      const raw = await fs.readFile(p, "utf-8");
      return JSON.parse(raw);
    } catch (err: any) {
      lastErr = err;
    }
  }

  throw lastErr ?? new Error("course JSON not found");
}

export async function GET() {
  try {
    const json = await readCourseJson();

    // Always return array of courses
    const courses = Array.isArray(json) ? json : [json];

    const normalized = courses.map((course: any) => ({
      courseId: course.courseId ?? null,
      slug: course.slug ?? null,
      name: course.name ?? "",
      description: course.description ?? "",
      modules: Array.isArray(course.modules)
        ? course.modules.map((mod: any) => ({
            moduleId: mod.moduleId ?? null,
            slug: mod.slug ?? null,
            name: mod.name ?? "",
            description: mod.description ?? "",
            submodules: Array.isArray(mod.submodules)
              ? mod.submodules.map((sub: any) => ({
                  submoduleId: sub.submoduleId ?? null,
                  title: sub.title ?? "",
                  description: sub.description ?? "",
                  // ✅ IMPORTANT: normalize videos
                  videos: Array.isArray(sub.videos)
                    ? sub.videos.map((v: any) => ({
                        id: v.id ?? null,
                        title: v.title ?? "Video",
                        url: v.url ?? "",
                      }))
                    : [],
                }))
              : [],
          }))
        : [],
    }));

    return NextResponse.json(normalized, { status: 200 });
  } catch (err: any) {
    console.error("Course API error:", err?.message ?? err);

    if (err?.code === "ENOENT") {
      return NextResponse.json(
        { error: "Course file not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to load course data" },
      { status: 500 }
    );
  }
}
