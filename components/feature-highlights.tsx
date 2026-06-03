import { Network, ShieldCheck, Zap } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Fast capture",
    description: "Save loose thoughts before they disappear.",
    iconClassName: "bg-primary/10 text-primary",
  },
  {
    icon: ShieldCheck,
    title: "Grounded answers",
    description: "Responses stay tied to retrieved sources.",
    iconClassName: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  },
  {
    icon: Network,
    title: "Graph context",
    description: "See people, topics, and documents connect.",
    iconClassName: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200",
  },
] as const;

export function FeatureHighlights() {
  return (
    <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1" aria-label="Features">
      {features.map(({ icon: Icon, title, description, iconClassName }) => (
        <div
          key={title}
          className="group flex items-start gap-3 rounded-2xl border border-border/70 bg-card/70 p-4 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card"
        >
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
            aria-hidden
          >
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
