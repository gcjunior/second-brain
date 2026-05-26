import { NextResponse } from "next/server";
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

    const { id } = await context.params;
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
      p_target_user_id: id,
      p_action: "block",
      p_note: parsed.data.note ?? null,
    });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json<{ user: ProfileSummary }>({ user: data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to block user";
    console.error("[POST /api/admin/users/[id]/block]", error);
    return NextResponse.json<ApiErrorResponse>(
      { error: message },
      { status: 500 },
    );
  }
}
