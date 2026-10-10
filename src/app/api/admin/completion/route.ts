import { NextResponse } from "next/server";
import db from "../../../../lib/db";

// API route for admin session completion management

/* ======================================================
   HELPERS & NORMALIZATION
====================================================== */

function safeJsonParse<T>(value: any, fallback: T): T {
  try {
    if (value == null || value === "") return fallback;
    if (typeof value === "object") return value as T;
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeSlug(value: any): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function normalizeCourseData(data: any) {
  if (!data || typeof data !== "object") {
    return { modules: [] };
  }

  const rawModules = Array.isArray(data.modules) ? data.modules : [];

  let runningGlobalIndex = 0;

  const modules = rawModules.map((mod: any, mIdx: number) => {
    const rawSubmodules = Array.isArray(mod.submodules) ? mod.submodules : [];

    const submodules = rawSubmodules.map((sub: any, sIdx: number) => {
      const rawItems = Array.isArray(sub.items)
        ? sub.items
        : Array.isArray(sub.videos)
        ? sub.videos
        : [];

      const rawQuizzes = Array.isArray(sub.quizzes) ? sub.quizzes : [];

      // Merge items and quizzes if needed
      const allItems: any[] = [];

      rawItems.forEach((it: any, itemIdx: number) => {
        if (!it || typeof it !== "object") return;

        const type = String(it.type ?? "video").toLowerCase();
        const primaryId = String(
          it.sessionId ??
          it.videoId ??
          it.video_id ??
          it.quizRefId ??
          it.quizId ??
          it.pdfId ??
          it.id ??
          `item_${mIdx}_${sIdx}_${itemIdx}`
        );

        let globalIndex: number | null = null;
        if (type === "video") {
          globalIndex = runningGlobalIndex++;
        }

        allItems.push({
          ...it,
          id: primaryId,
          itemId: primaryId,
          type,
          name: it.name ?? it.title ?? it.videoTitle ?? `Item ${itemIdx + 1}`,
          duration: typeof it.duration === "number" ? it.duration : 600, // default 10m
          url: it.url ?? it.videoUrl ?? it.s3_url ?? it.secure_url ?? "",
          globalIndex,
        });
      });

      // Also append any separate quizzes in sub.quizzes if not already present
      rawQuizzes.forEach((q: any, qIdx: number) => {
        if (!q || typeof q !== "object") return;
        const qId = String(q.quizRefId ?? q.quizId ?? q.id ?? `quiz_${mIdx}_${sIdx}_${qIdx}`);
        const exists = allItems.some(
          (x) => x.type === "quiz" && (x.id === qId || x.quizId === qId || x.quizRefId === qId)
        );
        if (!exists) {
          allItems.push({
            ...q,
            id: qId,
            itemId: qId,
            type: "quiz",
            name: q.name ?? q.title ?? `Quiz ${qIdx + 1}`,
            duration: typeof q.time_minutes === "number" ? q.time_minutes * 60 : 600,
            globalIndex: null,
          });
        }
      });

      return {
        submoduleId: String(sub.submoduleId ?? sub.id ?? `sub_${mIdx}_${sIdx}`),
        title: String(sub.title ?? sub.name ?? `Submodule ${sIdx + 1}`),
        description: sub.description ?? "",
        items: allItems,
      };
    });

    const liveSessions = (Array.isArray(mod.liveSessions) ? mod.liveSessions : (mod.live_sessions ?? [])).map(
      (ls: any, lsIdx: number) => ({
        id: String(ls.id ?? `live_${mIdx}_${lsIdx}`),
        itemId: String(ls.id ?? `live_${mIdx}_${lsIdx}`),
        type: "live",
        title: ls.title ?? `Live Session ${lsIdx + 1}`,
        name: ls.title ?? `Live Session ${lsIdx + 1}`,
        url: ls.url ?? "",
        duration: typeof ls.duration === "number" ? ls.duration : 3600, // default 1hr
        globalIndex: null,
      })
    );

    return {
      moduleId: String(mod.moduleId ?? mod.id ?? `mod_${mIdx}`),
      name: String(mod.name ?? mod.title ?? `Module ${mIdx + 1}`),
      description: mod.description ?? "",
      submodules,
      liveSessions,
    };
  });

  return { modules };
}

/* ======================================================
   GET: Fetch Course Details, Students & Progress
====================================================== */

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseSlug = searchParams.get("courseSlug");
    const courseId = searchParams.get("courseId");
    const studentEmail = searchParams.get("studentEmail");
    const studentId = searchParams.get("studentId");

    // 1) Fetch all courses for the dropdown / selection
    const [courseRows]: any = await db.query(
      "SELECT id, courseId, name, slug, description, courseData FROM courses ORDER BY id DESC"
    );

    const courses = (courseRows || []).map((c: any) => {
      const parsedData = safeJsonParse(c.courseData, { modules: [] });
      const normalized = normalizeCourseData(parsedData);
      return {
        id: c.id,
        courseId: c.courseId ?? String(c.id),
        slug: c.slug,
        name: c.name,
        description: c.description,
        modulesCount: normalized.modules.length,
        modules: normalized.modules,
      };
    });

    // 2) Fetch all students
    const [studentRows]: any = await db.query(
      "SELECT id, name, email, phone, courses, progress, student_type, status, enrolled_at FROM lms_students ORDER BY id DESC"
    );

    const students = (studentRows || []).map((s: any) => {
      const parsedCourses = safeJsonParse<any[]>(s.courses, []);
      const parsedProgress = safeJsonParse<Record<string, any>>(s.progress, {});

      return {
        id: s.id,
        name: s.name || "Unnamed Student",
        email: s.email,
        phone: s.phone || "",
        studentType: s.student_type || "paid",
        status: s.status || "active",
        enrolledAt: s.enrolled_at,
        courses: parsedCourses,
        progress: parsedProgress,
      };
    });

    // 3) If specific student & course are queried, build detailed progress matrix
    let detailedProgress: Record<string, any> | null = null;
    let selectedStudent: any = null;
    let selectedCourse: any = null;

    if (studentEmail || studentId) {
      selectedStudent = students.find((s: any) =>
        studentEmail
          ? s.email.toLowerCase() === studentEmail.toLowerCase()
          : String(s.id) === String(studentId)
      );
    }

    if (courseSlug || courseId) {
      selectedCourse = courses.find((c: any) =>
        courseSlug
          ? normalizeSlug(c.slug) === normalizeSlug(courseSlug)
          : String(c.courseId) === String(courseId) || String(c.id) === String(courseId)
      );
    }

    if (selectedStudent && selectedCourse) {
      const fullProgress = selectedStudent.progress || {};
      const courseKeys = [
        selectedCourse.slug,
        selectedCourse.courseId,
        String(selectedCourse.id),
        normalizeSlug(selectedCourse.slug),
      ].filter(Boolean);

      let foundCourseProgress: Record<string, any> = {};
      for (const k of courseKeys) {
        if (fullProgress[k] && typeof fullProgress[k] === "object") {
          foundCourseProgress = { ...foundCourseProgress, ...fullProgress[k] };
        }
      }

      detailedProgress = foundCourseProgress;
    }

    return NextResponse.json({
      success: true,
      courses,
      students,
      selectedStudent,
      selectedCourse,
      detailedProgress,
    });
  } catch (error: any) {
    console.error("GET /api/admin/completion error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch data" },
      { status: 500 }
    );
  }
}

