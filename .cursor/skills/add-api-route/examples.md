# API route example: GET /api/health

## 1. Types (`lib/types.ts`)

```typescript
export type HealthResponse = {
  status: "ok";
  timestamp: string;
};
```

## 2. Lib (`lib/health.ts`)

```typescript
export function getHealthStatus(): HealthResponse {
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
  };
}
```

## 3. Route (`app/api/health/route.ts`)

```typescript
import { NextResponse } from "next/server";
import { getHealthStatus } from "@/lib/health";
import type { ApiErrorResponse, HealthResponse } from "@/lib/types";

export async function GET() {
  try {
    const data = getHealthStatus();
    return NextResponse.json<HealthResponse>(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Health check failed";
    console.error("[GET /api/health]", error);
    return NextResponse.json<ApiErrorResponse>(
      { error: message },
      { status: 500 },
    );
  }
}
```

## POST route with body (matches existing pattern)

```typescript
import { NextResponse } from "next/server";
import { doSomething } from "@/lib/example";
import type { ApiErrorResponse, ExampleResponse } from "@/lib/types";
import { exampleSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = exampleSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid request";
      return NextResponse.json<ApiErrorResponse>(
        { error: message },
        { status: 400 },
      );
    }

    const result = await doSomething(parsed.data);
    return NextResponse.json<ExampleResponse>(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Request failed";
    console.error("[POST /api/example]", error);
    return NextResponse.json<ApiErrorResponse>(
      { error: message },
      { status: 500 },
    );
  }
}
```

## Existing routes to mirror

- `app/api/memories/route.ts` — POST with Zod body
- `app/api/ask/route.ts` — POST, multiple lib calls
