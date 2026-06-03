import { NextResponse } from "next/server";
import {
  internalErrorResponse,
  rateLimitResponse,
} from "@/lib/api-response";
import { checkAdminRateLimit } from "@/lib/api-rate-limit";
import { guardAdminApi } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { AdminUsersResponse } from "@/lib/types";

export async function GET() {
  try {
    const admin = await guardAdminApi();
    if (!admin.ok) {
      return admin.response;
    }

    const rateLimit = checkAdminRateLimit(admin.user.id);
    if (!rateLimit.ok) {
      return rateLimitResponse(rateLimit.retryAfterMs);
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
    return internalErrorResponse("[GET /api/admin/users]", error);
  }
}
