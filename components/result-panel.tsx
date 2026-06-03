"use client";

import type { LucideIcon } from "lucide-react";
import { BookOpen, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
<<<<<<< HEAD
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { MemorySource } from "@/lib/types";

type ResultPanelProps = {
  mode: "save" | "ask";
=======
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { MemorySource, WorkspaceMode } from "@/lib/types";

type ResultPanelProps = {
  mode: WorkspaceMode;
>>>>>>> origin/main
  isLoading: boolean;
  answer: string | null;
  sources: MemorySource[];
};

function PanelHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
<<<<<<< HEAD
    <CardHeader className="flex flex-row items-start gap-3 border-b border-border/60 pb-4">
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-icon-tint text-icon-tint-foreground"
=======
    <div className="flex items-start gap-3 border-b border-border/70 px-4 pt-5 pb-4 sm:px-5">
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
>>>>>>> origin/main
        aria-hidden
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 space-y-0.5">
<<<<<<< HEAD
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>
    </CardHeader>
=======
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
>>>>>>> origin/main
  );
}

export function ResultPanel({
  mode,
  isLoading,
  answer,
  sources,
}: ResultPanelProps) {
  if (mode !== "ask") {
    return null;
  }

  const hasAnswer = Boolean(answer);
  const hasSources = sources.length > 0;

  return (
    <div className="flex flex-col gap-6">
<<<<<<< HEAD
      <Card className="gap-0 overflow-hidden rounded-2xl border-border/60 py-0 shadow-sm">
=======
      <Card className="gap-0 overflow-hidden rounded-3xl border-border/70 bg-card/85 py-0 shadow-card backdrop-blur">
>>>>>>> origin/main
        <PanelHeader
          icon={Sparkles}
          title="Answer"
          description="Grounded response from your saved memories."
        />
<<<<<<< HEAD
        <CardContent className="pt-4 pb-6">
          {isLoading ? (
            <div
              className="space-y-2 rounded-xl bg-muted/40 p-4 dark:bg-muted/20"
=======
        <CardContent className="px-4 pt-4 pb-5 sm:px-5">
          {isLoading ? (
            <div
              className="space-y-2 rounded-2xl bg-muted/70 p-4"
>>>>>>> origin/main
              aria-live="polite"
              aria-busy="true"
            >
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : hasAnswer ? (
<<<<<<< HEAD
            <div className="rounded-xl bg-muted/40 p-4 dark:bg-muted/20">
=======
            <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
>>>>>>> origin/main
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {answer}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Ask a question to see an answer here.
            </p>
          )}
        </CardContent>
      </Card>

<<<<<<< HEAD
      <Card className="gap-0 overflow-hidden rounded-2xl border-border/60 py-0 shadow-sm">
=======
      <Card className="gap-0 overflow-hidden rounded-3xl border-border/70 bg-card/85 py-0 shadow-card backdrop-blur">
>>>>>>> origin/main
        <PanelHeader
          icon={BookOpen}
          title="Retrieved Sources"
          description="Memory chunks used to generate the answer."
        />
<<<<<<< HEAD
        <CardContent className="space-y-3 pt-4 pb-6">
=======
        <CardContent className="space-y-3 px-4 pt-4 pb-5 sm:px-5">
>>>>>>> origin/main
          {isLoading ? (
            <div className="space-y-3" aria-live="polite" aria-busy="true">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          ) : hasSources ? (
            sources.map((source, index) => (
              <article
                key={`${source.sourceId}-${index}`}
<<<<<<< HEAD
                className="rounded-xl border border-border/60 bg-muted/30 p-4"
=======
                className="rounded-2xl border border-border/70 bg-background/80 p-4 transition-all hover:border-primary/25 hover:shadow-sm"
>>>>>>> origin/main
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary hover:bg-primary/10"
                  >
                    Source {index + 1}
                  </Badge>
                  {source.title ? (
                    <span className="text-xs font-medium text-foreground">
                      {source.title}
                    </span>
                  ) : null}
                  {source.score != null ? (
                    <Badge variant="outline" className="text-xs">
                      {Math.round(source.score * 100)}% match
                    </Badge>
                  ) : null}
<<<<<<< HEAD
=======
                  <Badge variant="outline" className="text-xs capitalize">
                    {source.sourceType}
                  </Badge>
>>>>>>> origin/main
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {source.content || "No content available for this chunk."}
                </p>
                <p className="mt-2 font-mono text-[10px] text-muted-foreground/80">
                  ID: {source.sourceId}
<<<<<<< HEAD
=======
                  {typeof source.metadata?.file_name === "string"
                    ? ` · ${source.metadata.file_name}`
                    : ""}
>>>>>>> origin/main
                </p>
              </article>
            ))
          ) : hasAnswer ? (
            <p className="text-sm text-muted-foreground">
              No matching memory chunks were retrieved for this question.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sources from HydraDB will appear here after you ask a question.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
