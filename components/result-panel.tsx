"use client";

import { BookOpen, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  isLoading: boolean;
  answer: string | null;
  sources: MemorySource[];
};

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
    <div className="flex flex-col gap-4">
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="size-5 text-violet-500" />
            Answer
          </CardTitle>
          <CardDescription>
            Grounded response from your saved memories.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2" aria-live="polite" aria-busy="true">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : hasAnswer ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {answer}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Ask a question to see an answer here.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="size-5 text-violet-500" />
            Retrieved Sources
          </CardTitle>
          <CardDescription>
            Memory chunks used to generate the answer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="space-y-3" aria-live="polite" aria-busy="true">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : hasSources ? (
            sources.map((source, index) => (
              <article
                key={`${source.sourceId}-${index}`}
                className="rounded-lg border bg-muted/30 p-4"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">Source {index + 1}</Badge>
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
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {source.content || "No content available for this chunk."}
                </p>
                <p className="mt-2 font-mono text-[10px] text-muted-foreground/80">
                  ID: {source.sourceId}
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
