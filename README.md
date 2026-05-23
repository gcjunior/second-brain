# Second Brain

A single-user MVP web app for capturing personal memories (text or voice) and asking grounded questions later. Memories are stored and retrieved with [HydraDB](https://docs.hydradb.com/), and answers are generated with the OpenAI API.

## Stack

- **Next.js** (App Router) + **React** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **HydraDB** (`@hydradb/sdk`) for memory storage and semantic recall
- **OpenAI** (`gpt-4o-mini`) for grounded answer generation
- **Web Speech API** for browser voice input
- **Zod** for request validation

## Environment variables

Create a `.env.local` file (see `.env.example`):

| Variable | Description |
| --- | --- |
| `OPENAI_API_KEY` | OpenAI API key for answer generation |
| `HYDRADB_API_KEY` | HydraDB API key from [app.hydradb.com](https://app.hydradb.com) |
| `HYDRADB_PROJECT_ID` | HydraDB `tenant_id` for your workspace |
| `HYDRADB_URL` | Optional custom API base URL (defaults to `https://api.hydradb.com`) |

## How to run locally

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables and fill in your keys:

```bash
cp .env.example .env.local
```

3. Ensure your HydraDB tenant exists and `HYDRADB_PROJECT_ID` matches your `tenant_id`.

4. Start the dev server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000).

## API routes

- `POST /api/memories` — body: `{ "content": "..." }` — saves a memory to HydraDB
- `POST /api/ask` — body: `{ "question": "..." }` — recalls memories and returns `{ answer, sources }`

## How to deploy to Vercel

1. Push this repository to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Add the environment variables from `.env.example` in the Vercel project settings.
4. Deploy. No extra services are required for this MVP.

## Current limitations

- **No authentication** — anyone with the URL can use the app
- **Single shared namespace** — all memories use one fixed sub-tenant (`mvp_user`)
- **HydraDB indexing is async** — the app polls briefly after save; very new memories may need a few seconds before recall works reliably
- **Voice input** — depends on browser support (Chrome/Edge work best; Safari support varies)
- **No memory list/edit/delete UI** — only save and ask flows
- **No file upload, PostgreSQL, Redis, or background jobs**

## Future improvements

- User accounts and per-user sub-tenants
- Memory list, search, edit, and delete
- Longer ingestion polling or status UI after save
- Streaming answers from OpenAI
- `infer: true` for richer memory extraction on conversational notes
- Export/import of memories
- Mobile-optimized voice UX
