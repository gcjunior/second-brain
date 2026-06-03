import { z } from "zod";
<<<<<<< HEAD
=======
import {
  MAX_ASK_LENGTH,
  MAX_AUDIO_FILE_BYTES,
  MAX_MARKDOWN_FILE_BYTES,
  MAX_SAVE_LENGTH,
} from "@/lib/constants";
import { parseMemoryContent } from "@/lib/memory-content";
>>>>>>> origin/main

export const saveMemorySchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Memory content cannot be empty")
<<<<<<< HEAD
    .max(5000, "Memory content is too long"),
=======
    .max(MAX_SAVE_LENGTH, "Memory content is too long")
    .refine((raw) => parseMemoryContent(raw).content.length > 0, {
      message: "Memory content cannot be empty after removing hashtags.",
    }),
>>>>>>> origin/main
});

export const askQuestionSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, "Question cannot be empty")
<<<<<<< HEAD
    .max(2000, "Question is too long"),
=======
    .max(MAX_ASK_LENGTH, "Question is too long")
    .refine((raw) => {
      const { content, tags } = parseMemoryContent(raw);
      return content.length > 0 || tags.length > 0;
    }, {
      message: "Question cannot be empty",
    }),
});

export const markdownUploadSchema = z.object({
  fileName: z
    .string()
    .trim()
    .min(1, "Markdown file name is required")
    .refine((fileName) => fileName.toLowerCase().endsWith(".md"), {
      message: "Only .md files are supported",
    }),
  fileSize: z
    .number()
    .int()
    .positive("Markdown file cannot be empty")
    .max(MAX_MARKDOWN_FILE_BYTES, "Markdown file is too large"),
  contentType: z.string().optional(),
  context: z.string().trim().max(500, "Context is too long").optional(),
});

export const audioUploadSchema = z.object({
  fileName: z.string().trim().min(1, "Audio file name is required"),
  fileSize: z
    .number()
    .int()
    .positive("Audio file cannot be empty")
    .max(MAX_AUDIO_FILE_BYTES, "Audio file is too large"),
  contentType: z
    .string()
    .min(1, "Audio content type is required")
    .refine((contentType) => contentType.startsWith("audio/"), {
      message: "Only audio files are supported",
    }),
  context: z.string().trim().max(500, "Context is too long").optional(),
>>>>>>> origin/main
});

export type SaveMemoryInput = z.infer<typeof saveMemorySchema>;
export type AskQuestionInput = z.infer<typeof askQuestionSchema>;
<<<<<<< HEAD
=======
export type MarkdownUploadInput = z.infer<typeof markdownUploadSchema>;
export type AudioUploadInput = z.infer<typeof audioUploadSchema>;
>>>>>>> origin/main
