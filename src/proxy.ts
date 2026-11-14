import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { verifyAdminToken, ADMIN_COOKIE_NAME } from "@/lib/auth/admin-session";

const intlMiddleware = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Redirect /admin/dashboard to /admin
  if (pathname === "/admin/dashboard") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // 2. Admin Route Protection (English-only, outside locale prefixes)
  if (pathname.startsWith("/admin")) {
    const adminSession = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const verifiedSession = adminSession ? verifyAdminToken(adminSession) : null;
    const hasValidSession = Boolean(verifiedSession && verifiedSession.role === "admin");

    // If accessing /admin/login while already logged in with verified session -> redirect to /admin
    if (pathname === "/admin/login") {
      if (hasValidSession) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.next();
    }

    // If accessing any /admin route without valid cryptographically verified session -> redirect to /admin/login
    if (!hasValidSession) {
      const loginUrl = new URL("/admin/login", request.url);
      const res = NextResponse.redirect(loginUrl);
      if (adminSession) {
        res.cookies.delete(ADMIN_COOKIE_NAME);
      }
      return res;
    }

    return NextResponse.next();
  }

  // 3. API routes and internal Next routes bypass localization
  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  // 4. Pass storefront requests through next-intl middleware for locale routing & backwards-compatible redirects
  // If request is unprefixed and user has NEXT_LOCALE cookie set, respect it explicitly
  const nextLocaleCookie = request.cookies.get("NEXT_LOCALE")?.value;
  if (
    nextLocaleCookie &&
    (routing.locales as readonly string[]).includes(nextLocaleCookie) &&
    !routing.locales.some((loc) => pathname === `/${loc}` || pathname.startsWith(`/${loc}/`))
  ) {
    const localizedUrl = new URL(`/${nextLocaleCookie}${pathname === "/" ? "" : pathname}`, request.url);
    localizedUrl.search = request.nextUrl.search;
    return NextResponse.redirect(localizedUrl);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image
     * - favicon.ico, images, icons, and static assets
     */
    "/((?!_next/static|_next/image|favicon.ico|apple-icon.png|icon.png|fav-icon.png|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
