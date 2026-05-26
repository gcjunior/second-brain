import { NextResponse } from "next/server";
import { guardApprovedApi, logAppAccess } from "@/lib/auth";
import { saveMemory } from "@/lib/hydradb";
import type { ApiErrorResponse, SaveMemoryResponse } from "@/lib/types";
import { saveMemorySchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const auth = await guardApprovedApi();
    if (!auth.ok) {
      return auth.response;
    }

    const body = await request.json();
    const parsed = saveMemorySchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid request";
      return NextResponse.json<ApiErrorResponse>(
        { error: message },
        { status: 400 },
      );
    }

    await logAppAccess({ route: "/api/memories" });

    const { sourceId, status, tags } = await saveMemory(
      auth.user.id,
      parsed.data.content,
    );

    const baseMessage =
      tags.length > 0
        ? `Memory saved with tags: ${tags.join(", ")}`
        : "Memory saved successfully";
    const message =
      status === "queued"
        ? `${baseMessage}. Still indexing — try asking again in ~30 seconds.`
        : baseMessage;

    return NextResponse.json<SaveMemoryResponse>({
      sourceId,
      status,
      tags,
      message,
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
