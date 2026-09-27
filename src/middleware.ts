import { NextResponse, type NextRequest } from "next/server";

/**
 * Maintenance mode.
 *
 * Flipped with MAINTENANCE_MODE=1 — no redeploy of application code needed,
 * just an env change and restart.
 *
 * Three deliberate choices:
 *  - Responds 503 with Retry-After, not a 200 or a redirect, so crawlers treat
 *    it as temporary and keep the indexed pages.
 *  - /admin stays reachable, otherwise you lock yourself out of the tool you
 *    need during the outage.
 *  - MAINTENANCE_ALLOW_IPS lets the team verify the fix before reopening.
 */
export function middleware(req: NextRequest) {
  if (process.env.MAINTENANCE_MODE !== "1") return NextResponse.next();

  const { pathname } = req.nextUrl;

  const exempt =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin") ||
    pathname === "/maintenance" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/uploads") ||
    pathname.startsWith("/brand") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt";
  if (exempt) return NextResponse.next();

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const allow = (process.env.MAINTENANCE_ALLOW_IPS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (ip && allow.includes(ip)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/maintenance";
  url.search = "";

  const res = NextResponse.rewrite(url);
  // 503 + Retry-After is what keeps SEO intact through an outage.
  return new NextResponse(res.body, {
    status: 503,
    headers: {
      ...Object.fromEntries(res.headers),
      "Retry-After": process.env.MAINTENANCE_RETRY_AFTER ?? "3600",
      "Cache-Control": "no-store",
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
