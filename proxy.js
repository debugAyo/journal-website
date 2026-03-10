import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Must match the same env override logic as auth.js
if (process.env.VERCEL_URL) {
  const correctUrl = `https://${process.env.VERCEL_URL}`;
  if (!process.env.NEXTAUTH_URL || process.env.NEXTAUTH_URL.includes("localhost")) {
    process.env.NEXTAUTH_URL = correctUrl;
  }
  if (!process.env.AUTH_URL || process.env.AUTH_URL.includes("localhost")) {
    process.env.AUTH_URL = correctUrl;
  }
}

const authSecret =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  (process.env.NODE_ENV === "development" ? "dev-only-secret-change-in-production" : undefined);

export async function proxy(request) {
  const token = await getToken({
    req: request,
    secret: authSecret,
    secureCookie: process.env.NODE_ENV === "production",
  });

  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith("/api/");

  console.log("[PROXY]", { pathname, hasToken: !!token, tokenRole: token?.role });

  const unauthorizedResponse = () => {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/auth/login", request.url));
  };

  const forbiddenResponse = () => {
    if (isApiRoute) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  };

  if (!token) {
    return unauthorizedResponse();
  }

  if (pathname.startsWith("/dashboard/admin") || pathname.startsWith("/api/admin")) {
    if (token.role !== "ADMIN") {
      return forbiddenResponse();
    }
  }

  if (pathname.startsWith("/dashboard/editor") || pathname.startsWith("/api/editor")) {
    if (token.role !== "EDITOR" && token.role !== "ADMIN") {
      return forbiddenResponse();
    }
  }

  if (pathname.startsWith("/dashboard/reviewer") || pathname.startsWith("/api/reviewer")) {
    if (token.role !== "REVIEWER" && token.role !== "ADMIN") {
      return forbiddenResponse();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/dashboard/:path*",
    "/api/submissions/:path*",
    "/api/admin/:path*",
    "/api/editor/:path*",
    "/api/reviewer/:path*",
  ],
};