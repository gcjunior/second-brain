# Second Brain — integration reference

## Environment variables

| Variable | Used in | Required |
| --- | --- | --- |
| `OPENAI_API_KEY` | `lib/openai.ts` | Yes |
| `HYDRADB_API_KEY` | `lib/hydradb.ts` | Yes |
| `HYDRADB_PROJECT_ID` | `lib/hydradb.ts` (tenant_id) | Yes |
| `HYDRADB_URL` | `lib/hydradb.ts` | No (defaults to `https://api.hydradb.com`) |

## HydraDB (`lib/hydradb.ts`)

| Constant / setting | Value |
| --- | --- |
| `SUB_TENANT_ID` | `"mvp_user"` |
| `infer` on save | `false` |
| Indexing poll | 12 attempts × 1s |
| Ready statuses | `completed`, `graph_creation`, `success` |
| Recall `max_results` | `6` |
| Recall `mode` | `"fast"` |

### Client factory pattern

```typescript
function getConfig() { /* read env, throw if missing */ }
function createClient() { return new HydraDBClient({ token, baseUrl? }); }
```

Exported domain functions: `saveMemory(content)`, `searchMemories(question)`.

## OpenAI (`lib/openai.ts`)

| Setting | Value |
| --- | --- |
| Model | `gpt-4o-mini` |
| Temperature | `0.2` |
| Grounding | System prompt requires answers only from provided memories |

Exported: `generateGroundedAnswer(question, sources)`.

## API error contract

All routes return errors as:

```json
{ "error": "human-readable message" }
```

Status `400` for validation; `500` for server errors.

## Canonical file references

| Concern | File |
| --- | --- |
| Save route | `app/api/memories/route.ts` |
| Ask route | `app/api/ask/route.ts` |
| Validation | `lib/validation.ts` |
| Types | `lib/types.ts` |
| Limits | `lib/constants.ts` |
| Main client UI | `components/memory-input-card.tsx` |

## Char limits (single source)

Defined in `lib/constants.ts`:

- `MAX_SAVE_LENGTH` = 5000
- `MAX_ASK_LENGTH` = 2000

Import in both `lib/validation.ts` and client components — never hardcode.

## Hooks folder

`components.json` defines `@/hooks`. Extract reusable client logic (e.g. shared fetch wrappers) to `hooks/use-*.ts` when duplicated across components.
