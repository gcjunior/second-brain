import { NextResponse } from "next/server";
import { guardApprovedApi, logAppAccess } from "@/lib/auth";
import { tripletsToGraphData } from "@/lib/graph-data";
import { fetchBrainGraph } from "@/lib/hydradb";
import type { ApiErrorResponse, BrainGraphResponse } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const auth = await guardApprovedApi();
    if (!auth.ok) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const sourceId = searchParams.get("sourceId") ?? undefined;
    const cursorParam = searchParams.get("cursor");
    const cursor =
      cursorParam !== null && cursorParam !== "" ? Number(cursorParam) : null;

    await logAppAccess({ route: "/api/brain" });

    const raw = await fetchBrainGraph(auth.user.id, {
      sourceId,
      cursor: Number.isFinite(cursor) ? cursor : null,
    });

    const superNodeIds = new Set(
      raw.superNodes.map((node) => node.entity_id),
    );
    const graph = tripletsToGraphData(raw.relations, superNodeIds);

    return NextResponse.json<BrainGraphResponse>({
      ...graph,
      nextCursor: raw.nextCursor,
      isTruncated: raw.isTruncated,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load brain graph";
    console.error("[GET /api/brain]", error);
    return NextResponse.json<ApiErrorResponse>(
      { error: message },
      { status: 500 },
    );
  }
}
