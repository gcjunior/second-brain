import { NextResponse } from "next/server";
import type { ApiErrorResponse } from "@/lib/types";
import { adminUserIdParamSchema } from "@/lib/validation";

export function rateLimitResponse(retryAfterMs?: number): NextResponse<ApiErrorResponse> {
  const headers =
    retryAfterMs !== undefined
      ? { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) }
      : undefined;

  return NextResponse.json<ApiErrorResponse>(
    { error: "Too many requests. Please try again later." },
    { status: 429, headers },
  );
}

export function internalErrorResponse(
  logLabel: string,
  error: unknown,
): NextResponse<ApiErrorResponse> {
  console.error(logLabel, error);
  return NextResponse.json<ApiErrorResponse>(
    { error: "An unexpected error occurred" },
    { status: 500 },
  );
}

export function parseAdminUserIdParam(
  id: string,
):
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse<ApiErrorResponse> } {
  const parsed = adminUserIdParamSchema.safeParse(id);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid user id";
    return {
      ok: false,
      response: NextResponse.json<ApiErrorResponse>({ error: message }, { status: 400 }),
    };
  }

  return { ok: true, userId: parsed.data };
}
