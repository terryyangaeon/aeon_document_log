import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = ["/log-sheet", "/staff", "/configuration"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedPage = protectedPaths.some((p) => pathname.startsWith(p));
  const isProtectedApi =
    pathname.startsWith("/api/") && !pathname.startsWith("/api/auth");

  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next();
  }

  // NextAuth v5 session token cookie names
  const hasSession =
    request.cookies.has("authjs.session-token") ||
    request.cookies.has("__Secure-authjs.session-token");

  if (!hasSession) {
    if (isProtectedApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Redirect to sign-in page
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/log-sheet/:path*",
    "/staff/:path*",
    "/configuration/:path*",
    "/api/staff/:path*",
    "/api/document-log/:path*",
    "/api/system-code/:path*",
  ],
};
