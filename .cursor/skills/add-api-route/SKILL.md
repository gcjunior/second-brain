---
name: add-api-route
description: Adds Next.js Route Handlers following Second Brain conventions. Use when creating or modifying files under app/api/, adding endpoints, or wiring server logic to lib/*.
---

# Add API route

## Checklist

```
- [ ] Zod schema + inferred type in lib/validation.ts
- [ ] Response types in lib/types.ts (if new shape)
- [ ] Business logic in lib/*.ts (not in route)
- [ ] Route handler in app/api/<name>/route.ts
- [ ] README API section updated (if public contract changes)
- [ ] npm run lint
```

## Route handler template

Copy structure from `app/api/memories/route.ts`:

1. Import schema from `@/lib/validation`
2. Import types from `@/lib/types`
3. Import lib function(s)
4. `POST` (or other verb) with try/catch
5. `safeParse` → 400 with first Zod issue message
6. Call lib → typed success response
7. catch → `console.error("[VERB /api/path]", error)` → 500

## Validation

- Add schema to `lib/validation.ts`
- Use limits from `@/lib/constants` in `.max()` calls
- Export `z.infer<typeof schema>` type

## Types

Add to `lib/types.ts`:

```typescript
export type MyResponse = { /* fields */ };
// Reuse ApiErrorResponse for errors
```

## Lib functions

Route files should be thin. Example split:

| Route | Lib |
| --- | --- |
| `POST /api/memories` | `saveMemory()` in `lib/hydradb.ts` |
| `POST /api/ask` | `searchMemories()` + `generateGroundedAnswer()` |

## Examples

See [examples.md](examples.md) for a full `GET /api/health` walkthrough.
