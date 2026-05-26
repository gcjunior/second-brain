import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getProfile,
  recordAuthFailure,
  recordAuthSuccess,
} from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const provider = searchParams.get("provider") ?? "oauth";

  if (error) {
    const email = searchParams.get("email") ?? "unknown@oauth.local";
    await recordAuthFailure(
      email,
      errorDescription ?? error,
      provider,
    );
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = await createClient();
  const { data, error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !data.user?.email) {
    await recordAuthFailure(
      data.user?.email ?? "unknown@oauth.local",
      exchangeError?.message ?? "exchange_failed",
      provider,
    );
    return NextResponse.redirect(
      `${origin}/login?error=auth_callback_failed`,
    );
  }

  const profile = await getProfile(data.user.id);

  if (!profile) {
    return NextResponse.redirect(`${origin}/login?error=profile_missing`);
  }

  if (profile.account_status === "blocked") {
    await recordAuthFailure(
      data.user.email,
      "login_while_blocked",
      provider,
    );
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/blocked`);
  }

  if (
    profile.account_status === "pending_approval" ||
    profile.account_status === "rejected"
  ) {
    if (profile.account_status === "pending_approval") {
      await recordAuthFailure(
        data.user.email,
        "login_while_pending",
        provider,
      );
    }
    return NextResponse.redirect(`${origin}/pending`);
  }

  await recordAuthSuccess(provider);

  if (profile.role === "admin") {
    return NextResponse.redirect(`${origin}/`);
  }

  if (profile.account_status === "approved") {
    return NextResponse.redirect(`${origin}/`);
  }

  return NextResponse.redirect(`${origin}/pending`);
}
