import { NextResponse } from "next/server";
import {
  internalErrorResponse,
  parseAdminUserIdParam,
  rateLimitResponse,
} from "@/lib/api-response";
import { checkAdminRateLimit } from "@/lib/api-rate-limit";
import { guardAdminApi, logAppAccess } from "@/lib/auth";
import { purgeUserHydraData } from "@/lib/hydradb";
import { createClient } from "@/lib/supabase/server";
import type { AdminPurgeMemoriesResponse, ApiErrorResponse } from "@/lib/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
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

    const targetUserId = parsedId.userId;
    const supabase = await createClient();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", targetUserId)
      .maybeSingle();

    if (profileError) {
      throw new Error(profileError.message);
    }

    if (!profile) {
      return NextResponse.json<ApiErrorResponse>(
        { error: "User not found" },
        { status: 404 },
      );
    }

    const result = await purgeUserHydraData(targetUserId);

    await logAppAccess({
      route: "/api/admin/users/[id]/memories",
      target_user_id: targetUserId,
      memory_count: result.memoryCount,
      knowledge_count: result.knowledgeCount,
      deleted_ids: result.deletedIds,
    });

    const message =
      result.deletedIds === 0
        ? "No HydraDB sources found for this user"
        : `Deleted ${result.deletedIds} source(s) (${result.memoryCount} memories, ${result.knowledgeCount} knowledge)`;

    return NextResponse.json<AdminPurgeMemoriesResponse>({
      ...result,
      message,
    });
  } catch (error) {
    return internalErrorResponse(
      "[DELETE /api/admin/users/[id]/memories]",
      error,
    );
  }
}
