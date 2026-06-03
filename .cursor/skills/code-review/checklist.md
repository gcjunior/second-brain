# Code review checklist

## Architecture

- [ ] Secrets and SDK clients stay in `lib/*`, not client components
- [ ] Data flow is components → `fetch /api/*` → route → lib → external API
- [ ] No unrequested MVP scope (auth, in-repo DB, global state libs, background jobs)

## API routes (`app/api/**`)

- [ ] JSON body validated with Zod `safeParse`
- [ ] 400 returns `{ error: firstZodMessage }`
- [ ] 500 logs `console.error("[VERB /api/path]", error)` and returns `{ error: message }`
- [ ] Success responses use types from `lib/types.ts`
- [ ] Business logic lives in `lib/*`, not the route file

## lib/

- [ ] New schemas in `lib/validation.ts` with exported inferred types
- [ ] New response types in `lib/types.ts`
- [ ] Limits use `lib/constants.ts`
- [ ] No `"use client"` in lib files
- [ ] HydraDB uses `SUB_TENANT_ID = "mvp_user"` unless multi-tenant was explicitly requested

## Components

- [ ] File `kebab-case.tsx`, export `PascalCase`
- [ ] `"use client"` only where required
- [ ] shadcn primitives from `components/ui/`
- [ ] Classes merged with `cn()`
- [ ] Theme tokens over raw palette colors (`bg-emerald-*`, etc.)
- [ ] Async state uses discriminated unions where applicable
- [ ] Errors shown via Alert + sonner toast
- [ ] Accessibility: labels, `aria-live` for dynamic content

## Integrations

- [ ] OpenAI: `gpt-4o-mini`, temperature `0.2`, grounded-only answers
- [ ] HydraDB save: `infer: false`, indexing poll after upload
- [ ] Recall: `max_results: 6`, `mode: "fast"` (unless intentionally changed)

## Docs and quality

- [ ] README API section updated if public contract changed
- [ ] `npm run lint` passes
- [ ] No duplicated magic numbers for char limits
