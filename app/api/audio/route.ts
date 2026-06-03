import { NextResponse } from "next/server";
import {
  internalErrorResponse,
  rateLimitResponse,
} from "@/lib/api-response";
import { checkAudioRateLimit } from "@/lib/api-rate-limit";
import { guardApprovedApi, logAppAccess } from "@/lib/auth";
import { saveAudioTranscriptionMemory } from "@/lib/hydradb";
import { transcribeAudioFile } from "@/lib/openai";
import type { ApiErrorResponse, AudioMemoryResponse } from "@/lib/types";
import { audioUploadSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const auth = await guardApprovedApi();
    if (!auth.ok) {
      return auth.response;
    }

    const rateLimit = checkAudioRateLimit(auth.user.id);
    if (!rateLimit.ok) {
      return rateLimitResponse(rateLimit.retryAfterMs);
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const contextValue = formData.get("context");
    const context =
      typeof contextValue === "string" && contextValue.trim()
        ? contextValue.trim()
        : undefined;

    if (!(file instanceof File)) {
      return NextResponse.json<ApiErrorResponse>(
        { error: "Audio file is required" },
        { status: 400 },
      );
    }

    const parsed = audioUploadSchema.safeParse({
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type,
      context,
    });

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid request";
      return NextResponse.json<ApiErrorResponse>(
        { error: message },
        { status: 400 },
      );
    }

    await logAppAccess({ route: "/api/audio" });

    const transcript = await transcribeAudioFile(file, parsed.data.context);
    const result = await saveAudioTranscriptionMemory(auth.user.id, {
      transcript,
      fileName: parsed.data.fileName,
      contentType: parsed.data.contentType,
      fileSize: parsed.data.fileSize,
      context: parsed.data.context,
    });

    return NextResponse.json<AudioMemoryResponse>({
      ...result,
      message:
        result.tags.length > 0
          ? `Audio transcribed with tags: ${result.tags.join(", ")}`
          : "Audio transcribed and saved as a memory",
    });
  } catch (error) {
    return internalErrorResponse("[POST /api/audio]", error);
  }
}
