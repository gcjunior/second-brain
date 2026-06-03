#!/usr/bin/env node
/**
 * Apply the chosen strategy for pre-auth HydraDB sub-tenants (demo_user, mvp_user).
 *
 * Default (plan decision): HYDRADB_LEGACY_STRATEGY=ignore — inventory only, no copy/delete.
 *
 * Requires: HYDRADB_API_KEY, HYDRADB_PROJECT_ID, optional HYDRADB_URL
 * Migrate also needs: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   and HYDRADB_LEGACY_MIGRATE_USER_EMAIL or HYDRADB_LEGACY_MIGRATE_USER_ID
 */
import { createClient } from "@supabase/supabase-js";
import { HydraDBClient, HydraDBError } from "@hydradb/sdk";

/** Keep in sync with LEGACY_HYDRA_SUB_TENANT_IDS in lib/constants.ts */
const LEGACY_SUB_TENANTS = ["demo_user", "mvp_user"];

const STRATEGY = (process.env.HYDRADB_LEGACY_STRATEGY ?? "ignore")
  .trim()
  .toLowerCase();
const DRY_RUN = process.env.HYDRADB_LEGACY_DRY_RUN !== "0";

const hydradbApiKey = process.env.HYDRADB_API_KEY;
const hydradbTenantId = process.env.HYDRADB_PROJECT_ID;
const hydradbBaseUrl = process.env.HYDRADB_URL;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const migrateEmail = process.env.HYDRADB_LEGACY_MIGRATE_USER_EMAIL?.trim();
const migrateUserId = process.env.HYDRADB_LEGACY_MIGRATE_USER_ID?.trim();

function requireHydraEnv() {
  const missing = [];
  if (!hydradbApiKey) missing.push("HYDRADB_API_KEY");
  if (!hydradbTenantId) missing.push("HYDRADB_PROJECT_ID");
  if (missing.length > 0) {
    console.error("Missing env:", missing.join(", "));
    process.exit(1);
  }
}

function createHydraClient() {
  return new HydraDBClient({
    token: hydradbApiKey,
    ...(hydradbBaseUrl ? { baseUrl: hydradbBaseUrl } : {}),
  });
}

/** Must match resolveHydraSubTenantId in lib/hydradb.ts */
function targetSubTenantId(userId) {
  const trimmed = userId?.trim();
  if (!trimmed) {
    throw new Error("HydraDB userId is required");
  }
  return `user_${trimmed}`;
}

async function listAllSources(client, subTenantId, kind) {
  const items = [];
  let page = 1;
  const pageSize = 50;

  while (true) {
    let response;
    try {
      response = await client.fetch.listData({
        tenant_id: hydradbTenantId,
        sub_tenant_id: subTenantId,
        kind,
        page,
        page_size: pageSize,
      });
    } catch (error) {
      if (error instanceof HydraDBError && error.statusCode === 404) {
        break;
      }
      throw error;
    }

    const batch = response.data ?? [];
    items.push(...batch);

    const totalPages = response.pagination?.total_pages;
    if (!totalPages || page >= totalPages || batch.length < pageSize) {
      break;
    }
    page += 1;
  }

  return items;
}

function sourceIdFromRow(row) {
  return row?.source_id ?? row?.id ?? row?.file_id ?? null;
}

async function inventoryLegacySubTenant(client, subTenantId) {
  const [memories, knowledge] = await Promise.all([
    listAllSources(client, subTenantId, "memories"),
    listAllSources(client, subTenantId, "knowledge"),
  ]);

  let recallChunks = 0;
  try {
    const recall = await client.recall.recallPreferences({
      tenant_id: hydradbTenantId,
      sub_tenant_id: subTenantId,
      query: "memory",
      max_results: 3,
      mode: "fast",
    });
    recallChunks = recall.chunks?.length ?? 0;
  } catch (error) {
    if (!(error instanceof HydraDBError && error.statusCode === 404)) {
      throw error;
    }
  }

  return {
    subTenantId,
    memoryCount: memories.length,
    knowledgeCount: knowledge.length,
    recallSampleChunks: recallChunks,
    memorySourceIds: memories
      .map(sourceIdFromRow)
      .filter((id) => typeof id === "string"),
    knowledgeSourceIds: knowledge
      .map(sourceIdFromRow)
      .filter((id) => typeof id === "string"),
  };
}

