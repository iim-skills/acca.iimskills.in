// // app/api/registration-images/[filename]/route.ts
// export const runtime = "nodejs";

// import { NextRequest, NextResponse } from "next/server";
// import path from "path";
// import fs from "fs/promises";

// const UPLOAD_DIR = path.join(process.cwd(), "uploads", "registration-images");

// function sanitizeFilename(name: string) {
//   return name.replace(/[^a-z0-9.\-_]/gi, "_");
// }

// function getContentType(ext: string) {
//   ext = ext.toLowerCase();
//   if (ext === ".png") return "image/png";
//   if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
//   if (ext === ".webp") return "image/webp";
//   if (ext === ".gif") return "image/gif";
//   return "application/octet-stream";
// }

// // GET handler signature for App Router dynamic route
// export async function GET(req: NextRequest, { params }: { params: { filename?: string } }) {
//   try {
//     const raw = params?.filename;
//     if (!raw) return NextResponse.json({ error: "No filename provided" }, { status: 400 });

//     const decoded = decodeURIComponent(raw);
//     const safeName = sanitizeFilename(decoded);
//     const filePath = path.join(UPLOAD_DIR, safeName);

//     try {
//       const data = await fs.readFile(filePath); // returns a Buffer
//       const ext = path.extname(filePath);
//       const contentType = getContentType(ext);

//       // Convert Buffer -> Uint8Array so the body matches BodyInit union for NextResponse typing
//       const uint8 = new Uint8Array(data);

//       const headers = {
//         "Content-Type": contentType,
//         // cache for a year; change if you want shorter caching
//         "Cache-Control": "public, max-age=31536000, immutable",
//       };

//       return new NextResponse(uint8, { status: 200, headers });
//     } catch (err) {
//       return NextResponse.json({ error: "File not found" }, { status: 404 });
//     }
//   } catch (err) {
//     console.error("Error serving image:", err);
//     return NextResponse.json({ error: "Server error" }, { status: 500 });
//   }
// }


// app/api/registration-images/[filename]/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "registration-images");
const MAX_BYTES = 12 * 1024 * 1024;

function sanitizeFilename(name: string) {
  return name.replace(/[^a-z0-9.\-_()% ]/gi, "_");
}

async function fileExists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest, { params }: { params: { filename?: string } }) {
  try {
    // 1) primary: route param
    let raw = params?.filename ?? "";

    // 2) fallback: query param ?file=
    if (!raw) {
      try {
        const url = new URL(req.url);
        raw = url.searchParams.get("file") || "";
      } catch (e) {
        raw = "";
      }
    }

    // 3) defensive fallback: try to extract trailing path from the full req.url
    //    e.g. if proxy rewrote host->node but dropped params in Next's params,
    //    req.url may still contain the original path: '/api/registration-images/<file>'
    if (!raw) {
      try {
        const url = new URL(req.url);
        const pathname = url.pathname || "";
        // find last segment after /api/registration-images/
        const marker = "/api/registration-images/";
        const idx = pathname.indexOf(marker);
        if (idx !== -1) {
          raw = pathname.substring(idx + marker.length);
        }
      } catch {
        // ignore
      }
    }

    if (!raw) {
      console.warn("registration-images: no filename found (params, query or path) - req.url:", req.url);
      return NextResponse.json({ error: "No filename provided" }, { status: 400 });
    }

    // decode & sanitize
    try { raw = decodeURIComponent(raw); } catch {}
    const safeName = sanitizeFilename(raw);
    const filePath = path.join(UPLOAD_DIR, safeName);

    // ensure path inside UPLOAD_DIR
    if (!filePath.startsWith(UPLOAD_DIR)) {
      console.warn("registration-images: invalid filename after sanitize:", safeName);
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    if (!(await fileExists(filePath))) {
      console.warn("registration-images: file not found:", filePath);
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const stat = await fs.stat(filePath);
    if (stat.size > MAX_BYTES) {
      console.warn("registration-images: file too large:", stat.size);
      return NextResponse.json({ error: "File too large" }, { status: 413 });
    }

    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType =
      ext === ".png" ? "image/png" :
      (ext === ".jpg" || ext === ".jpeg") ? "image/jpeg" :
      ext === ".webp" ? "image/webp" :
      ext === ".gif" ? "image/gif" : "application/octet-stream";

    // return file bytes
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(data.length),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err: any) {
    console.error("registration-images GET error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
