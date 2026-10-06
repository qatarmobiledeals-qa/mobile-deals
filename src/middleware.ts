import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const ADMIN_COOKIE_NAME = "md_admin_session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Redirect /admin/dashboard to /admin
  if (pathname === "/admin/dashboard") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // 2. Admin Route Protection
  if (pathname.startsWith("/admin")) {
    const adminSession = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

    // If accessing /admin/login while already logged in -> redirect to /admin
    if (pathname === "/admin/login") {
      if (adminSession) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.next();
    }

    // If accessing any /admin route without session -> redirect to /admin/login
    if (!adminSession) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Regular Supabase session updater for store routes
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
