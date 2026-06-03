#!/usr/bin/env node
/**
 * Static audit: HydraDB is only reached from approved API routes with auth.user.id.
 * Run: npm run audit:hydradb
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const LIB_HYDRADB = join(ROOT, "lib/hydradb.ts");
const VALIDATION = join(ROOT, "lib/validation.ts");
const API_DIR = join(ROOT, "app/api");

const FORBIDDEN_VALIDATION_KEYS = [
  "tenantId",
  "tenant_id",
  "subTenantId",
  "sub_tenant_id",
  "userId",
  "user_id",
];

const HYDRA_EXPORTS = [
  "saveMemory",
  "uploadMarkdownKnowledge",
  "saveAudioTranscriptionMemory",
  "searchMemories",
  "fetchBrainGraph",
];

const APPROVED_USER_ROUTES = new Set([
  "app/api/memories/route.ts",
  "app/api/ask/route.ts",
  "app/api/audio/route.ts",
  "app/api/knowledge/route.ts",
  "app/api/brain/route.ts",
]);

const ADMIN_HYDRA_ROUTES = new Set([
  "app/api/admin/users/[id]/memories/route.ts",
]);

const ALLOWED_IMPORTERS = new Set([
  ...APPROVED_USER_ROUTES,
  ...ADMIN_HYDRA_ROUTES,
]);

let failed = false;

function fail(message) {
  console.error(`FAIL: ${message}`);
  failed = true;
}

function pass(message) {
  console.log(`OK: ${message}`);
}

function read(path) {
  return readFileSync(path, "utf8");
}

function walkRoutes(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      walkRoutes(path, acc);
    } else if (name === "route.ts") {
      acc.push(path);
    }
  }
  return acc;
}

function findHydradbImporters() {
  const importers = [];
  const scanDirs = [
    join(ROOT, "app"),
    join(ROOT, "lib"),
    join(ROOT, "components"),
    join(ROOT, "scripts"),
  ];

  for (const dir of scanDirs) {
    let entries;
    try {
      entries = readdirSync(dir, { recursive: true, withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (!/\.(ts|tsx|mjs|js)$/.test(entry.name)) continue;
      const path = join(entry.parentPath ?? entry.path, entry.name);
      if (path === LIB_HYDRADB) continue;
      if (path.endsWith("scripts/audit-hydradb-call-sites.mjs")) continue;
      const source = read(path);
      const hydradbImport = /from\s+["']@\/lib\/hydradb["']/;
      if (hydradbImport.test(source)) {
        importers.push(relative(ROOT, path));
      }
    }
  }

  return importers;
}

// 1. Only approved API routes may import lib/hydradb
const importers = findHydradbImporters();

for (const file of importers) {
  if (!ALLOWED_IMPORTERS.has(file)) {
    fail(`${file} imports @/lib/hydradb (only approved API routes allowed)`);
  }
}

for (const file of ALLOWED_IMPORTERS) {
  if (!importers.includes(file)) {
    fail(`expected importer missing: ${file}`);
  }
}

if (importers.every((f) => ALLOWED_IMPORTERS.has(f))) {
  pass(
    `lib/hydradb imported only from ${[...ALLOWED_IMPORTERS].join(", ")}`,
  );
}

// 2. Each route: guardApprovedApi + auth.user.id on Hydra calls
const routeFiles = walkRoutes(API_DIR).filter((p) =>
  read(p).includes("@/lib/hydradb"),
);

for (const routePath of routeFiles) {
  const rel = relative(ROOT, routePath);
  const source = read(routePath);

  if (ADMIN_HYDRA_ROUTES.has(rel)) {
    if (!source.includes("guardAdminApi")) {
      fail(`${rel} must call guardAdminApi()`);
    }
    if (/auth\.user\.id/.test(source) && /purgeUserHydraData/.test(source)) {
      const purgeCall = source.slice(source.indexOf("purgeUserHydraData("));
      if (purgeCall.slice(0, 80).includes("auth.user.id")) {
        fail(`${rel}: purgeUserHydraData() must not use auth.user.id`);
      }
    }
    if (!/purgeUserHydraData\s*\(\s*targetUserId/.test(source)) {
      fail(`${rel}: purgeUserHydraData() must use validated target user id`);
    }
    pass(`${rel} uses guardAdminApi and target user id for purge`);
    continue;
  }

  if (!APPROVED_USER_ROUTES.has(rel)) {
    fail(`${rel} is not an approved HydraDB route`);
    continue;
  }

  if (!source.includes("guardApprovedApi")) {
    fail(`${rel} must call guardApprovedApi()`);
  }
  if (!/auth\.user\.id/.test(source)) {
    fail(`${rel} must pass auth.user.id into lib/hydradb`);
  }

  for (const fn of HYDRA_EXPORTS) {
    const callPattern = new RegExp(`${fn}\\s*\\(`);
    if (!callPattern.test(source)) continue;
    const slice = source.slice(source.indexOf(`${fn}(`));
    const argWindow = slice.slice(0, 120);
    if (!argWindow.includes("auth.user.id")) {
      fail(`${rel}: ${fn}() must use auth.user.id as the userId argument`);
    }
  }

  pass(`${rel} uses guardApprovedApi and auth.user.id`);
}

// 3. validation.ts: no client-supplied tenant namespace fields
const validationSource = read(VALIDATION);
for (const key of FORBIDDEN_VALIDATION_KEYS) {
  if (new RegExp(`\\b${key}\\b\\s*:`).test(validationSource)) {
    fail(`lib/validation.ts must not accept client field "${key}" for HydraDB`);
  }
}
pass("lib/validation.ts has no tenant/userId request fields");

// 4. lib/hydradb.ts: no shared sub-tenant env fallback
const hydradbSource = read(LIB_HYDRADB);
if (/demo_user|mvp_user|HYDRADB_SUB_TENANT/i.test(hydradbSource)) {
  fail("lib/hydradb.ts must not reference demo_user, mvp_user, or HYDRADB_SUB_TENANT");
}
if (!hydradbSource.includes("requireHydraUserId")) {
  fail("lib/hydradb.ts must require a non-empty userId (requireHydraUserId)");
}
pass("lib/hydradb.ts uses per-user sub_tenant_id only");

// 5. Client components must not import hydradb
const clientImports = importers.filter((f) => f.startsWith("components/"));
if (clientImports.length > 0) {
  fail(`client components must not import hydradb: ${clientImports.join(", ")}`);
} else {
  pass("no client components import lib/hydradb");
}

if (failed) {
  process.exit(1);
}

console.log("\nHydraDB call-site audit passed.");
