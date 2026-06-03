import { type NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { updateSession } from "@/lib/supabase/middleware";
import type { AccountStatus, UserRole } from "@/lib/auth-types";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/auth/callback",
  "/api/auth/failure",
  "/api/auth/success",
];

type ProfileGate = {
  role: UserRole;
  account_status: AccountStatus;
};

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function copyCookies(from: NextResponse, to: NextResponse) {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie);
  }
}

function redirectWithCookies(
  url: URL,
  baseResponse: NextResponse,
) {
  const redirect = NextResponse.redirect(url);
  copyCookies(baseResponse, redirect);
  return redirect;
}

function gateRoute(profile: ProfileGate | null): string | null {
  if (!profile) {
    return "/login";
  }

  if (profile.account_status === "blocked") {
    return "/blocked";
  }

  if (
    profile.account_status === "pending_approval" ||
    profile.account_status === "rejected"
  ) {
    return "/pending";
  }

  if (profile.account_status === "approved" || profile.role === "admin") {
    return null;
  }

  return "/pending";
}

function unconfiguredResponse(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Service unavailable" },
      { status: 503 },
    );
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

function sessionErrorResponse(
  request: NextRequest,
  baseResponse?: NextResponse,
): NextResponse {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  if (baseResponse) {
    return redirectWithCookies(loginUrl, baseResponse);
  }

  return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    /\.[a-z0-9]+$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  if (!isSupabaseConfigured()) {
    if (isProduction()) {
      return unconfiguredResponse(request);
    }
    return NextResponse.next();
  }

  let supabaseResponse: NextResponse;
  let supabase: Awaited<ReturnType<typeof updateSession>>["supabase"];
  let user: Awaited<ReturnType<typeof updateSession>>["user"];

  try {
    const session = await updateSession(request);
    supabaseResponse = session.supabaseResponse;
    supabase = session.supabase;
    user = session.user;
  } catch {
    return sessionErrorResponse(request);
  }

  if (pathname.startsWith("/api/")) {
    return supabaseResponse;
  }

  if (isPublicPath(pathname)) {
    if (user && (pathname === "/login" || pathname === "/signup")) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, account_status")
        .eq("id", user.id)
        .maybeSingle();

      if (profile && !gateRoute(profile as ProfileGate)) {
        return redirectWithCookies(new URL("/", request.url), supabaseResponse);
      }
    }
    return supabaseResponse;
  }

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return redirectWithCookies(loginUrl, supabaseResponse);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, account_status")
    .eq("id", user.id)
    .maybeSingle();

  if (pathname.startsWith("/admin")) {
    if (!profile || profile.role !== "admin") {
      return redirectWithCookies(new URL("/", request.url), supabaseResponse);
    }
    return supabaseResponse;
  }

  const requiredRoute = gateRoute(profile as ProfileGate | null);

  if (requiredRoute && pathname !== requiredRoute) {
    return redirectWithCookies(
      new URL(requiredRoute, request.url),
      supabaseResponse,
    );
  }

  if (
    !requiredRoute &&
    (pathname === "/pending" || pathname === "/blocked")
  ) {
    return redirectWithCookies(new URL("/", request.url), supabaseResponse);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
