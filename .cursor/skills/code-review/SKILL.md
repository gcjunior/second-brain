---
name: code-review
description: Reviews code changes against Second Brain (cursorers) project standards. Use when reviewing pull requests, diffs, or before merging feature work.
disable-model-invocation: true
---

# Code review — Second Brain

## Process

1. Read the diff and identify touched layers (components, api, lib)
2. Run through [checklist.md](checklist.md)
3. Format feedback by severity

## Feedback format

**Critical** — Must fix before merge (security, broken contracts, secrets in client)

**Suggestion** — Should improve (pattern drift, duplicated constants, missing validation)

**Nice to have** — Optional polish (naming, minor a11y)

## High-priority checks

- API keys / `process.env` only in `lib/hydradb.ts`, `lib/openai.ts`
- Route handlers validate with Zod from `lib/validation.ts`
- Errors return `{ error: string }` with correct status codes
- Char limits imported from `lib/constants.ts`
- Client components use theme tokens, not raw Tailwind palette colors
- No MVP scope creep (auth, DB, background jobs) unless requested

## Full checklist

See [checklist.md](checklist.md).

## Related resources

- Rules: `.cursor/rules/`
- Architecture: `.cursor/skills/second-brain-architecture/SKILL.md`
