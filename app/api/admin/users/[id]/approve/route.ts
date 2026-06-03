import { NextResponse } from "next/server";
import {
  internalErrorResponse,
  parseAdminUserIdParam,
  rateLimitResponse,
} from "@/lib/api-response";
import { checkAdminRateLimit } from "@/lib/api-rate-limit";
import { guardAdminApi } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ApiErrorResponse, ProfileSummary } from "@/lib/types";
import { adminActionSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const admin = await guardAdminApi();
    if (!admin.ok) {
      return admin.response;
    }

    const rateLimit = checkAdminRateLimit(admin.user.id);
    if (!rateLimit.ok) {
      return rateLimitResponse(rateLimit.retryAfterMs);
    }

    const { id } = await context.params;
    const parsedId = parseAdminUserIdParam(id);
    if (!parsedId.ok) {
      return parsedId.response;
    }

    const body = await request.json().catch(() => ({}));
    const parsed = adminActionSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid request";
      return NextResponse.json<ApiErrorResponse>(
        { error: message },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("admin_set_user_status", {
      p_target_user_id: parsedId.userId,
      p_action: "approve",
      p_note: parsed.data.note ?? null,
    });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json<{ user: ProfileSummary }>({ user: data });
  } catch (error) {
    return internalErrorResponse("[POST /api/admin/users/[id]/approve]", error);
  }
}
