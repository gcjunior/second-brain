import { HydraDBClient } from "@hydradb/sdk";
import type { MemorySource } from "@/lib/types";

const SUB_TENANT_ID = "mvp_user";

function getConfig() {
  const apiKey = process.env.HYDRADB_API_KEY;
  const tenantId = process.env.HYDRADB_PROJECT_ID;
  const baseUrl = process.env.HYDRADB_URL;

  if (!apiKey) {
    throw new Error("HYDRADB_API_KEY is not configured");
  }
  if (!tenantId) {
    throw new Error("HYDRADB_PROJECT_ID is not configured");
  }

  return { apiKey, tenantId, baseUrl };
}

function createClient() {
  const { apiKey, baseUrl } = getConfig();

  return new HydraDBClient({
    token: apiKey,
    ...(baseUrl ? { baseUrl } : {}),
  });
}

function getTenantId() {
  return getConfig().tenantId;
}

const READY_STATUSES = new Set([
  "completed",
  "graph_creation",
  "success",
]);

async function waitForIndexing(sourceId: string): Promise<string> {
  const client = createClient();
  const tenantId = getTenantId();
  const maxAttempts = 12;
  const delayMs = 1000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await client.upload.verifyProcessing({
      tenant_id: tenantId,
      sub_tenant_id: SUB_TENANT_ID,
      file_ids: [sourceId],
    });

    const status = response.statuses?.[0];
    if (!status) {
      break;
    }

    if (status.indexing_status === "errored") {
      throw new Error(
        status.message || "Memory indexing failed. Please try again.",
      );
    }

    if (READY_STATUSES.has(status.indexing_status)) {
      return status.indexing_status;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return "queued";
}

export async function saveMemory(content: string): Promise<{
  sourceId: string;
  status: string;
}> {
  const client = createClient();
  const tenantId = getTenantId();

  const response = await client.upload.addMemory({
    tenant_id: tenantId,
    sub_tenant_id: SUB_TENANT_ID,
    memories: [
      {
        text: content,
        infer: false,
        title: content.slice(0, 80) || "Memory",
        additional_metadata: { app: "second-brain-mvp" },
      },
    ],
  });

  const result = response.results?.[0];
  if (!result?.source_id) {
    throw new Error(response.message || "Failed to save memory");
  }

  const indexingStatus = await waitForIndexing(result.source_id);

  return {
    sourceId: result.source_id,
    status: indexingStatus,
  };
}

export async function searchMemories(question: string): Promise<MemorySource[]> {
  const client = createClient();
  const tenantId = getTenantId();

  const response = await client.recall.recallPreferences({
    tenant_id: tenantId,
    sub_tenant_id: SUB_TENANT_ID,
    query: question,
    max_results: 6,
    mode: "fast",
  });

  const chunks = response.chunks ?? [];

  return chunks.map((chunk) => ({
    sourceId: chunk.source_id ?? "unknown",
    title: chunk.source_title ?? null,
    content: chunk.chunk_content ?? "",
    score:
      typeof chunk.relevancy_score === "number" ? chunk.relevancy_score : null,
  }));
}
