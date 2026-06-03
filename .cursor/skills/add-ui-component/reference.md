# UI component reference

## Project layout

```
components/
├── main-workspace.tsx      # page shell (client)
├── memory-input-card.tsx   # tabs, fetch, status (client)
├── result-panel.tsx        # ask results + sources (client)
├── voice-input.tsx         # Web Speech API (client)
├── app-header.tsx          # static header
├── theme-provider.tsx      # next-themes wrapper (client)
├── theme-toggle.tsx        # theme button (client)
└── ui/                     # shadcn primitives
```

## shadcn / Tailwind setup

- Style: **base-nova** (`components.json`)
- Primitives: `@base-ui/react` (not Radix)
- Global styles: `app/globals.css` — OKLCH tokens, `.dark` class
- Utility merge: `cn()` in `lib/utils.ts`

## Reusable class patterns

```typescript
// Card shell
className="rounded-2xl border-border/60 bg-card shadow-card"

// Input area
className="rounded-xl bg-cream-dark/80 p-3"

// Muted helper text
className="text-xs text-muted-foreground"

// Primary CTA
<Button size="lg" className="w-full" />
```

## Local subcomponents

Colocate small helpers as functions in the same file (see `ResultPanel`, tab triggers in `memory-input-card.tsx`). Extract to separate files only when reused.

## When to extract hooks

Move to `hooks/use-*.ts` when:

- Same fetch + error handling appears in 2+ components
- Speech or theme logic grows beyond ~20 lines

Import via `@/hooks/use-memory-save` (alias in `components.json`).

## Anti-patterns

| Avoid | Prefer |
| --- | --- |
| `bg-emerald-100 text-emerald-700` | `bg-primary`, `text-muted-foreground`, semantic tokens |
| Hardcoded `5000` / `2000` | `@/lib/constants` |
| Fetch in `lib/hydradb.ts` from components | `fetch("/api/...")` only |
| New global state library | Local `useState` for MVP scope |

## Result panel pattern

`components/result-panel.tsx` — shows answer text, loading skeleton, and source list with `sourceId`, `title`, `score`. Mirror this for new read-only result UIs.
