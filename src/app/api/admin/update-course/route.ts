// app/api/admin/update-course/route.ts

import { NextResponse } from "next/server";
import db from "../../../../lib/db";

/* ======================================================
   Normalize Submodule Items (VIDEO + QUIZ + PDF)
====================================================== */

function normalizeSubmoduleToItems(sub: any) {
  sub = sub || {};

  if (Array.isArray(sub.items)) {
    const normalized = sub.items
      .map((it: any) => {
        if (!it || typeof it !== "object") return null;

        // ✅ VIDEO
        if (it.type === "video") {
          return {
            type: "video",
            sessionId: String(it.sessionId ?? it.id ?? ""),
            name: it.name ?? "",
            videoId: it.videoId ?? it.video ?? undefined,
            videoTitle: it.videoTitle ?? it.title ?? undefined,
            position:
              typeof it.position !== "undefined"
                ? Number(it.position)
                : undefined,
          };
        }

        // ✅ QUIZ
        if (it.type === "quiz") {
          return {
            type: "quiz",
            quizRefId: String(it.quizRefId ?? it.id ?? ""),
            name: it.name ?? "",
            quizId: it.quizId ?? it.quiz ?? undefined,
            quizTitle: it.quizTitle ?? it.title ?? undefined,
            position:
              typeof it.position !== "undefined"
                ? Number(it.position)
                : undefined,
          };
        }

        // ✅ PDF (🔥 FIX)
        if (it.type === "pdf") {
          return {
            type: "pdf",
            pdfId: String(it.pdfId ?? it.id ?? ""),
            name: it.name ?? "",
            fileUrl: it.fileUrl ?? it.url ?? "",
            position:
              typeof it.position !== "undefined"
                ? Number(it.position)
                : undefined,
          };
        }

        // ===== LEGACY DETECTION =====

        // VIDEO legacy
        if (it.sessionId || it.videoId || it.videoTitle) {
          return {
            type: "video",
            sessionId: String(it.sessionId ?? ""),
            name: it.name ?? "",
            videoId: it.videoId ?? undefined,
            videoTitle: it.videoTitle ?? undefined,
            position:
              typeof it.position !== "undefined"
                ? Number(it.position)
                : undefined,
          };
        }

        // QUIZ legacy
        if (it.quizRefId || it.quizId || it.quizTitle) {
          return {
            type: "quiz",
            quizRefId: String(it.quizRefId ?? ""),
            name: it.name ?? "",
            quizId: it.quizId ?? undefined,
            quizTitle: it.quizTitle ?? undefined,
            position:
              typeof it.position !== "undefined"
                ? Number(it.position)
                : undefined,
          };
        }

        // PDF legacy (🔥 FIX)
        if (it.pdfId || it.fileUrl) {
          return {
            type: "pdf",
            pdfId: String(it.pdfId ?? ""),
            name: it.name ?? "",
            fileUrl: it.fileUrl ?? "",
            position:
              typeof it.position !== "undefined"
                ? Number(it.position)
                : undefined,
          };
        }

        return null;
      })
      .filter(Boolean);

    // Sort by position
    const hasPos = normalized.some(
      (i: any) => typeof i.position === "number"
    );

    if (hasPos) {
      normalized.sort(
        (a: any, b: any) =>
          Number(a.position ?? 0) - Number(b.position ?? 0)
      );
    }

    return normalized.map((i: any) => {
      delete i.position;
      return i;
    });
  }

  return [];
}

/* ======================================================
   Normalize Course Data
====================================================== */

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

      const items = normalizeSubmoduleToItems(s) || [];

      const out: any = {
        ...s,
        items,
      };

      delete out.sessions;
      delete out.quizzes;

      return out;
    });

    return m;
  });

  return data;
}

/* ======================================================
   API
====================================================== */

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const id = Number(body.id || 0);

    if (!id) {
      return NextResponse.json(
        { error: "course id is required" },
        { status: 400 }
      );
    }

    const name = (body.name ?? "").toString().trim();
    const slug = (body.slug ?? "").toString().trim();
    const description = (body.description ?? "").toString();

    if (!name || !slug) {
      return NextResponse.json(
        { error: "name and slug are required" },
        { status: 400 }
      );
    }

    const courseDataRaw = body.courseData ?? { modules: [] };
    const courseData = normalizeCourseData(courseDataRaw);

    const jsonStr = JSON.stringify(courseData);

    // slug check
    const [slugRows]: any = await db.execute(
      "SELECT id FROM courses WHERE slug = ? AND id <> ? LIMIT 1",
      [slug, id]
    );

    if (slugRows.length > 0) {
      return NextResponse.json(
        { error: "slug already used" },
        { status: 409 }
      );
    }

    // update DB
    await db.execute(
      `UPDATE courses
       SET name = ?, slug = ?, description = ?, courseData = ?, updatedAt = NOW()
       WHERE id = ?`,
      [name, slug, description, jsonStr, id]
    );

    const [rows]: any = await db.execute(
      "SELECT * FROM courses WHERE id = ? LIMIT 1",
      [id]
    );

    const row = rows[0];

    let parsedCourseData =
      typeof row.courseData === "string"
        ? JSON.parse(row.courseData)
        : row.courseData;

    parsedCourseData = normalizeCourseData(parsedCourseData);

    return NextResponse.json({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      modules: parsedCourseData.modules,
      courseData: parsedCourseData,
    });
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    return NextResponse.json(
      { error: "Failed to update course" },
      { status: 500 }
    );
  }
}