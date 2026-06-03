#!/usr/bin/env node
/**
 * Phase 1 verification: per-user HydraDB isolation.
 * - User A saves a unique phrase; user B cannot recall it (and vice versa)
 * - Each user can recall their own phrase after indexing
 * - getSubTenantIds lists distinct user_<uuid> sub-tenants
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *           HYDRADB_API_KEY, HYDRADB_PROJECT_ID, optional HYDRADB_URL
 */
import { createClient } from "@supabase/supabase-js";
import { HydraDBClient } from "@hydradb/sdk";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hydradbApiKey = process.env.HYDRADB_API_KEY;
const hydradbTenantId = process.env.HYDRADB_PROJECT_ID;
const hydradbBaseUrl = process.env.HYDRADB_URL;

const INDEXING_MAX_ATTEMPTS = 90;
const INDEXING_DELAY_MS = 2000;
const RECALL_MAX_ROUNDS = 24;
const RECALL_ROUND_DELAY_MS = 5000;
const READY_STATUSES = new Set([
  "completed",
  "graph_creation",
  "success",
]);

const TEST_USERS = [
  {
    email: "hydradb-isolation-a@test.cursorers.local",
    label: "A",
  },
  {
    email: "hydradb-isolation-b@test.cursorers.local",
    label: "B",
  },
];

function requireEnv() {
  const missing = [];
  if (!supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!hydradbApiKey) missing.push("HYDRADB_API_KEY");
  if (!hydradbTenantId) missing.push("HYDRADB_PROJECT_ID");
  if (missing.length > 0) {
    console.error("Missing env:", missing.join(", "));
    process.exit(1);
  }
}

/** Must match resolveHydraSubTenantId in lib/hydradb.ts */
function subTenantId(userId) {
  const trimmed = userId?.trim();
  if (!trimmed) {
    throw new Error("HydraDB userId is required");
  }
  return `user_${trimmed}`;
}

function createHydraClient() {
  return new HydraDBClient({
    token: hydradbApiKey,
    ...(hydradbBaseUrl ? { baseUrl: hydradbBaseUrl } : {}),
  });
}

async function ensureApprovedUser(supabase, email) {
  const { data: listData } = await supabase.auth.admin.listUsers();
  let user = listData?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );

  if (!user) {
    const password = `Iso_${Math.random().toString(36).slice(2, 14)}!1`;
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: `Isolation test ${email}` },
    });
    if (error) {
      throw new Error(`createUser(${email}): ${error.message}`);
    }
    user = data.user;
    console.log(`Created test user ${email}`);
  } else {
    console.log(`Using existing test user ${email}`);
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email,
      role: "user",
      account_status: "approved",
      approved_at: new Date().toISOString(),
      failed_login_count: 0,
      full_name: `Isolation ${email}`,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    throw new Error(`profile upsert(${email}): ${profileError.message}`);
  }

  return user;
}

async function ensureTenant(client) {
  try {
    await client.tenant.create({ tenant_id: hydradbTenantId });
  } catch (error) {
    const status = error?.statusCode;
    const body = JSON.stringify(error?.body ?? {}).toLowerCase();
    if (
      status !== 400 &&
      status !== 409 &&
      !(status === 422 && body.includes("exist"))
    ) {
      throw error;
    }
  }
}

async function waitForIndexing(client, sub_tenant_id, sourceId) {
  for (let attempt = 0; attempt < INDEXING_MAX_ATTEMPTS; attempt++) {
    const response = await client.upload.verifyProcessing({
      tenant_id: hydradbTenantId,
      sub_tenant_id,
      file_ids: [sourceId],
    });
    const status = response.statuses?.[0];
    if (!status) break;
    if (status.indexing_status === "errored") {
      throw new Error(status.message || "Indexing failed");
    }
    if (READY_STATUSES.has(status.indexing_status)) {
      return status.indexing_status;
    }
    await new Promise((r) => setTimeout(r, INDEXING_DELAY_MS));
  }
  return "timeout";
}

async function saveMemory(client, userId, text) {
  const sub_tenant_id = subTenantId(userId);
  const response = await client.upload.addMemory({
    tenant_id: hydradbTenantId,
    sub_tenant_id,
    memories: [
      {
        text,
        infer: false,
        title: text.slice(0, 80),
        additional_metadata: {
          app: "second-brain-mvp",
          tenant_id: hydradbTenantId,
          sub_tenant_id,
          source_type: "isolation_test",
        },
      },
    ],
  });
  const sourceId = response.results?.[0]?.source_id;
  if (!sourceId) {
    throw new Error(response.message || "addMemory failed");
  }
  const indexingStatus = await waitForIndexing(client, sub_tenant_id, sourceId);
  return { sourceId, indexingStatus, sub_tenant_id };
}

