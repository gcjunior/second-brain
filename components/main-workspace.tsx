import { Lock, Radio, Sparkles } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { FeatureHighlights } from "@/components/feature-highlights";
import { IntroBanner } from "@/components/intro-banner";
import { MemoryInputCard } from "@/components/memory-input-card";

export function MainWorkspace() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <AppHeader />

      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 py-5 sm:px-6 sm:py-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-8">
        <section className="order-2 space-y-5 lg:sticky lg:top-24 lg:order-1">
          <IntroBanner />
          <FeatureHighlights />
          <div className="hidden rounded-2xl border border-border/70 bg-card/70 p-4 shadow-card backdrop-blur md:block">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
              <Radio className="size-3.5 text-primary" aria-hidden />
              Demo Signal
            </div>
            <div className="grid gap-3 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2">
                <span className="text-muted-foreground">Voice states</span>
                <span className="font-medium text-foreground">Idle to Listen to Process</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2">
                <span className="text-muted-foreground">Graph explorer</span>
                <span className="font-medium text-foreground">Live HydraDB</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2">
                <span className="text-muted-foreground">Grounding</span>
                <span className="font-medium text-foreground">Sources shown</span>
              </div>
            </div>
          </div>
        </section>

        <section className="order-1 min-w-0 lg:order-2">
          <MemoryInputCard />
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-7xl shrink-0 flex-wrap items-center justify-center gap-2 px-4 pb-8 text-center text-xs text-muted-foreground sm:px-6">
        <Lock className="size-3.5 shrink-0" aria-hidden />
        <span>Single-user demo · Fixed HydraDB sub-tenant · Text, Markdown, and audio</span>
        <Sparkles className="size-3.5 shrink-0 text-primary" aria-hidden />
      </footer>
    </div>
  );
}
