import { createHash } from "node:crypto";
import { HydraDBClient, HydraDBError } from "@hydradb/sdk";
import {
  BRAIN_GRAPH_LIMIT,
  BRAIN_SUPER_NODES_LIMIT,
  INDEXING_DELAY_MS,
  INDEXING_MAX_ATTEMPTS,
  MAX_MEMORY_TAGS,
  RECALL_MAX_RESULTS,
  RECALL_TAG_FILTER_MAX_RESULTS,
} from "@/lib/constants";
import {
  formatIndexedMemoryText,
  memoryMatchesTags,
  parseMemoryContent,
} from "@/lib/memory-content";
import type { GraphTriplet } from "@/lib/graph-data";
import type { MemorySource } from "@/lib/types";

const DEFAULT_SUB_TENANT_ID = "demo_user";
let ensureTenantPromise: Promise<void> | null = null;

function getConfig() {
  const apiKey = process.env.HYDRADB_API_KEY;
  const tenantId = process.env.HYDRADB_PROJECT_ID;
  const baseUrl = process.env.HYDRADB_URL;
  const subTenantId = process.env.HYDRADB_SUB_TENANT_ID ?? DEFAULT_SUB_TENANT_ID;

  if (!apiKey) {
    throw new Error("HYDRADB_API_KEY is not configured");
  }
  if (!tenantId) {
    throw new Error("HYDRADB_PROJECT_ID is not configured");
  }

  return { apiKey, tenantId, baseUrl, subTenantId };
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

function getSubTenantId() {
  return getConfig().subTenantId;
}

function getNamespaceMetadata() {
  return {
    tenant_id: getTenantId(),
    sub_tenant_id: getSubTenantId(),
  };
}

const READY_STATUSES = new Set([
  "completed",
  "graph_creation",
  "success",
]);

async function waitForIndexing(sourceId: string): Promise<string> {
  const client = createClient();
  const { tenant_id, sub_tenant_id } = getNamespaceMetadata();
  const maxAttempts = INDEXING_MAX_ATTEMPTS;
  const delayMs = INDEXING_DELAY_MS;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await client.upload.verifyProcessing({
      tenant_id,
      sub_tenant_id,
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

function sourceIdForFile(fileName: string, content: string) {
  const normalizedName = fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  const digest = createHash("sha256")
    .update(fileName)
    .update("\0")
    .update(content)
    .digest("hex")
    .slice(0, 16);

  return `md_${normalizedName || "upload"}_${digest}`;
}

function metadataWithNamespace(metadata: Record<string, unknown>) {
  return sanitizeHydraMetadata({
    ...metadata,
    ...getNamespaceMetadata(),
  });
}

function isHydraMetadataList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isHydraMetadataValue(
  value: unknown,
): value is string | number | boolean | string[] {
  return (
    typeof value === "string" ||
    (typeof value === "number" && Number.isFinite(value)) ||
    typeof value === "boolean" ||
    isHydraMetadataList(value)
  );
}

function sanitizeHydraMetadata(metadata: Record<string, unknown>) {
  const sanitized: Record<string, string | number | boolean | string[]> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (
      value === null ||
      value === undefined ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      continue;
    }

    if (isHydraMetadataValue(value)) {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

function isExistingTenantError(error: unknown): boolean {
  if (!(error instanceof HydraDBError)) {
    return false;
  }

  const body = JSON.stringify(error.body ?? {}).toLowerCase();
  return (
    error.statusCode === 400 ||
    error.statusCode === 409 ||
    (error.statusCode === 422 && body.includes("exist"))
  );
}

async function ensureTenant() {
  if (!ensureTenantPromise) {
    ensureTenantPromise = (async () => {
      const client = createClient();
      const tenantId = getTenantId();

      try {
        await client.tenant.create({ tenant_id: tenantId });
      } catch (error) {
        if (!isExistingTenantError(error)) {
          throw error;
        }
      }
    })();
  }

  return ensureTenantPromise;
}

export async function saveMemory(rawContent: string): Promise<{
  sourceId: string;
  status: string;
  tags: string[];
}> {
  const { content, tags } = parseMemoryContent(rawContent, MAX_MEMORY_TAGS);

  if (!content) {
    throw new Error(
      "Memory content cannot be empty after removing hashtags.",
    );
  }

  const client = createClient();
  const { tenant_id, sub_tenant_id } = getNamespaceMetadata();
  await ensureTenant();

  const additional_metadata: Record<string, unknown> = metadataWithNamespace({
    app: "second-brain-mvp",
    created_at: new Date().toISOString(),
    source_type: "text_memory",
  });

  if (tags.length > 0) {
    additional_metadata.tags = tags;
  }

  const indexedText = formatIndexedMemoryText(content, tags);

  const response = await client.upload.addMemory({
    tenant_id,
    sub_tenant_id,
    memories: [
      {
        text: indexedText,
        infer: false,
        title: content.slice(0, 80) || "Memory",
        additional_metadata,
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
    tags,
  };
}

export async function uploadMarkdownKnowledge(file: File, context?: string): Promise<{
  sourceId: string;
  status: string;
  fileName: string;
  tags: string[];
}> {
  const fileName = file.name.trim();
  const content = await file.text();
  const { tags } = parseMemoryContent(`${context ?? ""}\n${content}`, MAX_MEMORY_TAGS);
  const sourceId = sourceIdForFile(fileName, content);
  const uploadedAt = new Date().toISOString();
  const client = createClient();
  const { tenant_id, sub_tenant_id } = getNamespaceMetadata();
  await ensureTenant();
  const markdownFile = new File([content], fileName, {
    type: file.type || "text/markdown",
  });

  const response = await client.upload.knowledge({
    tenant_id,
    sub_tenant_id,
    files: [markdownFile],
    file_metadata: JSON.stringify([
      {
        file_id: sourceId,
        metadata: sanitizeHydraMetadata({
          app: "second-brain-mvp",
          tenant_id,
          sub_tenant_id,
          source_type: "markdown",
        }),
        additional_metadata: sanitizeHydraMetadata({
          app: "second-brain-mvp",
          source: "markdown_upload",
          source_type: "markdown",
          file_name: fileName,
          content_type: markdownFile.type,
          file_size: markdownFile.size,
          uploaded_at: uploadedAt,
          context: context || undefined,
          tags,
          tenant_id,
          sub_tenant_id,
        }),
      },
    ]),
    upsert: true,
  });

  const result = response.results?.[0];
  const resultSourceId = result?.source_id ?? sourceId;
  if (!resultSourceId) {
    throw new Error(response.message || "Failed to upload Markdown knowledge");
  }

  const indexingStatus = await waitForIndexing(resultSourceId);

  return {
    sourceId: resultSourceId,
    status: indexingStatus,
    fileName,
    tags,
  };
}

export async function saveAudioTranscriptionMemory(options: {
  transcript: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  context?: string;
}): Promise<{
  sourceId: string;
  status: string;
  transcript: string;
  tags: string[];
}> {
  const createdAt = new Date().toISOString();
  const { content: transcript, tags: transcriptTags } = parseMemoryContent(
    options.transcript,
    MAX_MEMORY_TAGS,
  );
  const { content: context, tags: contextTags } = parseMemoryContent(
    options.context ?? "",
    MAX_MEMORY_TAGS,
  );
  const tags = [...new Set([...transcriptTags, ...contextTags])].slice(
    0,
    MAX_MEMORY_TAGS,
  );

  if (!transcript) {
    throw new Error("Audio transcription cannot be empty");
  }

  const client = createClient();
  const { tenant_id, sub_tenant_id } = getNamespaceMetadata();
  await ensureTenant();
  const indexedText = formatIndexedMemoryText(
    context ? `Context: ${context}\n\nTranscript: ${transcript}` : transcript,
    tags,
  );

  const response = await client.upload.addMemory({
    tenant_id,
    sub_tenant_id,
    memories: [
      {
        text: indexedText,
        infer: false,
        title: `Voice note: ${transcript.slice(0, 64)}`,
        additional_metadata: metadataWithNamespace({
          app: "second-brain-mvp",
          created_at: createdAt,
          source_type: "audio_transcription",
          source: "audio_upload",
          file_name: options.fileName,
          content_type: options.contentType,
          file_size: options.fileSize,
          context: context || undefined,
          tags,
        }),
      },
    ],
  });

  const result = response.results?.[0];
  if (!result?.source_id) {
    throw new Error(response.message || "Failed to save audio transcription");
  }

  const indexingStatus = await waitForIndexing(result.source_id);

  return {
    sourceId: result.source_id,
    status: indexingStatus,
    transcript,
    tags,
  };
}

function toMemorySource(
  chunk: {
    source_id?: string;
    source_title?: string;
    chunk_content?: string;
    relevancy_score?: number | null;
    metadata?: Record<string, unknown> | null;
    additional_metadata?: Record<string, unknown> | null;
  },
  sourceType: "knowledge" | "memory",
): MemorySource {
  return {
    sourceId: chunk.source_id ?? "unknown",
    title: chunk.source_title ?? null,
    content: chunk.chunk_content ?? "",
    score:
      typeof chunk.relevancy_score === "number" ? chunk.relevancy_score : null,
    sourceType,
    metadata: {
      ...(chunk.metadata ?? {}),
      ...(chunk.additional_metadata ?? {}),
    },
  };
}

function uniqueSources(sources: MemorySource[]): MemorySource[] {
  const seen = new Set<string>();
  const unique: MemorySource[] = [];

  for (const source of sources) {
    const key = `${source.sourceType}:${source.sourceId}:${source.content}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(source);
  }

  return unique;
}

function isRecoverableRecallError(error: unknown): boolean {
  if (!(error instanceof HydraDBError)) {
    return false;
  }

  return error.statusCode === 404;
}

export async function searchMemories(
  rawQuestion: string,
): Promise<MemorySource[]> {
  const { content, tags } = parseMemoryContent(rawQuestion, MAX_MEMORY_TAGS);
  const query = [content, ...tags].filter(Boolean).join(" ").trim();

  const client = createClient();
  const { tenant_id, sub_tenant_id } = getNamespaceMetadata();

  const [knowledgeResult, memoryResult] = await Promise.allSettled([
    client.recall.fullRecall({
      tenant_id,
      sub_tenant_id,
      query,
      max_results:
        tags.length > 0 ? RECALL_TAG_FILTER_MAX_RESULTS : RECALL_MAX_RESULTS,
      mode: "fast",
      alpha: "auto",
      recency_bias: 0,
      graph_context: true,
    }),
    client.recall.recallPreferences({
      tenant_id,
      sub_tenant_id,
      query,
      max_results:
        tags.length > 0 ? RECALL_TAG_FILTER_MAX_RESULTS : RECALL_MAX_RESULTS,
      mode: "fast",
    }),
  ]);

  if (
    knowledgeResult.status === "rejected" &&
    !isRecoverableRecallError(knowledgeResult.reason)
  ) {
    throw knowledgeResult.reason;
  }

  if (
    memoryResult.status === "rejected" &&
    !isRecoverableRecallError(memoryResult.reason)
  ) {
    throw memoryResult.reason;
  }

  const knowledgeChunks =
    knowledgeResult.status === "fulfilled"
      ? (knowledgeResult.value.chunks ?? [])
      : [];
  const memoryChunks =
    memoryResult.status === "fulfilled" ? (memoryResult.value.chunks ?? []) : [];

  let sources = [
    ...knowledgeChunks.map((chunk) => toMemorySource(chunk, "knowledge")),
    ...memoryChunks.map((chunk) => toMemorySource(chunk, "memory")),
  ];

  if (tags.length > 0) {
    sources = sources.filter((source) =>
      memoryMatchesTags(source.metadata?.tags, source.content, tags),
    );
  }

  return uniqueSources(sources)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, RECALL_MAX_RESULTS);
}

export async function listDemoSubTenants() {
  const client = createClient();
  const tenantId = getTenantId();

  return client.tenant.getSubTenantIds({
    tenant_id: tenantId,
  });
}

type GraphRelationsPayload = {
  relations: (GraphTriplet | null)[];
  next_cursor?: number | null;
  is_truncated?: boolean;
};

function isRecoverableGraphError(error: unknown): boolean {
  if (!(error instanceof HydraDBError)) {
    return false;
  }

  // HydraDB may return 404/500 when the graph is not built yet or has no relations.
  return error.statusCode === 404 || error.statusCode === 500;
}

function getGraphRelationsPayload(
  result: PromiseSettledResult<GraphRelationsPayload>,
): GraphRelationsPayload {
  if (result.status === "fulfilled") {
    return result.value;
  }

  if (isRecoverableGraphError(result.reason)) {
    return {
      relations: [],
      next_cursor: null,
      is_truncated: false,
    };
  }

  throw result.reason;
}

export async function fetchBrainGraph(options?: {
  sourceId?: string;
  limit?: number;
  cursor?: number | null;
}) {
  const client = createClient();
  const { tenant_id, sub_tenant_id } = getNamespaceMetadata();
  const limit = options?.limit ?? BRAIN_GRAPH_LIMIT;

  const [
    memoryRelationsResult,
    knowledgeRelationsResult,
    superNodesResult,
  ] = await Promise.allSettled([
    client.fetch.graphRelationsBySourceId({
      tenant_id,
      sub_tenant_id,
      is_memory: true,
      source_id: options?.sourceId,
      limit,
      cursor: options?.cursor,
    }),
    client.fetch.graphRelationsBySourceId({
      tenant_id,
      sub_tenant_id,
      is_memory: false,
      source_id: options?.sourceId,
      limit,
      cursor: options?.cursor,
    }),
    client.graphHealth.getSuperNodes({
      tenant_id,
      sub_tenant_id,
      limit: BRAIN_SUPER_NODES_LIMIT,
    }),
  ]);

  const memoryRelations = getGraphRelationsPayload(memoryRelationsResult);
  const knowledgeRelations = getGraphRelationsPayload(knowledgeRelationsResult);
  const superNodes =
    superNodesResult.status === "fulfilled"
      ? (superNodesResult.value.super_nodes ?? [])
      : [];

  return {
    relations: [
      ...(memoryRelations.relations ?? []),
      ...(knowledgeRelations.relations ?? []),
    ],
    superNodes,
    nextCursor:
      memoryRelations.next_cursor ?? knowledgeRelations.next_cursor ?? null,
    isTruncated:
      Boolean(memoryRelations.is_truncated) ||
      Boolean(knowledgeRelations.is_truncated),
  };
}
