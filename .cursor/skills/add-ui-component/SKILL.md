---
name: add-ui-component
description: Creates React components matching Second Brain UI patterns (shadcn base-nova, Tailwind 4 tokens, lucide icons). Use when adding or modifying components/, voice input, result panels, or styling.
---

# Add UI component

## File placement

| Type | Location |
| --- | --- |
| Feature UI (workspace, cards, voice) | `components/<name>.tsx` |
| shadcn primitives | `components/ui/` via CLI |
| Reusable client hooks | `hooks/use-<name>.ts` |

Add shadcn components:

```bash
npx shadcn@latest add <component>
```

Respect `components.json` (base-nova, `@base-ui/react`).

## Component template

```tsx
"use client"; // only if needed

import { cn } from "@/lib/utils";
// import from @/components/ui/*

type MyComponentProps = {
  // props
};

export function MyComponent({ }: MyComponentProps) {
  return (
    <div className={cn("rounded-2xl border-border/60 shadow-card", /* ... */)}>
      {/* content */}
    </div>
  );
}
```

## Async state pattern

Use discriminated unions (from `memory-input-card.tsx`):

```typescript
type StatusState =
  | { type: "idle" }
  | { type: "loading"; message: string }
  | { type: "success"; message: string }
  | { type: "error"; message: string };
```

## Client fetch pattern

```typescript
const response = await fetch("/api/memories", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ content }),
});

const data = (await response.json()) as SaveMemoryResponse & { error?: string };

if (!response.ok) {
  throw new Error(data.error ?? "Failed to save memory");
}
```

On success: update state + `toast.success()`. On error: `setStatus({ type: "error", message })` + `toast.error()`.

## Styling conventions

- Merge classes: `cn("base", condition && "variant")`
- Layout: `rounded-2xl`, `border-border/60`, `shadow-card`, `max-w-4xl`, `bg-cream-dark/80`
- Colors: theme tokens (`bg-primary`, `text-muted-foreground`) — avoid raw `bg-emerald-100` style palette classes
- Icons: `lucide-react`, `aria-hidden` when decorative

## Char limits

Import from `@/lib/constants`:

```typescript
import { MAX_SAVE_LENGTH, MAX_ASK_LENGTH } from "@/lib/constants";
```

## Accessibility

- `aria-label` on inputs
- `aria-live` / `aria-busy` for loading regions
- `role="alert"` on error alerts

## Additional resources

- Layout and token details: [reference.md](reference.md)
- Canonical example: `components/memory-input-card.tsx`
