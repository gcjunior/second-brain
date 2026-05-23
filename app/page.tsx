import { Lock } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { FeatureHighlights } from "@/components/feature-highlights";
import { IntroBanner } from "@/components/intro-banner";
import { MemoryInputCard } from "@/components/memory-input-card";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <IntroBanner />
        <MemoryInputCard />
        <FeatureHighlights />
      </main>

      <footer className="mx-auto flex w-full max-w-4xl items-center justify-center gap-1.5 px-4 pb-10 text-center text-xs text-muted-foreground sm:px-6">
        <Lock className="size-3.5 shrink-0" aria-hidden />
        <span>Single-user MVP · No auth · Text and voice only</span>
      </footer>
    </div>
  );
}
