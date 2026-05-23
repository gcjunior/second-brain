import OpenAI from "openai";
import type { MemorySource } from "@/lib/types";

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return new OpenAI({ apiKey });
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
    model: "gpt-4o-mini",
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
