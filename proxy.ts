/**
 * Next.js 16 optimistic route protection.
 *
 * This checks only for session-cookie presence to keep Proxy fast. Public `/`
 * and `/login` pages use the server-only DAL to restore valid sessions to the
 * correct role dashboard; Spring Boot remains the authoritative validator.
 */

import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/constants";

const protectedPrefixes = ["/hospital", "/blood-bank", "/admin"];

export function proxy(request: NextRequest) {
  const isProtected = protectedPrefixes.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix),
  );

  if (isProtected && !request.cookies.has(ACCESS_TOKEN_COOKIE)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/hospital/:path*", "/blood-bank/:path*", "/admin/:path*"],
};
