import { type NextRequest, NextResponse } from "next/server";
import { isCountryAllowed } from "@/lib/cms/geo-access";
import { loadGeoAccessSettings } from "@/lib/cms/geo-access-server";
import {
  isLocalDevRequest,
  resolveRequestCountry,
} from "@/lib/cms/resolve-request-country";
import { updateSession } from "@/lib/supabase/middleware";

function isGeoExempt(pathname: string): boolean {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/unavailable") ||
    pathname.startsWith("/_next") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/icon.png" ||
    pathname === "/apple-icon.png" ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff2?)$/i.test(pathname)
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    return updateSession(request);
  }

  if (isGeoExempt(pathname)) {
    return NextResponse.next();
  }

  const settings = await loadGeoAccessSettings();
  if (!settings.enabled) {
    return NextResponse.next();
  }

  const isLocalDev = isLocalDevRequest(request);
  if (isLocalDev) {
    return NextResponse.next();
  }

  const country = await resolveRequestCountry(request);
  if (isCountryAllowed(country, settings, { isLocalDev: false })) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/unavailable";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
