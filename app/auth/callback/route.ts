import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile, recordAuthSuccess } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error)}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = await createClient();
  const { data, error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !data.user?.email) {
    return NextResponse.redirect(
      `${origin}/login?error=auth_callback_failed`,
    );
  }

  const profile = await getProfile(data.user.id);

  if (!profile) {
    return NextResponse.redirect(`${origin}/login?error=profile_missing`);
  }

  if (profile.account_status === "blocked") {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/blocked`);
  }

  if (
    profile.account_status === "pending_approval" ||
    profile.account_status === "rejected"
  ) {
    return NextResponse.redirect(`${origin}/pending`);
  }

  await recordAuthSuccess("oauth");

  return NextResponse.redirect(`${origin}/`);
}
