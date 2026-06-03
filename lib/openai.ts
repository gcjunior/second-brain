import OpenAI from "openai";
import {
  DEFAULT_OPENAI_ANSWER_MODEL,
  DEFAULT_OPENAI_TRANSCRIBE_MODEL,
} from "@/lib/constants";
import type { MemorySource } from "@/lib/types";

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.OPENAI_APIKEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return new OpenAI({ apiKey });
}

function getAnswerModel() {
  return process.env.OPENAI_ANSWER_MODEL ?? DEFAULT_OPENAI_ANSWER_MODEL;
}

function getTranscribeModel() {
  return (
    process.env.OPENAI_TRANSCRIBE_MODEL ?? DEFAULT_OPENAI_TRANSCRIBE_MODEL
  );
}

function formatContext(sources: MemorySource[]): string {
  if (sources.length === 0) {
    return "No memories were found.";
  }

  return sources
    .map((source, index) => {
      const title = source.title ? ` (${source.title})` : "";
      return `[${index + 1}]${title}\n${source.content}`;
    })
    .join("\n\n---\n\n");
}

export async function generateGroundedAnswer(
  question: string,
  sources: MemorySource[],
): Promise<string> {
  const client = getClient();
  const context = formatContext(sources);

  const completion = await client.chat.completions.create({
    model: getAnswerModel(),
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: `You are a helpful second-brain assistant. Answer the user's question using ONLY the provided memories.
If the memories do not contain enough information, say you do not have enough saved context and suggest saving more memories.
Do not invent facts. Keep answers concise and clear.`,
      },
      {
        role: "user",
        content: `Memories:\n${context}\n\nQuestion: ${question}`,
      },
    ],
  });

  const answer = completion.choices[0]?.message?.content?.trim();
  if (!answer) {
    throw new Error("OpenAI returned an empty response");
  }

  return answer;
}

export async function transcribeAudioFile(
  file: File,
  context?: string,
): Promise<string> {
  const client = getClient();
  const transcription = await client.audio.transcriptions.create({
    file,
    model: getTranscribeModel(),
    language: "en",
    prompt: context,
    response_format: "json",
  });

  const transcript = transcription.text.trim();
  if (!transcript) {
    throw new Error("OpenAI returned an empty transcription");
  }

  return transcript;
}
