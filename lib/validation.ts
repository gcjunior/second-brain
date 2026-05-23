import { z } from "zod";

export const saveMemorySchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Memory content cannot be empty")
    .max(5000, "Memory content is too long"),
});

export const askQuestionSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, "Question cannot be empty")
    .max(2000, "Question is too long"),
});

export type SaveMemoryInput = z.infer<typeof saveMemorySchema>;
export type AskQuestionInput = z.infer<typeof askQuestionSchema>;
