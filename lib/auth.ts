import { NextResponse } from "next/server";
import type { ApiErrorResponse } from "@/lib/types";
import type { AuthUser, Profile } from "@/lib/auth-types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function getSessionUser(): Promise<{
  id: string;
  email: string;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) {
    return null;
  }

  return { id: user.id, email: user.email };
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, avatar_url, role, account_status, failed_login_count, approved_at, blocked_at, block_reason, last_login_at, last_login_provider, created_at, updated_at",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as Profile;
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const session = await getSessionUser();
  if (!session) {
    return null;
  }

  const profile = await getProfile(session.id);
  if (!profile) {
    return null;
  }

  return {
    id: session.id,
    email: session.email,
    profile,
  };
}

export function isProfileApproved(profile: Profile): boolean {
  return (
    profile.account_status === "approved" || profile.role === "admin"
  );
}

export function isProfileBlocked(profile: Profile): boolean {
  return profile.account_status === "blocked";
}

export async function requireApprovedUser(): Promise<AuthUser | null> {
  const authUser = await getAuthUser();
  if (!authUser) {
    return null;
  }

  if (!isProfileApproved(authUser.profile)) {
    return null;
  }

  return authUser;
}

/** For API routes: 401 if no session, 403 if not approved. */
export async function guardApprovedApi(): Promise<
  | { ok: true; user: AuthUser }
  | { ok: false; response: NextResponse<ApiErrorResponse> }
> {
  const authUser = await getAuthUser();
  if (!authUser) {
    return { ok: false, response: unauthorizedResponse() };
  }

  if (!isProfileApproved(authUser.profile)) {
    return {
      ok: false,
      response: forbiddenResponse("Account not approved or is blocked"),
    };
  }

  return { ok: true, user: authUser };
}

export async function requireAdmin(): Promise<AuthUser | null> {
  const authUser = await getAuthUser();
  if (!authUser || authUser.profile.role !== "admin") {
    return null;
  }

  return authUser;
}

export async function guardAdminApi(): Promise<
  | { ok: true; user: AuthUser }
  | { ok: false; response: NextResponse<ApiErrorResponse> }
> {
  const authUser = await getAuthUser();
  if (!authUser) {
    return { ok: false, response: unauthorizedResponse() };
  }

  if (authUser.profile.role !== "admin") {
    return {
      ok: false,
      response: forbiddenResponse("Admin access required"),
    };
  }

  return { ok: true, user: authUser };
}

export function unauthorizedResponse(): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbiddenResponse(
  message = "Forbidden",
): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function logAppAccess(metadata: Record<string, unknown> = {}) {
  const supabase = await createClient();
  await supabase.rpc("log_app_access", { p_metadata: metadata });
}

/** Server-only: uses service role so clients cannot call record_auth_failure via anon RPC. */
export async function recordAuthFailure(
  email: string,
  reason: string,
  provider?: string,
) {
  const supabase = createAdminClient();
  const { error } = await supabase.rpc("record_auth_failure", {
    p_email: email,
    p_reason: reason,
    p_provider: provider ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function recordAuthSuccess(provider?: string) {
  const supabase = await createClient();
  await supabase.rpc("record_auth_success", {
    p_provider: provider ?? null,
  });
}

