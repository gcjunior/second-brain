import { NextResponse } from "next/server";
import {
  internalErrorResponse,
  rateLimitResponse,
} from "@/lib/api-response";
import { checkAuthFailureRateLimits } from "@/lib/api-rate-limit";
import { recordAuthFailure } from "@/lib/auth";
import type { ApiErrorResponse } from "@/lib/types";
import { authFailureSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = authFailureSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid request";
      return NextResponse.json<ApiErrorResponse>(
        { error: message },
        { status: 400 },
      );
    }

    const { email, reason, provider } = parsed.data;
    const rateLimit = checkAuthFailureRateLimits(request, email);
    if (!rateLimit.ok) {
      return rateLimitResponse(rateLimit.retryAfterMs);
    }

    await recordAuthFailure(email, reason, provider);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return internalErrorResponse("[POST /api/auth/failure]", error);
  }
}