async function recall(client, userId, query) {
  const sub_tenant_id = subTenantId(userId);
  const [knowledgeResult, memoryResult] = await Promise.allSettled([
    client.recall.fullRecall({
      tenant_id: hydradbTenantId,
      sub_tenant_id,
      query,
      max_results: 10,
      mode: "fast",
      alpha: "auto",
      recency_bias: 0,
      graph_context: true,
    }),
    client.recall.recallPreferences({
      tenant_id: hydradbTenantId,
      sub_tenant_id,
      query,
      max_results: 10,
      mode: "fast",
    }),
  ]);

  const chunks = [];
  if (knowledgeResult.status === "fulfilled") {
    chunks.push(...(knowledgeResult.value.chunks ?? []));
  } else if (knowledgeResult.reason?.statusCode !== 404) {
    throw knowledgeResult.reason;
  }
  if (memoryResult.status === "fulfilled") {
    chunks.push(...(memoryResult.value.chunks ?? []));
  } else if (memoryResult.reason?.statusCode !== 404) {
    throw memoryResult.reason;
  }
  return chunks;
}

function chunksContainMarker(chunks, marker) {
  return chunks.some((chunk) =>
    [chunk.chunk_content, chunk.source_title]
      .filter(Boolean)
      .join("\n")
      .includes(marker),
  );
}

async function main() {
  requireEnv();

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const client = createHydraClient();
  await ensureTenant(client);

  const [userA, userB] = await Promise.all(
    TEST_USERS.map((u) => ensureApprovedUser(supabase, u.email)),
  );

  const subA = subTenantId(userA.id);
  const subB = subTenantId(userB.id);
  const runId = Date.now();
  const markerA = `ISOLATION_VERIFY_A_${runId}`;
  const markerB = `ISOLATION_VERIFY_B_${runId}`;

  console.log("\n--- Save memories (infer:false, matches lib/hydradb.ts) ---");
  console.log("User A:", userA.id, "→", subA);
  console.log("User B:", userB.id, "→", subB);

  const savedA = await saveMemory(client, userA.id, markerA);
  console.log("A saved:", savedA.sourceId, "indexing:", savedA.indexingStatus);

  const savedB = await saveMemory(client, userB.id, markerB);
  console.log("B saved:", savedB.sourceId, "indexing:", savedB.indexingStatus);

  console.log("\n--- Cross-user recall (poll until self-recall succeeds) ---");

  let lastRound = null;
  for (let round = 0; round < RECALL_MAX_ROUNDS; round++) {
    const aSelf = await recall(client, userA.id, markerA);
    const bSelf = await recall(client, userB.id, markerB);
    const aSeesB = await recall(client, userA.id, markerB);
    const bSeesA = await recall(client, userB.id, markerA);

    lastRound = {
      aSelf: chunksContainMarker(aSelf, markerA),
      bSelf: chunksContainMarker(bSelf, markerB),
      aSeesB: chunksContainMarker(aSeesB, markerB),
      bSeesA: chunksContainMarker(bSeesA, markerA),
    };

    console.log(
      `round ${round}: A self=${lastRound.aSelf} B self=${lastRound.bSelf} A→B leak=${lastRound.aSeesB} B→A leak=${lastRound.bSeesA}`,
    );

    if (
      lastRound.aSelf &&
      lastRound.bSelf &&
      !lastRound.aSeesB &&
      !lastRound.bSeesA
    ) {
      break;
    }

    await new Promise((r) => setTimeout(r, RECALL_ROUND_DELAY_MS));
  }

  console.log("\n--- HydraDB sub_tenant_ids ---");
  const subTenants = await client.tenant.getSubTenantIds({
    tenant_id: hydradbTenantId,
  });
  const idList = subTenants.sub_tenant_ids ?? [];
  const userPrefixed = idList.filter((id) => String(id).startsWith("user_"));

  console.log("all sub_tenants:", idList.join(", "));
  console.log("user_* count:", userPrefixed.length);
  console.log("includes A:", userPrefixed.includes(subA));
  console.log("includes B:", userPrefixed.includes(subB));

  const failures = [];
  if (!lastRound?.aSelf) {
    failures.push("User A could not recall own phrase after polling");
  }
  if (!lastRound?.bSelf) {
    failures.push("User B could not recall own phrase after polling");
  }
  if (lastRound?.aSeesB) {
    failures.push("User A recalled User B's isolated phrase");
  }
  if (lastRound?.bSeesA) {
    failures.push("User B recalled User A's isolated phrase");
  }
  if (!userPrefixed.includes(subA)) {
    failures.push(`sub_tenant_ids missing ${subA}`);
  }
  if (!userPrefixed.includes(subB)) {
    failures.push(`sub_tenant_ids missing ${subB}`);
  }

  if (failures.length > 0) {
    console.error("\nFAILED:");
    for (const f of failures) console.error(" -", f);
    process.exit(1);
  }

  console.log("\nPASSED: two-user HydraDB isolation verified.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
