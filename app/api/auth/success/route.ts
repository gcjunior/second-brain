import { NextResponse } from "next/server";
import { internalErrorResponse } from "@/lib/api-response";
import {
  getAuthUser,
  recordAuthSuccess,
  unauthorizedResponse,
} from "@/lib/auth";

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
    return internalErrorResponse("[POST /api/auth/success]", error);
  }
}
