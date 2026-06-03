"use client";

import dynamic from "next/dynamic";
import {
  Brain,
  CircleHelp,
  ClipboardList,
  CornerDownRight,
  FileUp,
  Loader2,
  Save,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ResultPanel } from "@/components/result-panel";
import { UploadPanel } from "@/components/upload-panel";
import { VoiceInput } from "@/components/voice-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MAX_ASK_LENGTH, MAX_SAVE_LENGTH } from "@/lib/constants";
import type { AskResponse, SaveMemoryResponse, WorkspaceMode } from "@/lib/types";
import { cn } from "@/lib/utils";

const tabTriggerClassName = cn(
  "inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-medium text-muted-foreground transition-all sm:gap-2 sm:px-3 sm:text-sm",
  "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

const BrainPanel = dynamic(
  () => import("@/components/brain-panel").then((mod) => mod.BrainPanel),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground"
        aria-live="polite"
        aria-busy="true"
      >
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Loading knowledge graph...
      </div>
    ),
  },
);

type StatusState =
  | { type: "idle" }
  | { type: "loading"; message: string }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

export function MemoryInputCard() {
  const [mode, setMode] = useState<WorkspaceMode>("save");
  const [text, setText] = useState("");
  const [status, setStatus] = useState<StatusState>({ type: "idle" });
  const [answer, setAnswer] = useState<string | null>(null);

  const isInputMode = mode === "save" || mode === "ask";
  const isLoading = status.type === "loading" && isInputMode;
  const maxLength = mode === "save" ? MAX_SAVE_LENGTH : MAX_ASK_LENGTH;
  const placeholder =
    mode === "save"
      ? "Type a note, idea, or fact you want to remember... Use #tags like #work #ideas"
      : "Ask a question about your saved memories... Use #tags like #work to narrow results";
  const inputId = mode === "save" ? "memory-input" : "question-input";
  const inputLabel = mode === "save" ? "Memory text" : "Question text";

  function appendTranscript(transcript: string) {
    if (!isInputMode) {
      return;
    }

    setText((current) => {
      const trimmed = current.trim();
      const next = trimmed ? `${trimmed} ${transcript}` : transcript;
      return next.slice(0, maxLength);
    });
  }

  function resetResults() {
    setAnswer(null);
  }

  async function handleSave() {
    const content = text.trim();
    if (!content) {
      setStatus({ type: "error", message: "Please enter some text to save." });
      return;
    }

    resetResults();
    setStatus({ type: "loading", message: "Saving and indexing your memory..." });

    try {
      const response = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const data = (await response.json()) as SaveMemoryResponse & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save memory");
      }

      const tagSummary =
        data.tags.length > 0 ? ` Tags: ${data.tags.join(", ")}.` : "";

      setStatus({
        type: "success",
        message: `Memory saved (ID: ${data.sourceId.slice(0, 8)}…, status: ${data.status}).${tagSummary}`,
      });
      setText("");
      toast.success(data.message);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save memory";
      setStatus({ type: "error", message });
      toast.error(message);
    }
  }

  async function handleAsk() {
    const question = text.trim();
    if (!question) {
      setStatus({ type: "error", message: "Please enter a question." });
      return;
    }

    setStatus({ type: "loading", message: "Searching memories and generating answer..." });

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = (await response.json()) as AskResponse & { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to get an answer");
      }

      setAnswer(data.answer);
      setStatus({ type: "success", message: "Answer ready." });
      toast.success("Answer generated");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get an answer";
      setAnswer(null);
      setStatus({ type: "error", message });
      toast.error(message);
    }
  }

  function handlePrimaryAction() {
    if (mode === "save") {
      void handleSave();
      return;
    }

    if (mode === "ask") {
      void handleAsk();
    }
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <Card className="gap-0 overflow-hidden rounded-3xl border-border/70 bg-card/85 py-0 shadow-card backdrop-blur">
        <div className="border-b border-border/70 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-primary">Workspace</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                Capture, ask, and explore
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <CornerDownRight className="size-3.5 text-primary" aria-hidden />
              {status.type === "loading" ? status.message : "Ready"}
            </div>
          </div>
        </div>
        <div>
          <div
            className="mx-4 mt-4 grid h-auto w-auto grid-cols-4 justify-stretch gap-1 rounded-2xl bg-muted/70 p-1 sm:mx-5"
            role="tablist"
            aria-label="Workspace mode"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "save"}
              onClick={() => {
                setMode("save");
                setStatus({ type: "idle" });
                resetResults();
              }}
              className={cn(
                tabTriggerClassName,
                mode === "save" && "bg-card text-foreground shadow-sm",
              )}
            >
              <ClipboardList className="size-4" />
              <span className="sm:hidden">Save</span>
              <span className="hidden sm:inline">Save Memory</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "ask"}
              onClick={() => {
                setMode("ask");
                setStatus({ type: "idle" });
                resetResults();
              }}
              className={cn(
                tabTriggerClassName,
                mode === "ask" && "bg-card text-foreground shadow-sm",
              )}
            >
              <CircleHelp className="size-4" />
              <span className="sm:hidden">Ask</span>
              <span className="hidden sm:inline">Ask Question</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "upload"}
              onClick={() => {
                setMode("upload");
                setStatus({ type: "idle" });
                resetResults();
              }}
              className={cn(
                tabTriggerClassName,
                mode === "upload" && "bg-card text-foreground shadow-sm",
              )}
            >
              <FileUp className="size-4" />
              Upload
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "brain"}
              onClick={() => {
                setMode("brain");
                setStatus({ type: "idle" });
                resetResults();
              }}
              className={cn(
                tabTriggerClassName,
                mode === "brain" && "bg-card text-foreground shadow-sm",
              )}
            >
              <Brain className="size-4" />
              <span className="sm:hidden">Graph</span>
              <span className="hidden sm:inline">Brain</span>
            </button>
          </div>

          <CardContent className="space-y-4 px-4 pt-4 pb-5 sm:px-5">
            {mode === "brain" ? (
              <BrainPanel />
            ) : mode === "upload" ? (
              <UploadPanel />
            ) : (
              <>
                <div className="rounded-2xl border border-border/70 bg-background/80 p-3 shadow-inner">
                  <Textarea
                    id={inputId}
                    aria-label={inputLabel}
                    placeholder={placeholder}
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    maxLength={maxLength}
                    rows={8}
                    disabled={isLoading}
                    className="min-h-48 resize-y border-0 bg-transparent px-1 py-2 text-base leading-7 shadow-none placeholder:text-muted-foreground/75 focus-visible:border-transparent focus-visible:ring-0 disabled:bg-transparent dark:bg-transparent dark:disabled:bg-transparent"
                  />
                  <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-2">
                    <span
                      className={cn(
                        "text-xs tabular-nums text-muted-foreground",
                        text.length >= maxLength && "text-destructive",
                      )}
                    >
                      {text.length} / {maxLength}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setText("")}
                      disabled={isLoading || text.length === 0}
                      className="h-7 gap-1.5 text-muted-foreground"
                    >
                      <Trash2 className="size-3.5" />
                      Clear
                    </Button>
                  </div>
                </div>

                <VoiceInput
                  onTranscript={appendTranscript}
                  disabled={isLoading}
                />

                <Button
                  onClick={handlePrimaryAction}
                  disabled={isLoading}
                  className="h-11 w-full rounded-xl shadow-lg shadow-primary/15"
                  size="lg"
                >
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : mode === "save" ? (
                    <Save className="size-4" />
                  ) : (
                    <CircleHelp className="size-4" />
                  )}
                  {mode === "save" ? "Save to Second Brain" : "Ask Second Brain"}
                </Button>

                {status.type !== "idle" ? (
                  <Alert
                    variant={status.type === "error" ? "destructive" : "default"}
                  >
                    <AlertDescription>{status.message}</AlertDescription>
                  </Alert>
                ) : null}
              </>
            )}
          </CardContent>
        </div>
      </Card>

      <ResultPanel
        mode={mode}
        isLoading={isLoading && mode === "ask"}
        answer={answer}
      />
    </div>
  );
}
