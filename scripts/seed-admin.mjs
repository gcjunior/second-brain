#!/usr/bin/env node
/**
 * Seed admin user via Supabase Admin API.
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_SEED_EMAIL
 * Optional: ADMIN_SEED_PASSWORD (min 8 chars) — if omitted, a random password is printed once.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_SEED_EMAIL;
const password =
  process.env.ADMIN_SEED_PASSWORD ??
  `Admin_${Math.random().toString(36).slice(2, 14)}!1`;

if (!url || !serviceRoleKey || !email) {
  console.error(
    "Missing env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_SEED_EMAIL",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: listData } = await supabase.auth.admin.listUsers();
const existing = listData?.users?.find(
  (u) => u.email?.toLowerCase() === email.toLowerCase(),
);

let userId = existing?.id;

if (!userId) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Admin" },
  });

  if (error) {
    console.error("createUser failed:", error.message);
    process.exit(1);
  }

  userId = data.user.id;
  console.log("Created auth user:", email);
} else {
  console.log("Auth user already exists:", email);
}

const { error: profileError } = await supabase.from("profiles").upsert(
  {
    id: userId,
    email,
    role: "admin",
    account_status: "approved",
    approved_at: new Date().toISOString(),
    failed_login_count: 0,
    full_name: "Admin",
  },
  { onConflict: "id" },
);

if (profileError) {
  console.error("Profile upsert failed:", profileError.message);
  process.exit(1);
}

console.log("Admin profile ready (role=admin, account_status=approved).");
if (!process.env.ADMIN_SEED_PASSWORD) {
  console.log("Temporary password (save it):", password);
}
