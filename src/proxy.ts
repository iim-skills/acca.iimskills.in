import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// PROXY HANDLER
export default function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const pathname = url.pathname;

  // ✅ VERY IMPORTANT: SKIP ALL API ROUTES (prevents 10MB issue)
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // --- 1️⃣ FIX IMAGE URL ENCODING ---
  if (pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
    const fixedPath = pathname
      .split("/")
      .map((p) => encodeURIComponent(p))
      .join("/");

    if (fixedPath !== pathname) {
      url.pathname = fixedPath;
      return NextResponse.redirect(url);
    }
  }

  // --- 2️⃣ NORMAL REQUESTS CONTINUE ---
  return NextResponse.next();
}

// --- 3️⃣ MATCHER CONFIG ---
export const config = {
  matcher: [
    /*
      Apply proxy to everything EXCEPT:
      - ALL API routes (CRITICAL for uploads)
      - Next.js internal files
      - favicon
    */
    "/((?!api|_next|favicon.ico).*)",
  ],
};