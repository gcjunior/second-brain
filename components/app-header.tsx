<<<<<<< HEAD
import { Brain } from "lucide-react";
=======
import { Brain, Circle } from "lucide-react";
>>>>>>> origin/main
import { ThemeToggle } from "@/components/theme-toggle";

export function AppHeader() {
  return (
<<<<<<< HEAD
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm"
=======
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20"
>>>>>>> origin/main
            aria-hidden
          >
            <Brain className="size-5" />
          </div>
          <div className="min-w-0">
<<<<<<< HEAD
            <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
              Second Brain
            </h1>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:text-xs">
              Personal knowledge
=======
            <h1 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">
              Second Brain
            </h1>
            <p className="text-[0.68rem] font-semibold uppercase text-muted-foreground sm:text-xs">
              Voice-first knowledge recall
>>>>>>> origin/main
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
<<<<<<< HEAD
          <ThemeToggle />
          <div
            className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
=======
          <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm sm:flex">
            <Circle className="size-2 fill-orange-500 text-orange-500 dark:fill-orange-300 dark:text-orange-300" aria-hidden />
            Ready for demo
          </div>
          <ThemeToggle />
          <div
            className="flex size-9 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background"
>>>>>>> origin/main
            aria-hidden
            title="User"
          >
            U
          </div>
        </div>
      </div>
    </header>
  );
}
