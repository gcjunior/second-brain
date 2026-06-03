import { NextResponse } from "next/server";
import {
  internalErrorResponse,
  rateLimitResponse,
} from "@/lib/api-response";
import { checkAskRateLimit } from "@/lib/api-rate-limit";
import { guardApprovedApi, logAppAccess } from "@/lib/auth";
import { MAX_MEMORY_TAGS } from "@/lib/constants";
import { searchMemories } from "@/lib/hydradb";
import { getQuestionForAnswer } from "@/lib/memory-content";
import { generateGroundedAnswer } from "@/lib/openai";
import type { ApiErrorResponse, AskResponse } from "@/lib/types";
import { askQuestionSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const auth = await guardApprovedApi();
    if (!auth.ok) {
      return auth.response;
    }

    const rateLimit = checkAskRateLimit(auth.user.id);
    if (!rateLimit.ok) {
      return rateLimitResponse(rateLimit.retryAfterMs);
    }

    const body = await request.json();
    const parsed = askQuestionSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid request";
      return NextResponse.json<ApiErrorResponse>(
        { error: message },
        { status: 400 },
      );
    }

    const { questionForAnswer } = getQuestionForAnswer(
      parsed.data.question,
      MAX_MEMORY_TAGS,
    );

    await logAppAccess({ route: "/api/ask" });

    const sources = await searchMemories(
      auth.user.id,
      parsed.data.question,
    );
    const answer = await generateGroundedAnswer(questionForAnswer, sources);

    return NextResponse.json<AskResponse>({ answer, sources });
  } catch (error) {
    return internalErrorResponse("[POST /api/ask]", error);
  }
}
