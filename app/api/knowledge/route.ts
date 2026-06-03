import { NextResponse } from "next/server";
import {
  internalErrorResponse,
  rateLimitResponse,
} from "@/lib/api-response";
import { checkMemoryRateLimit } from "@/lib/api-rate-limit";
import { guardApprovedApi, logAppAccess } from "@/lib/auth";
import { uploadMarkdownKnowledge } from "@/lib/hydradb";
import type { ApiErrorResponse, UploadKnowledgeResponse } from "@/lib/types";
import { markdownUploadSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const auth = await guardApprovedApi();
    if (!auth.ok) {
      return auth.response;
    }

    const rateLimit = checkMemoryRateLimit(auth.user.id);
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
        { error: "Markdown file is required" },
        { status: 400 },
      );
    }

    const parsed = markdownUploadSchema.safeParse({
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

    await logAppAccess({ route: "/api/knowledge" });

    const result = await uploadMarkdownKnowledge(
      auth.user.id,
      file,
      parsed.data.context,
    );

    return NextResponse.json<UploadKnowledgeResponse>({
      ...result,
      message:
        result.tags.length > 0
          ? `Markdown uploaded with tags: ${result.tags.join(", ")}`
          : "Markdown uploaded and indexed",
    });
  } catch (error) {
    return internalErrorResponse("[POST /api/knowledge]", error);
  }
}
