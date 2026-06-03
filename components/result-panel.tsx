"use client";

import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { WorkspaceMode } from "@/lib/types";

type ResultPanelProps = {
  mode: WorkspaceMode;
  isLoading: boolean;
  answer: string | null;
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
    <div className="flex items-start gap-3 border-b border-border/70 px-4 pt-5 pb-4 sm:px-5">
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
        aria-hidden
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 space-y-0.5">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function ResultPanel({ mode, isLoading, answer }: ResultPanelProps) {
  if (mode !== "ask") {
    return null;
  }

  const hasAnswer = Boolean(answer);

  return (
    <Card className="gap-0 overflow-hidden rounded-3xl border-border/70 bg-card/85 py-0 shadow-card backdrop-blur">
      <PanelHeader
        icon={Sparkles}
        title="Answer"
        description="Grounded response from your saved memories."
      />
      <CardContent className="px-4 pt-4 pb-5 sm:px-5">
        {isLoading ? (
          <div
            className="space-y-2 rounded-2xl bg-muted/70 p-4"
            aria-live="polite"
            aria-busy="true"
          >
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : hasAnswer ? (
          <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
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
  );
}
