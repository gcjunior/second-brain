"use client";

import { FileText, Upload, Volume2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import type {
  AudioMemoryResponse,
  UploadKnowledgeResponse,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type UploadStatus =
  | { type: "idle" }
  | { type: "loading"; message: string }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof FileText;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
        aria-hidden
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

export function UploadPanel() {
  const [context, setContext] = useState("");
  const [status, setStatus] = useState<UploadStatus>({ type: "idle" });

  const isLoading = status.type === "loading";

  async function uploadMarkdown(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("context", context);

    setStatus({
      type: "loading",
      message: "Uploading Markdown and waiting for indexing...",
    });

    try {
      const response = await fetch("/api/knowledge", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as UploadKnowledgeResponse & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to upload Markdown");
      }

      const tagSummary =
        data.tags.length > 0 ? ` Tags: ${data.tags.join(", ")}.` : "";
      setStatus({
        type: "success",
        message: `${data.fileName} indexed (ID: ${data.sourceId.slice(0, 8)}..., status: ${data.status}).${tagSummary}`,
      });
      toast.success(data.message);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload Markdown";
      setStatus({ type: "error", message });
      toast.error(message);
    }
  }

  async function uploadAudio(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("context", context);

    setStatus({
      type: "loading",
      message: "Transcribing audio and saving it as a memory...",
    });

    try {
      const response = await fetch("/api/audio", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as AudioMemoryResponse & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to process audio");
      }

      const preview =
        data.transcript.length > 120
          ? `${data.transcript.slice(0, 120)}...`
          : data.transcript;
      setStatus({
        type: "success",
        message: `Audio saved (ID: ${data.sourceId.slice(0, 8)}..., status: ${data.status}). Transcript: ${preview}`,
      });
      toast.success(data.message);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to process audio";
      setStatus({ type: "error", message });
      toast.error(message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/70 bg-background/80 p-3 shadow-inner">
        <Textarea
          aria-label="Upload context and tags"
          placeholder="Optional context or #tags to attach to uploaded files and audio..."
          value={context}
          onChange={(event) => setContext(event.target.value)}
          maxLength={500}
          rows={3}
          disabled={isLoading}
          className="min-h-24 resize-y border-0 bg-transparent px-1 py-2 shadow-none focus-visible:border-transparent focus-visible:ring-0 disabled:bg-transparent dark:bg-transparent dark:disabled:bg-transparent"
        />
        <div className="border-t border-border/50 pt-2 text-xs tabular-nums text-muted-foreground">
          {context.length} / 500
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm">
          <SectionHeader
            icon={FileText}
            title="Markdown Knowledge"
            description="Upload .md files into HydraDB knowledge for semantic retrieval."
          />
          <label
            className={cn(
              "flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card/70 p-4 text-center transition-all",
              "hover:-translate-y-0.5 hover:border-primary/30 hover:bg-muted/50 hover:shadow-sm",
              isLoading && "pointer-events-none opacity-60",
            )}
          >
            <Upload className="size-5 text-primary" aria-hidden />
            <span className="text-sm font-medium text-foreground">
              Choose Markdown file
            </span>
            <span className="text-xs text-muted-foreground">
              .md files up to 2 MB
            </span>
            <input
              type="file"
              accept=".md,text/markdown,text/plain"
              className="sr-only"
              disabled={isLoading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) {
                  void uploadMarkdown(file);
                }
              }}
            />
          </label>
        </div>

        <div className="space-y-3 rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm">
          <SectionHeader
            icon={Volume2}
            title="Audio Memory"
            description="Upload audio, transcribe it, and save the transcript as memory."
          />

          <label
            className={cn(
              "flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card/70 p-4 text-center transition-all",
              "hover:-translate-y-0.5 hover:border-primary/30 hover:bg-muted/50 hover:shadow-sm",
              isLoading && "pointer-events-none opacity-60",
            )}
          >
            <Upload className="size-5 text-primary" aria-hidden />
            <span className="text-sm font-medium text-foreground">
              Choose audio file
            </span>
            <span className="text-xs text-muted-foreground">
              Common formats such as mp3, m4a, wav, webm
            </span>
            <input
              type="file"
              accept="audio/*"
              className="sr-only"
              disabled={isLoading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) {
                  void uploadAudio(file);
                }
              }}
            />
          </label>
        </div>
      </div>

      {status.type !== "idle" ? (
        <Alert variant={status.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{status.message}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