/* ======================================================
   POST: Mark / Unmark Session Completion
====================================================== */

type ItemPayload = {
  itemId: string;
  videoId?: string;
  quizId?: string;
  globalIndex?: number | null;
  type?: string;
  completed?: boolean;
  positionSeconds?: number;
  duration?: number;
};

export async function POST(req: Request) {
  let connection: any = null;

  try {
    const body = await req.json();

    const studentEmail = String(body.studentEmail ?? "").trim().toLowerCase();
    const studentId = body.studentId ? Number(body.studentId) : null;
    const courseSlug = String(body.courseSlug ?? "").trim();
    const courseId = String(body.courseId ?? courseSlug).trim();
    const action = String(body.action ?? "mark_items").toLowerCase();
    const items: ItemPayload[] = Array.isArray(body.items) ? body.items : [];
    const defaultDuration = typeof body.defaultDuration === "number" ? Math.floor(body.defaultDuration) : 600;

    if (!studentEmail && !studentId) {
      return NextResponse.json(
        { error: "Student email or studentId is required" },
        { status: 400 }
      );
    }

    if (!courseSlug && !courseId) {
      return NextResponse.json(
        { error: "Course slug or courseId is required" },
        { status: 400 }
      );
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1) Find student and lock row
    const [studentRows]: any = await connection.execute(
      `SELECT id, name, email, courses, progress FROM lms_students WHERE email = ? OR id = ? LIMIT 1 FOR UPDATE`,
      [studentEmail || null, studentId || 0]
    );

    if (!studentRows || studentRows.length === 0) {
      await connection.rollback();
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const student = studentRows[0];
    let fullProgress: Record<string, any> = safeJsonParse(student.progress, {});

    // Ensure course progress objects exist for both slug and courseId keys
    const courseKeysToSync = Array.from(
      new Set([courseSlug, courseId, normalizeSlug(courseSlug)].filter(Boolean))
    );

    // Pick or initialize existing progress container
    let baseCourseProgress: Record<string, any> = {};
    for (const k of courseKeysToSync) {
      if (fullProgress[k] && typeof fullProgress[k] === "object") {
        baseCourseProgress = { ...baseCourseProgress, ...fullProgress[k] };
      }
    }

    if (!baseCourseProgress.videos || typeof baseCourseProgress.videos !== "object") {
      baseCourseProgress.videos = {};
    }

    // 2) Apply actions
    const nowIso = new Date().toISOString();

    if (action === "unmark_all") {
      // Clear progress for this course
      for (const k of courseKeysToSync) {
        fullProgress[k] = { updated_at: nowIso, videos: {} };
      }
    } else {
      // Mark or unmark specific items
      for (const item of items) {
        const isCompleted = item.completed !== false; // default true unless explicitly false
        const dur = Math.max(0, Math.floor(item.duration ?? defaultDuration));
        const pos = isCompleted ? (dur > 0 ? dur : 1) : 0;

        const entry = {
          positionSeconds: pos,
          duration: dur,
          completed: isCompleted,
          updated_at: nowIso,
        };

        const videoSubEntry = {
          position_sec: pos,
          duration: dur,
          completed: isCompleted ? 1 : 0,
          updated_at: nowIso,
        };

        // Collect all alias keys for this item to ensure seamless cross-component lookup
        const itemKeys = new Set<string>();

        if (item.itemId) itemKeys.add(String(item.itemId));
        if (item.videoId) itemKeys.add(String(item.videoId));
        if (item.quizId) {
          itemKeys.add(String(item.quizId));
          itemKeys.add(`quiz_${item.quizId}`);
        }
        if (item.type === "quiz" && item.itemId && !item.itemId.startsWith("quiz_")) {
          itemKeys.add(`quiz_${item.itemId}`);
        }
        if (item.type === "quiz" && item.itemId && item.itemId.startsWith("quiz_")) {
          itemKeys.add(item.itemId.replace("quiz_", ""));
        }
        if (typeof item.globalIndex === "number" && item.globalIndex >= 0) {
          itemKeys.add(`idx_${item.globalIndex}`);
          itemKeys.add(`global_${item.globalIndex}`);
        }

        // Apply to base course progress
        for (const ik of Array.from(itemKeys)) {
          if (isCompleted) {
            baseCourseProgress[ik] = entry;
            baseCourseProgress.videos[ik] = videoSubEntry;
          } else {
            // Unmark
            baseCourseProgress[ik] = {
              positionSeconds: 0,
              duration: dur,
              completed: false,
              updated_at: nowIso,
            };
            baseCourseProgress.videos[ik] = {
              position_sec: 0,
              duration: dur,
              completed: 0,
              updated_at: nowIso,
            };
          }
        }
      }

      baseCourseProgress.updated_at = nowIso;

      // Sync across all course key aliases
      for (const k of courseKeysToSync) {
        fullProgress[k] = baseCourseProgress;
      }
    }

    // 3) Save back to database
    const updatedProgressJson = JSON.stringify(fullProgress);

    await connection.execute(
      `UPDATE lms_students SET progress = ?, updated_at = NOW() WHERE id = ?`,
      [updatedProgressJson, student.id]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: `Successfully ${action === "unmark_all" ? "reset" : "updated"} progress for ${student.name || student.email}`,
      progress: baseCourseProgress,
    });
  } catch (error: any) {
    if (connection) {
      try {
        await connection.rollback();
      } catch {}
    }
    console.error("POST /api/admin/completion error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update completion progress" },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
