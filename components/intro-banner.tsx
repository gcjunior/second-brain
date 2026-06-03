import { BrainCircuit, Mic2, Sparkles } from "lucide-react";

export function IntroBanner() {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/70 bg-card/75 p-5 text-banner-foreground shadow-card backdrop-blur sm:p-6 lg:p-7">
      <div className="mb-6 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="size-3.5" aria-hidden />
          AI recall workspace
        </span>
      </div>
      <div className="space-y-4">
        <h2 className="max-w-xl text-4xl font-semibold leading-[1.02] tracking-tight text-foreground sm:text-5xl lg:text-[3.4rem]">
          Ask your notes like they are listening.
        </h2>
        <p className="max-w-lg text-base leading-7 text-muted-foreground">
          Capture thoughts by voice or Markdown, then explore the relationships behind every answer through a living knowledge graph.
        </p>
      </div>
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
          <Mic2 className="mb-3 size-5 text-primary" aria-hidden />
          <p className="text-sm font-semibold text-foreground">Calm voice capture</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Continuous listening, clear stop control, and silence-aware finalization.
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
          <BrainCircuit className="mb-3 size-5 text-primary" aria-hidden />
          <p className="text-sm font-semibold text-foreground">Visible memory graph</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Relationships become part of the workspace, not a buried technical detail.
          </p>
        </div>
      </div>
    </div>
  );
}
