export const MAX_SAVE_LENGTH = 5000;
export const MAX_ASK_LENGTH = 2000;
export const MAX_MEMORY_TAGS = 20;
export const MAX_MARKDOWN_FILE_BYTES = 2 * 1024 * 1024;
export const MAX_AUDIO_FILE_BYTES = 25 * 1024 * 1024;
export const DEFAULT_OPENAI_ANSWER_MODEL = "gpt-4o-mini";
export const DEFAULT_OPENAI_TRANSCRIBE_MODEL = "gpt-4o-mini-transcribe";
export const RECALL_MAX_RESULTS = 6;
export const RECALL_TAG_FILTER_MAX_RESULTS = 20;
export const INDEXING_MAX_ATTEMPTS = 24;
export const INDEXING_DELAY_MS = 1000;
export const BRAIN_GRAPH_LIMIT = 250;
export const BRAIN_SUPER_NODES_LIMIT = 20;
export const PURGE_LIST_PAGE_SIZE = 50;
export const PURGE_DELETE_BATCH_SIZE = 50;

/** Pre-auth MVP HydraDB sub-tenants; orphaned — production uses `user_<auth.users.id>` only. */
export const LEGACY_HYDRA_SUB_TENANT_IDS = ["demo_user", "mvp_user"] as const;

/** Rate limits (in-memory per instance; see lib/rate-limit.ts). */
export const RATE_LIMIT_WINDOW_MS = 60_000;
export const RATE_LIMIT_AUTH_FAILURE_WINDOW_MS = 15 * 60_000;
export const RATE_LIMIT_AUTH_FAILURE_PER_IP = 10;
export const RATE_LIMIT_AUTH_FAILURE_PER_EMAIL = 5;
export const RATE_LIMIT_ASK_PER_USER = 20;
export const RATE_LIMIT_AUDIO_PER_USER = 10;
export const RATE_LIMIT_MEMORY_PER_USER = 30;
export const RATE_LIMIT_BRAIN_PER_USER = 60;
export const RATE_LIMIT_ADMIN_PER_USER = 30;
