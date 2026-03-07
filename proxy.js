import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const authSecret =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  (process.env.NODE_ENV === "development" ? "dev-only-secret-change-in-production" : undefined);

export async function proxy(request) {
  const token = await getToken({
    req: request,
    secret: authSecret,
  });

  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith("/api/");

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