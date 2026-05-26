import { NextResponse } from "next/server";
import { guardAdminApi } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { AdminUsersResponse, ApiErrorResponse } from "@/lib/types";

export async function GET() {
  try {
    const admin = await guardAdminApi();
    if (!admin.ok) {
      return admin.response;
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, email, full_name, role, account_status, failed_login_count, approved_at, blocked_at, block_reason, last_login_at, created_at",
      )
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json<AdminUsersResponse>({
      users: data ?? [],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list users";
    console.error("[GET /api/admin/users]", error);
    return NextResponse.json<ApiErrorResponse>(
      { error: message },
      { status: 500 },
    );
  }
}
