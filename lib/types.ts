export type MemorySource = {
  sourceId: string;
  title: string | null;
  content: string;
  score: number | null;
<<<<<<< HEAD
=======
  sourceType: "knowledge" | "memory";
  metadata: Record<string, unknown> | null;
>>>>>>> origin/main
};

export type SaveMemoryResponse = {
  sourceId: string;
  status: string;
  message: string;
<<<<<<< HEAD
=======
  tags: string[];
>>>>>>> origin/main
};

export type AskResponse = {
  answer: string;
  sources: MemorySource[];
};

export type ApiErrorResponse = {
  error: string;
};
<<<<<<< HEAD
=======

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
>>>>>>> origin/main
