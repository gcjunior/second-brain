import { Sparkles } from "lucide-react";

export function IntroBanner() {
  return (
    <div className="mb-8 flex gap-3 rounded-2xl bg-banner px-4 py-4 text-banner-foreground sm:gap-4 sm:px-5 sm:py-5">
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary sm:size-10"
        aria-hidden
      >
        <Sparkles className="size-4 sm:size-5" />
      </div>
      <div className="min-w-0 space-y-1 text-sm leading-relaxed sm:text-[0.9375rem]">
        <p className="font-medium text-foreground">
          Save notes and facts, then ask questions later.
        </p>
        <p className="text-muted-foreground">
          Your memories stay in HydraDB and answers are grounded with OpenAI.
        </p>
      </div>
    </div>
  );
}
