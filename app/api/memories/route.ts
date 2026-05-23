import { NextResponse } from "next/server";
import { saveMemory } from "@/lib/hydradb";
import type { ApiErrorResponse, SaveMemoryResponse } from "@/lib/types";
import { saveMemorySchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = saveMemorySchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid request";
      return NextResponse.json<ApiErrorResponse>(
        { error: message },
        { status: 400 },
      );
    }

    const { sourceId, status } = await saveMemory(parsed.data.content);

    return NextResponse.json<SaveMemoryResponse>({
      sourceId,
      status,
      message: "Memory saved successfully",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save memory";
    console.error("[POST /api/memories]", error);
    return NextResponse.json<ApiErrorResponse>(
      { error: message },
      { status: 500 },
    );
  }
}
