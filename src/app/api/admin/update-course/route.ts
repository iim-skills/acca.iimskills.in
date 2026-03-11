// app/api/admin/update-course/route.ts
import { NextResponse } from "next/server";
import db from "../../../../lib/db";

/* ======================================================
   Helpers: convert legacy sessions/quizzes => items[]
   - if sub.items exists, normalize it (ensure type and id fields present)
   - otherwise build items[] from sessions/quizzes
   - if any item has .position, sort by it to preserve order
====================================================== */

function normalizeSubmoduleToItems(sub: any) {
  // ensure object
  sub = sub || {};

  // 1) If items already present, normalize entries
  if (Array.isArray(sub.items)) {
    const normalized = sub.items.map((it: any) => {
      if (!it || typeof it !== "object") return null;
      // If already has type, keep but ensure required fields exist
      if (it.type === "video") {
        return {
          type: "video",
          sessionId: String(it.sessionId ?? it.id ?? ""),
          name: it.name ?? "",
          videoId: it.videoId ?? it.video ?? undefined,
          videoTitle: it.videoTitle ?? it.title ?? undefined,
          position: typeof it.position !== "undefined" ? Number(it.position) : undefined,
        };
      }
      if (it.type === "quiz") {
        return {
          type: "quiz",
          quizRefId: String(it.quizRefId ?? it.id ?? ""),
          name: it.name ?? "",
          quizId: it.quizId ?? it.quiz ?? undefined,
          quizTitle: it.quizTitle ?? it.title ?? undefined,
          position: typeof it.position !== "undefined" ? Number(it.position) : undefined,
        };
      }
      // detect by shape (legacy)
      if (it.sessionId || it.videoId || it.videoTitle) {
        return {
          type: "video",
          sessionId: String(it.sessionId ?? ""),
          name: it.name ?? "",
          videoId: it.videoId ?? undefined,
          videoTitle: it.videoTitle ?? undefined,
          position: typeof it.position !== "undefined" ? Number(it.position) : undefined,
        };
      }
      if (it.quizRefId || it.quizId || it.quizTitle) {
        return {
          type: "quiz",
          quizRefId: String(it.quizRefId ?? ""),
          name: it.name ?? "",
          quizId: it.quizId ?? undefined,
          quizTitle: it.quizTitle ?? undefined,
          position: typeof it.position !== "undefined" ? Number(it.position) : undefined,
        };
      }
      // fallback: ignore item
      return null;
    }).filter(Boolean);

    // sort if any positions provided, otherwise keep order
    const hasPos = normalized.some((i: any) => typeof i.position === "number");
    if (hasPos) {
      normalized.sort((a: any, b: any) => (Number(a.position ?? 0) - Number(b.position ?? 0)));
      // remove position from final objects
      return normalized.map((i: any) => {
        delete i.position;
        return i;
      });
    }
    return normalized.map((i: any) => {
      delete i.position;
      return i;
    });
  }

  // 2) Build from legacy sessions + quizzes if present
  const legacySessions = Array.isArray(sub.sessions) ? sub.sessions : [];
  const legacyQuizzes = Array.isArray(sub.quizzes) ? sub.quizzes : [];

  const items: any[] = [];

  // Map sessions
  for (const s of legacySessions) {
    items.push({
      type: "video",
      sessionId: String(s.sessionId ?? ""),
      name: s.name ?? "",
      videoId: s.videoId ?? undefined,
      videoTitle: s.videoTitle ?? undefined,
      position: typeof s.position !== "undefined" ? Number(s.position) : undefined,
    });
  }

  // Map quizzes
  for (const q of legacyQuizzes) {
    items.push({
      type: "quiz",
      quizRefId: String(q.quizRefId ?? ""),
      name: q.name ?? "",
      quizId: q.quizId ?? undefined,
      quizTitle: q.quizTitle ?? undefined,
      position: typeof q.position !== "undefined" ? Number(q.position) : undefined,
    });
  }

  // If any position present, sort by position
  const anyPos = items.some((it) => typeof it.position === "number");
  if (anyPos) {
    items.sort((a, b) => (Number(a.position ?? 0) - Number(b.position ?? 0)));
  }
  // remove position marker before returning
  return items.map((it) => {
    if (it && typeof it === "object") {
      delete it.position;
    }
    return it;
  });
}