async function resolveMigrateTargetUserId(supabase) {
  if (migrateUserId) {
    return migrateUserId;
  }
  if (!migrateEmail) {
    throw new Error(
      "migrate strategy requires HYDRADB_LEGACY_MIGRATE_USER_ID or HYDRADB_LEGACY_MIGRATE_USER_EMAIL",
    );
  }

  const { data: listData } = await supabase.auth.admin.listUsers();
  const user = listData?.users?.find(
    (u) => u.email?.toLowerCase() === migrateEmail.toLowerCase(),
  );
  if (!user?.id) {
    throw new Error(`No auth user found for ${migrateEmail}`);
  }
  return user.id;
}

async function copyMemory(client, fromSub, toSub, sourceId) {
  const fetched = await client.fetch.content({
    tenant_id: hydradbTenantId,
    sub_tenant_id: fromSub,
    source_id: sourceId,
    mode: "content",
  });

  const text =
    fetched.content ??
    fetched.text ??
    fetched.body ??
    (typeof fetched === "string" ? fetched : null);

  if (!text || typeof text !== "string" || !text.trim()) {
    console.warn(`  skip memory ${sourceId}: empty content`);
    return false;
  }

  const migratedId = `legacy_${fromSub}_${sourceId}`.slice(0, 120);

  await client.upload.addMemory({
    tenant_id: hydradbTenantId,
    sub_tenant_id: toSub,
    upsert: true,
    memories: [
      {
        source_id: migratedId,
        text,
        infer: false,
        title: `Legacy (${fromSub}): ${sourceId}`.slice(0, 80),
        additional_metadata: {
          app: "second-brain-mvp",
          legacy_sub_tenant: fromSub,
          legacy_source_id: sourceId,
          migrated_at: new Date().toISOString(),
        },
      },
    ],
  });

  return true;
}

async function copyKnowledge(client, fromSub, toSub, sourceId, row) {
  const fetched = await client.fetch.content({
    tenant_id: hydradbTenantId,
    sub_tenant_id: fromSub,
    source_id: sourceId,
    mode: "content",
  });

  const text =
    fetched.content ??
    fetched.text ??
    fetched.body ??
    (typeof fetched === "string" ? fetched : null);

  if (!text || typeof text !== "string" || !text.trim()) {
    console.warn(`  skip knowledge ${sourceId}: empty content`);
    return false;
  }

  const fileName =
    row?.title ??
    row?.file_name ??
    row?.document_metadata?.file_name ??
    `${sourceId}.md`;
  const migratedId = `legacy_${fromSub}_${sourceId}`.slice(0, 120);
  const markdownFile = new File([text], String(fileName), {
    type: "text/markdown",
  });

  await client.upload.knowledge({
    tenant_id: hydradbTenantId,
    sub_tenant_id: toSub,
    files: [markdownFile],
    file_metadata: JSON.stringify([
      {
        file_id: migratedId,
        metadata: {
          legacy_sub_tenant: fromSub,
          legacy_source_id: sourceId,
        },
      },
    ]),
    upsert: true,
  });

  return true;
}

async function deleteSources(client, subTenantId, ids) {
  if (ids.length === 0) {
    return 0;
  }

  const chunkSize = 25;
  let deleted = 0;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const batch = ids.slice(i, i + chunkSize);
    await client.data.delete({
      tenant_id: hydradbTenantId,
      sub_tenant_id: subTenantId,
      ids: batch,
    });
    deleted += batch.length;
  }
  return deleted;
}

async function applyIgnore(client, inventories) {
  const subTenants = await client.tenant.getSubTenantIds({
    tenant_id: hydradbTenantId,
  });
  const listed = new Set(subTenants.sub_tenant_ids ?? []);

  console.log("\nStrategy: ignore (orphan legacy namespaces)");
  console.log("Production APIs use user_<auth.users.id> only; no copy or delete.\n");

  for (const row of inventories) {
    const listedInHydra = listed.has(row.subTenantId);
    console.log(
      `  ${row.subTenantId}: memories=${row.memoryCount} knowledge=${row.knowledgeCount} recall_sample=${row.recallSampleChunks} listed=${listedInHydra}`,
    );
  }

  const hasData = inventories.some(
    (r) => r.memoryCount > 0 || r.knowledgeCount > 0 || r.recallSampleChunks > 0,
  );
  if (hasData) {
    console.log(
      "\nLegacy data remains in HydraDB but is unreachable from authenticated app routes.",
    );
  } else {
    console.log("\nNo indexed legacy content detected (namespaces may still be listed).");
  }
}

