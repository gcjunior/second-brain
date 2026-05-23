"use client";

import { Brain, Loader2, MessageCircleQuestion, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ResultPanel } from "@/components/result-panel";
import { VoiceInput } from "@/components/voice-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { AskResponse, MemorySource, SaveMemoryResponse } from "@/lib/types";

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
  const placeholder =
    mode === "save"
      ? "Type a note, idea, or fact you want to remember..."
      : "Ask a question about your saved memories...";

  function appendTranscript(transcript: string) {
    setText((current) => {
      const trimmed = current.trim();
      return trimmed ? `${trimmed} ${transcript}` : transcript;
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
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            {mode === "save" ? (
              <Save className="size-5 text-violet-500" />
            ) : (
              <MessageCircleQuestion className="size-5 text-violet-500" />
            )}
            {mode === "save" ? "Save Memory" : "Ask Question"}
          </CardTitle>
          <CardDescription>
            {mode === "save"
              ? "Capture thoughts as memories you can recall later."
              : "Ask natural-language questions grounded in your saved memories."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs
            value={mode}
            onValueChange={(value) => {
              setMode(value as Mode);
              setStatus({ type: "idle" });
              resetResults();
            }}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="save" className="gap-2">
                <Brain className="size-4" />
                Save Memory
              </TabsTrigger>
              <TabsTrigger value="ask" className="gap-2">
                <MessageCircleQuestion className="size-4" />
                Ask Question
              </TabsTrigger>
            </TabsList>

            <TabsContent value="save" className="mt-4 space-y-4">
              <Textarea
                id="memory-input"
                aria-label="Memory text"
                placeholder={placeholder}
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={6}
                disabled={isLoading}
                className="min-h-36 resize-y"
              />
            </TabsContent>

            <TabsContent value="ask" className="mt-4 space-y-4">
              <Textarea
                id="question-input"
                aria-label="Question text"
                placeholder={placeholder}
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={6}
                disabled={isLoading}
                className="min-h-36 resize-y"
              />
            </TabsContent>
          </Tabs>

          <VoiceInput
            onTranscript={appendTranscript}
            disabled={isLoading}
          />

          <Button
            onClick={handlePrimaryAction}
            disabled={isLoading}
            className="w-full bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600"
            size="lg"
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : mode === "save" ? (
              <Save className="size-4" />
            ) : (
              <MessageCircleQuestion className="size-4" />
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