/* Normalize entire courseData:
   - ensure modules is array
   - ensure submodules is array
   - convert each submodule to have items[]
   - remove sessions/quizzes keys in normalized structure (to avoid duplication)
*/
function normalizeCourseData(data: any) {
  if (!data || typeof data !== "object") {
    return { modules: [] };
  }

  if (!Array.isArray(data.modules)) {
    data.modules = [];
  }

  data.modules = data.modules.map((module: any) => {
    const m = { ...(module || {}) };
    if (!Array.isArray(m.submodules)) {
      m.submodules = [];
    }

    m.submodules = m.submodules.map((sub: any) => {
      const s = { ...(sub || {}) };

      // Build/normalize items array
      const items = normalizeSubmoduleToItems(s) || [];

      // Return normalized submodule with items[] and WITHOUT legacy sessions/quizzes
      const out: any = {
        ...s,
        items,
      };

      // Remove legacy properties if present to avoid duplication
      delete out.sessions;
      delete out.quizzes;

      return out;
    });

    return m;
  });

  return data;
}

/* ======================================================
   API Handler
====================================================== */

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const id = Number(body.id || 0);
    if (!id) {
      return NextResponse.json({ error: "course id is required" }, { status: 400 });
    }

    const name = (body.name ?? "").toString().trim();
    const slug = (body.slug ?? "").toString().trim();
    const description = (body.description ?? "").toString();

    if (!name || !slug) {
      return NextResponse.json({ error: "name and slug are required" }, { status: 400 });
    }

    // Normalize incoming courseData (converts legacy sessions/quizzes -> items[])
    const courseDataRaw = body.courseData ?? { modules: [] };
    const courseData = normalizeCourseData(courseDataRaw);

    // Stringify safely
    let jsonStr: string;
    try {
      jsonStr = JSON.stringify(courseData);
    } catch (e) {
      console.error("Invalid courseData JSON", e);
      return NextResponse.json({ error: "Invalid courseData" }, { status: 400 });
    }

    // Check slug uniqueness excluding current course
    const [slugRows]: any = await db.execute(
      "SELECT id FROM courses WHERE slug = ? AND id <> ? LIMIT 1",
      [slug, id]
    );

    if (slugRows.length > 0) {
      return NextResponse.json({ error: "slug already used by another course" }, { status: 409 });
    }

    // Update course row
    await db.execute(
      `UPDATE courses
       SET name = ?, slug = ?, description = ?, courseData = ?, updatedAt = NOW()
       WHERE id = ?`,
      [name, slug, description, jsonStr, id]
    );

    // Re-query and return normalized data
    const [rows]: any = await db.execute("SELECT * FROM courses WHERE id = ? LIMIT 1", [id]);

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Course not found after update" }, { status: 404 });
    }

    const row = rows[0];

    let parsedCourseData;
    try {
      parsedCourseData = typeof row.courseData === "string" ? JSON.parse(row.courseData) : row.courseData;
    } catch {
      parsedCourseData = { modules: [] };
    }

    // ensure returned courseData is normalized (items[] present)
    parsedCourseData = normalizeCourseData(parsedCourseData);

    return NextResponse.json({
      id: row.id,
      courseId: row.courseId ?? null,
      name: row.name,
      slug: row.slug,
      description: row.description,
      modules: parsedCourseData.modules,
      courseData: parsedCourseData,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });

  } catch (err) {
    console.error("POST /api/admin/update-course error:", err);
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
  }
}