import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// PROXY HANDLER
export default function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const pathname = url.pathname;

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

// --- 3️⃣ MATCHERS (same behavior as old middleware.ts) ---
export const config = {
  matcher: [
    // Apply proxy to all routes EXCEPT upload-certificate API
    '/((?!api/lms/upload-certificate|api/lms/upload-certificate/).*)'
  ],
};
