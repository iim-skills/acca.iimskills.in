// components/Students/utils.ts
import type { Submodule } from "./types";

/* =========================================
   PARSE STUDENT MODULES (FIXED VERSION)
========================================= */
export const parseStudentModules = (s: any): string[] => {
  if (!s) return [];

  let parsed = s;

  if (typeof s === "string") {
    try {
      parsed = JSON.parse(s);
    } catch {
      parsed = s.split(",").map((x: string) => x.trim());
    }
  }

  if (!Array.isArray(parsed)) return [];

  // 🔥 Normalize: remove MOD_ prefix and trim
  return parsed.map((m) =>
    String(m)
      .replace(/^MOD_/i, "")
      .trim()
  );
};

/* =========================================
   PLAYABLE URL NORMALIZER
========================================= */
export const toPlayableUrl = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith("/")) return url;
  if (url.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) return url;

  try {
    const u = new URL(url);
    const host = u.hostname.replace("www.", "");

    if (host.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }

    if (host.includes("youtu.be")) {
      const id = u.pathname.slice(1);
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {
    return url;
  }

  return url;
};

/* =========================================
   EMBED URL NORMALIZER
========================================= */
export const toEmbedUrl = (url?: string | null): string | null => {
  if (!url) return null;

  try {
    const u = new URL(url);
    const host = u.hostname.replace("www.", "");

    if (host.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }

    if (host.includes("youtu.be")) {
      const id = u.pathname.slice(1);
      if (id) return `https://www.youtube.com/embed/${id}`;
    }

    if (host.includes("vimeo.com")) {
      const id = u.pathname.split("/").pop();
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    // ignore
  }

  return url;
};

/* =========================================
   PRELOAD THUMBNAILS
========================================= */
export const preloadThumbnails = (modules?: any[], limit = 10) => {
  if (!modules) return;

  try {
    const urls: string[] = [];

    modules.forEach((m: any) => {
      m.submodules?.forEach((s: Submodule) => {
        if (s.thumbnail) urls.push(s.thumbnail);
      });
    });

    urls.slice(0, limit).forEach((u) => {
      const img = new Image();
      img.src = u;
    });
  } catch {
    // ignore
  }
};