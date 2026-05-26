export type MemorySource = {
  sourceId: string;
  title: string | null;
  content: string;
  score: number | null;
  sourceType: "knowledge" | "memory";
  metadata: Record<string, unknown> | null;
};

export type SaveMemoryResponse = {
  sourceId: string;
  status: string;
  message: string;
  tags: string[];
};

export type AskResponse = {
  answer: string;
  sources: MemorySource[];
};

export type ApiErrorResponse = {
  error: string;
};

export type ProfileSummary = {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "user";
  account_status:
    | "pending_approval"
    | "approved"
    | "blocked"
    | "rejected";
  failed_login_count: number;
  approved_at: string | null;
  blocked_at: string | null;
  block_reason: string | null;
  last_login_at: string | null;
  created_at: string;
};

export type AdminUsersResponse = {
  users: ProfileSummary[];
};

export type UploadKnowledgeResponse = {
  sourceId: string;
  status: string;
  fileName: string;
  tags: string[];
  message: string;
};

export type AudioMemoryResponse = {
  sourceId: string;
  status: string;
  transcript: string;
  tags: string[];
  message: string;
};

export type WorkspaceMode = "save" | "ask" | "upload" | "brain";

export type BrainGraphNode = {
  id: string;
  label: string;
  type: string;
  val: number;
};

export type BrainGraphLink = {
  id: string;
  source: string;
  target: string;
  label: string;
};

export type BrainGraphResponse = {
  nodes: BrainGraphNode[];
  links: BrainGraphLink[];
  nextCursor: number | null;
  isTruncated: boolean;
};
