import { NextResponse } from "next/server";
import {
  getAuthUser,
  recordAuthSuccess,
  unauthorizedResponse,
} from "@/lib/auth";
import type { ApiErrorResponse } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return unauthorizedResponse();
    }

    const body = await request.json().catch(() => ({}));
    const provider =
      typeof body?.provider === "string" ? body.provider : "email";

    await recordAuthSuccess(provider);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to record auth success";
    console.error("[POST /api/auth/success]", error);
    return NextResponse.json<ApiErrorResponse>(
      { error: message },
      { status: 500 },
    );
  }
}
