import { Lock, ShieldCheck, Zap } from "lucide-react";

const features = [
  {
    icon: Lock,
    title: "Private & Secure",
    description: "Your data is encrypted and stored in HydraDB.",
    iconClassName:
      "bg-icon-tint text-icon-tint-foreground",
  },
  {
    icon: ShieldCheck,
    title: "Grounded Answers",
    description: "Answers are based on your memories + OpenAI.",
    iconClassName:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
  },
  {
    icon: Zap,
    title: "Fast & Simple",
    description: "Capture thoughts quickly with text or voice.",
    iconClassName:
      "bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400",
  },
] as const;

export function FeatureHighlights() {
  return (
    <section
      className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-6"
      aria-label="Features"
    >
      {features.map(({ icon: Icon, title, description, iconClassName }) => (
        <div key={title} className="flex flex-col items-center text-center sm:items-start sm:text-left">
          <div
            className={`mb-3 flex size-11 items-center justify-center rounded-full ${iconClassName}`}
            aria-hidden
          >
            <Icon className="size-5" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      ))}
    </section>
  );
}
