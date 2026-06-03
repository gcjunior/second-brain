import { NextResponse } from "next/server";
<<<<<<< HEAD
import { searchMemories } from "@/lib/hydradb";
=======
import { MAX_MEMORY_TAGS } from "@/lib/constants";
import { searchMemories } from "@/lib/hydradb";
import { getQuestionForAnswer } from "@/lib/memory-content";
>>>>>>> origin/main
import { generateGroundedAnswer } from "@/lib/openai";
import type { ApiErrorResponse, AskResponse } from "@/lib/types";
import { askQuestionSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = askQuestionSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid request";
      return NextResponse.json<ApiErrorResponse>(
        { error: message },
        { status: 400 },
      );
    }

<<<<<<< HEAD
    const sources = await searchMemories(parsed.data.question);
    const answer = await generateGroundedAnswer(
      parsed.data.question,
      sources,
    );

=======
    const { questionForAnswer } = getQuestionForAnswer(
      parsed.data.question,
      MAX_MEMORY_TAGS,
    );

    const sources = await searchMemories(parsed.data.question);
    const answer = await generateGroundedAnswer(questionForAnswer, sources);

>>>>>>> origin/main
    return NextResponse.json<AskResponse>({ answer, sources });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to answer question";
    console.error("[POST /api/ask]", error);
    return NextResponse.json<ApiErrorResponse>(
      { error: message },
      { status: 500 },
    );
  }
}
