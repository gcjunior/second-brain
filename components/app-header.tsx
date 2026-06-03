import { Brain, Circle } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20"
            aria-hidden
          >
            <Brain className="size-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">
              Second Brain
            </h1>
            <p className="text-[0.68rem] font-semibold uppercase text-muted-foreground sm:text-xs">
              Voice-first knowledge recall
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm sm:flex">
            <Circle className="size-2 fill-orange-500 text-orange-500 dark:fill-orange-300 dark:text-orange-300" aria-hidden />
            Ready for demo
          </div>
          <ThemeToggle />
          <div
            className="flex size-9 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background"
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
