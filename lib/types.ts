export type MemorySource = {
  sourceId: string;
  title: string | null;
  content: string;
  score: number | null;
};

export type SaveMemoryResponse = {
  sourceId: string;
  status: string;
  message: string;
};

export type AskResponse = {
  answer: string;
  sources: MemorySource[];
};

export type ApiErrorResponse = {
  error: string;
};
