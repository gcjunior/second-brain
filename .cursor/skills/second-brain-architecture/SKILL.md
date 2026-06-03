---
name: second-brain-architecture
description: Documents Second Brain (cursorers) architecture — server/client boundaries, HydraDB save/recall flow, OpenAI grounded answers, MVP constraints. Use when adding features, refactoring layers, or deciding where code belongs.
---

# Second Brain architecture

## Layer diagram

```
Browser (components/) → fetch /api/* → app/api/*/route.ts → lib/* → HydraDB / OpenAI
```

## Where to put code

| Question | Answer |
| --- | --- |
| HTTP parsing and status codes? | `app/api/*/route.ts` |
| HydraDB, OpenAI, env vars? | `lib/hydradb.ts`, `lib/openai.ts` |
| Request validation? | `lib/validation.ts` |
| Response/domain types? | `lib/types.ts` |
| Shared limits? | `lib/constants.ts` |
| Interactive UI? | `components/` with `"use client"` when needed |
| shadcn primitives? | `components/ui/` |

## Client boundary decision tree

Add `"use client"` when the file uses:

- `useState`, `useEffect`, `useCallback`, `useRef`
- Browser APIs (Web Speech API in `voice-input.tsx`)
- `next-themes` hooks or sonner `toast`

Keep `app/page.tsx` and `app/layout.tsx` as server components when possible.

## Save flow

1. `POST /api/memories` validates `content` (1–`MAX_SAVE_LENGTH` chars)
2. `saveMemory()` → HydraDB `upload.addMemory` (`sub_tenant_id: "mvp_user"`, `infer: false`)
3. Poll `upload.verifyProcessing` up to ~12s until ready status
4. Return `{ sourceId, status, message }`

## Ask flow

1. `POST /api/ask` validates `question` (1–`MAX_ASK_LENGTH` chars)
2. `searchMemories()` → HydraDB `recall.recallPreferences` (`max_results: 6`, `mode: "fast"`)
3. `generateGroundedAnswer()` → OpenAI `gpt-4o-mini`, temperature `0.2`, memories-only system prompt
4. Return `{ answer, sources }`

## Out of scope (unless explicitly requested)

- Authentication and per-user tenants
- In-repo database, Redis, background jobs
- Server Actions (use Route Handlers)
- Global state libraries
- Streaming OpenAI responses
- Memory list/edit/delete UI

## Additional resources

- Integration constants and env vars: [reference.md](reference.md)
- Full architecture: [README.md](../../README.md)
