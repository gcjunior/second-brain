import { Brain } from "lucide-react";
import { getAuthUser } from "@/lib/auth";
import { AppHeaderActions } from "@/components/app-header-actions";
import { ThemeToggle } from "@/components/theme-toggle";

export async function AppHeaderShell() {
  const authUser = await getAuthUser();
  const email = authUser?.email ?? "user";
  const isAdmin = authUser?.profile.role === "admin";

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
          <ThemeToggle />
          <AppHeaderActions email={email} isAdmin={isAdmin} />
        </div>
      </div>
    </header>
  );
}
