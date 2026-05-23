import { MemoryInputCard } from "@/components/memory-input-card";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50/60 via-background to-background dark:from-violet-950/20">
      <header className="border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-violet-600 dark:text-violet-400">
              Personal knowledge
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">Second Brain</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <p className="mb-6 text-sm text-muted-foreground">
          Save notes and facts, then ask questions later. Type or use voice input —
          your memories stay in HydraDB and answers are grounded with OpenAI.
        </p>
        <MemoryInputCard />
      </main>

      <footer className="mx-auto w-full max-w-3xl px-4 pb-10 text-center text-xs text-muted-foreground sm:px-6">
        Single-user MVP · No auth · Text and voice only
      </footer>
    </div>
  );
}