async function applyMigrate(client, inventories) {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "migrate strategy requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const userId = await resolveMigrateTargetUserId(supabase);
  const toSub = targetSubTenantId(userId);

  console.log(`\nStrategy: migrate → ${toSub}`);
  if (DRY_RUN) {
    console.log("DRY_RUN=1 (default): no writes; set HYDRADB_LEGACY_DRY_RUN=0 to apply.\n");
  }

  let copiedMemories = 0;
  let copiedKnowledge = 0;

  for (const row of inventories) {
    console.log(`\nFrom ${row.subTenantId}:`);
    for (const sourceId of row.memorySourceIds) {
      if (DRY_RUN) {
        console.log(`  [dry-run] memory ${sourceId}`);
        copiedMemories += 1;
        continue;
      }
      if (await copyMemory(client, row.subTenantId, toSub, sourceId)) {
        copiedMemories += 1;
        console.log(`  copied memory ${sourceId}`);
      }
    }
    for (const sourceId of row.knowledgeSourceIds) {
      const meta = await listAllSources(client, row.subTenantId, "knowledge");
      const rowMeta = meta.find((m) => sourceIdFromRow(m) === sourceId);
      if (DRY_RUN) {
        console.log(`  [dry-run] knowledge ${sourceId}`);
        copiedKnowledge += 1;
        continue;
      }
      if (
        await copyKnowledge(client, row.subTenantId, toSub, sourceId, rowMeta)
      ) {
        copiedKnowledge += 1;
        console.log(`  copied knowledge ${sourceId}`);
      }
    }
  }

  console.log(
    `\nMigrate summary: memories=${copiedMemories} knowledge=${copiedKnowledge} target=${toSub}${DRY_RUN ? " (dry-run)" : ""}`,
  );
  console.log("Legacy namespaces were not deleted; run delete strategy separately if needed.");
}

async function applyDelete(client, inventories) {
  console.log("\nStrategy: delete legacy source IDs");
  if (DRY_RUN) {
    console.log("DRY_RUN=1 (default): no deletes; set HYDRADB_LEGACY_DRY_RUN=0 to apply.\n");
  }

  let total = 0;
  for (const row of inventories) {
    const ids = [...row.memorySourceIds, ...row.knowledgeSourceIds];
    if (DRY_RUN) {
      console.log(`  ${row.subTenantId}: would delete ${ids.length} sources`);
      total += ids.length;
      continue;
    }
    const deleted = await deleteSources(client, row.subTenantId, ids);
    total += deleted;
    console.log(`  ${row.subTenantId}: deleted ${deleted} sources`);
  }

  console.log(`\nDelete summary: ${total} sources${DRY_RUN ? " (dry-run)" : ""}`);
}

async function main() {
  if (!["ignore", "migrate", "delete"].includes(STRATEGY)) {
    console.error(
      `Unknown HYDRADB_LEGACY_STRATEGY="${STRATEGY}" (use ignore, migrate, or delete)`,
    );
    process.exit(1);
  }

  requireHydraEnv();
  const client = createHydraClient();

  console.log(`HydraDB legacy strategy: ${STRATEGY}`);
  console.log(`tenant_id: ${hydradbTenantId}`);
  console.log(`legacy sub_tenants: ${LEGACY_SUB_TENANTS.join(", ")}`);

  console.log("\n--- Inventory ---");
  const inventories = [];
  for (const subTenantId of LEGACY_SUB_TENANTS) {
    const row = await inventoryLegacySubTenant(client, subTenantId);
    inventories.push(row);
    console.log(
      `  ${row.subTenantId}: memories=${row.memoryCount} knowledge=${row.knowledgeCount} recall_sample=${row.recallSampleChunks}`,
    );
  }

  if (STRATEGY === "ignore") {
    await applyIgnore(client, inventories);
  } else if (STRATEGY === "migrate") {
    await applyMigrate(client, inventories);
  } else {
    await applyDelete(client, inventories);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
