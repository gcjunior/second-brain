"use client";

import {
  CircleHelp,
  ClipboardList,
  Loader2,
  Save,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ResultPanel } from "@/components/result-panel";
import { VoiceInput } from "@/components/voice-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { AskResponse, MemorySource, SaveMemoryResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

const MAX_SAVE_LENGTH = 5000;
const MAX_ASK_LENGTH = 2000;

const tabTriggerClassName = cn(
  "flex-1 gap-2 rounded-none border-0 py-3.5 text-muted-foreground shadow-none",
  "data-active:bg-transparent data-active:text-primary dark:data-active:bg-transparent",
  "data-active:after:h-1 data-active:after:bg-primary data-active:after:opacity-100"
);

type Mode = "save" | "ask";

type StatusState =
  | { type: "idle" }
  | { type: "loading"; message: string }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

export function MemoryInputCard() {
  const [mode, setMode] = useState<Mode>("save");
  const [text, setText] = useState("");
  const [status, setStatus] = useState<StatusState>({ type: "idle" });
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<MemorySource[]>([]);

  const isLoading = status.type === "loading";
  const maxLength = mode === "save" ? MAX_SAVE_LENGTH : MAX_ASK_LENGTH;
  const placeholder =
    mode === "save"
      ? "Type a note, idea, or fact you want to remember..."
      : "Ask a question about your saved memories...";
  const inputId = mode === "save" ? "memory-input" : "question-input";
  const inputLabel = mode === "save" ? "Memory text" : "Question text";

  function appendTranscript(transcript: string) {
    setText((current) => {
      const trimmed = current.trim();
      const next = trimmed ? `${trimmed} ${transcript}` : transcript;
      return next.slice(0, maxLength);
    });
  }

  function resetResults() {
    setAnswer(null);
    setSources([]);
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

      setStatus({
        type: "success",
        message: `Memory saved (ID: ${data.sourceId.slice(0, 8)}…, status: ${data.status}).`,
      });
      setText("");
      toast.success("Memory saved");
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
      setSources(data.sources);
      setStatus({ type: "success", message: "Answer ready." });
      toast.success("Answer generated");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get an answer";
      setAnswer(null);
      setSources([]);
      setStatus({ type: "error", message });
      toast.error(message);
    }
  }

  function handlePrimaryAction() {
    if (mode === "save") {
      void handleSave();
    } else {
      void handleAsk();
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <Card className="gap-0 overflow-hidden rounded-2xl border-border/60 py-0 shadow-sm">
        <Tabs
          value={mode}
          onValueChange={(value) => {
            setMode(value as Mode);
            setStatus({ type: "idle" });
            resetResults();
          }}
          className="gap-0"
        >
          <TabsList
            variant="line"
            className="h-auto w-full justify-stretch gap-0 border-b border-border bg-transparent px-2"
          >
            <TabsTrigger value="save" className={tabTriggerClassName}>
              <ClipboardList className="size-4" />
              Save Memory
            </TabsTrigger>
            <TabsTrigger value="ask" className={tabTriggerClassName}>
              <CircleHelp className="size-4" />
              Ask Question
            </TabsTrigger>
          </TabsList>

          <CardContent className="space-y-4 pt-4 pb-6">
            <div className="rounded-xl bg-muted/40 p-3 dark:bg-muted/20">
              <Textarea
                id={inputId}
                aria-label={inputLabel}
                placeholder={placeholder}
                value={text}
                onChange={(event) => setText(event.target.value)}
                maxLength={maxLength}
                rows={8}
                disabled={isLoading}
                className="min-h-44 resize-y border-0 bg-transparent px-1 py-2 shadow-none focus-visible:border-transparent focus-visible:ring-0 disabled:bg-transparent dark:bg-transparent dark:disabled:bg-transparent"
              />
              <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-2">
                <span
                  className={cn(
                    "text-xs tabular-nums text-muted-foreground",
                    text.length >= maxLength && "text-destructive"
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
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : mode === "save" ? (
                <Save className="size-4" />
              ) : (
                <CircleHelp className="size-4" />
              )}
              {mode === "save" ? "Save Memory" : "Ask"}
            </Button>

            {status.type !== "idle" ? (
              <Alert
                variant={status.type === "error" ? "destructive" : "default"}
              >
                <AlertDescription>{status.message}</AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Tabs>
      </Card>

      <ResultPanel
        mode={mode}
        isLoading={isLoading && mode === "ask"}
        answer={answer}
        sources={sources}
      />
    </div>
  );
}
