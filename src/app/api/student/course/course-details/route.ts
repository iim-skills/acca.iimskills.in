import { NextResponse } from "next/server";
import db from "../../../../../lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ success: false, error: "Missing slug" }, { status: 400 });
    }

    // fetch course row (courseData JSON stored in courses.courseData column)
    const [courseRows]: any = await db.query(
      `SELECT * FROM courses WHERE slug = ? LIMIT 1`,
      [slug]
    );

    if (!Array.isArray(courseRows) || courseRows.length === 0) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }
    const courseRow = courseRows[0];

    // parse courseData JSON (defensive)
    let courseData: any = {};
    try {
      const raw = courseRow.courseData ?? courseRow.course_data ?? "{}";
      courseData = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch (err) {
      courseData = {};
    }

    const modulesFromJson: any[] = Array.isArray(courseData.modules) ? courseData.modules : [];

    // collect all numeric ids for videos and quizzes from JSON items
    const videoIdSet = new Set<string>();
    const quizIdSet  = new Set<string>();

    modulesFromJson.forEach((mod: any) => {
      (mod.submodules ?? []).forEach((sub: any) => {
        const items = Array.isArray(sub.items) ? sub.items : (Array.isArray(sub.videos) ? sub.videos : []);
        items.forEach((it: any) => {
          if (!it || typeof it !== "object") return;
          if (String(it.type).toLowerCase() === "video") {
            const vid = it.videoId ?? it.video_id ?? it.sessionId ?? it.session_id ?? it.id ?? null;
            if (vid !== null && vid !== undefined && String(vid).trim() !== "") videoIdSet.add(String(vid));
          } else if (String(it.type).toLowerCase() === "quiz") {
            const qid = it.quizId ?? it.quiz_id ?? it.quizRefId ?? it.quizRef_id ?? it.id ?? null;
            if (qid !== null && qid !== undefined && String(qid).trim() !== "") quizIdSet.add(String(qid));
          }
        });
      });
    });

    // Batch fetch video metadata from `videos` table using column `id`
    const videoMap = new Map<string, any>();
    if (videoIdSet.size > 0) {
      const ids = Array.from(videoIdSet);
      const placeholders = ids.map(() => "?").join(",");
      const sql = `
        SELECT id, s3_url, secure_url, public_id, thumb_url, duration
        FROM videos
        WHERE id IN (${placeholders})
      `;
      const [videoRows]: any = await db.query(sql, ids);
      if (Array.isArray(videoRows)) {
        videoRows.forEach((r: any) => {
          const id = String(r.id);
          // choose best available URL
          const url = r.secure_url ?? r.s3_url ?? r.public_id ?? null;
          videoMap.set(id, {
            url,
            thumb: r.thumb_url ?? null,
            duration: typeof r.duration === "number" ? r.duration : undefined,
          });
        });
      }
    }

    // Batch fetch quizzes from `quizzes` table using column `id`
    const quizMap = new Map<string, any>();
    if (quizIdSet.size > 0) {
      const ids = Array.from(quizIdSet);
      const placeholders = ids.map(() => "?").join(",");
      const sql = `
        SELECT id, name, questions, time_minutes, passing_percent
        FROM quizzes
        WHERE id IN (${placeholders})
      `;
      const [quizRows]: any = await db.query(sql, ids);
      if (Array.isArray(quizRows)) {
        quizRows.forEach((r: any) => {
          const id = String(r.id);
          let questions = [];
          try { questions = typeof r.questions === "string" ? JSON.parse(r.questions) : (r.questions ?? []); } catch { questions = r.questions ?? []; }
          quizMap.set(id, {
            id,
            name: r.name ?? null,
            questions,
            time_minutes: r.time_minutes ?? null,
            passing_percent: r.passing_percent ?? null,
          });
        });
      }
    }

    // Normalize modules/submodules/items into expected shape
    const normalizedModules = modulesFromJson.map((mod: any) => {
      const normalizedSubmodules = (mod.submodules ?? []).map((sub: any) => {
        const rawItems = Array.isArray(sub.items)
          ? sub.items
          : (Array.isArray(sub.videos) ? sub.videos : []);

        const normalizedItems = rawItems.map((it: any) => {
          if (!it || typeof it !== "object") return it;

          const type = String(it.type ?? "").toLowerCase();

          if (type === "video") {
            const videoId = String(it.videoId ?? it.video_id ?? it.sessionId ?? it.session_id ?? it.id ?? "");
            const meta = videoMap.get(videoId) ?? null;
            return {
              ...it,
              type: "video",
              videoId: videoId || null,
              id: it.id ?? it.sessionId ?? null,
              name: it.name ?? it.videoTitle ?? it.title ?? null,
              videoTitle: it.videoTitle ?? it.title ?? it.name ?? null,
              url: meta?.url ?? (it.url ?? it.s3_url ?? it.secure_url ?? null),
              thumb: meta?.thumb ?? (it.thumb ?? null),
              duration: meta?.duration ?? (typeof it.duration === "number" ? it.duration : undefined),
            };
          }

          if (type === "quiz") {
            const quizId = String(it.quizId ?? it.quiz_id ?? it.quizRefId ?? it.id ?? "");
            const meta = quizMap.get(quizId) ?? null;
            return {
              ...it,
              type: "quiz",
              quizId: quizId || null,
              name: it.name ?? it.quizTitle ?? meta?.name ?? "Quiz",
              questions: meta?.questions ?? (it.questions ?? []),
              time_minutes: meta?.time_minutes ?? it.time_minutes ?? null,
            };
          }

          return it;
        });

        return {
          submoduleId: sub.submoduleId ?? sub.submodule_id ?? sub.id ?? null,
          title: sub.title ?? sub.name ?? null,
          description: sub.description ?? null,
          items: normalizedItems,
          videos: normalizedItems.filter((x:any) => x?.type === "video"),
          quizzes: normalizedItems.filter((x:any) => x?.type === "quiz"),
        };
      });

      return {
        moduleId: mod.moduleId ?? mod.module_id ?? mod.id ?? null,
        name: mod.name ?? mod.moduleName ?? mod.title ?? null,
        description: mod.description ?? null,
        submodules: normalizedSubmodules
      };
    });

    const outputCourse = {
      courseId: courseRow.courseId ?? courseRow.course_id ?? courseRow.id ?? null,
      slug,
      name: courseRow.name ?? courseRow.course_title ?? courseRow.title ?? null,
      modules: normalizedModules
    };

    return NextResponse.json({ success: true, course: outputCourse });
  } catch (err) {
    console.error("course-details error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}