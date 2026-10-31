import { NextResponse } from "next/server";

// Custom sessions are validated server-side in guards. The proxy intentionally
// performs no authentication and never exposes or refreshes session tokens.
export function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|fonts/|sw.js|manifest.webmanifest|robots.txt|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)",
  ],
};
