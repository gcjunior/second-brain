import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminUserTable } from "@/components/admin-user-table";
import { SignOutButton } from "@/components/sign-out-button";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ProfileSummary } from "@/lib/types";

export default async function AdminPage() {
  const admin = await requireAdmin();
  if (!admin) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, role, account_status, failed_login_count, approved_at, blocked_at, block_reason, last_login_at, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="mx-auto flex min-h-full max-w-6xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
          <p className="text-sm text-muted-foreground">
            Approve, block, or unlock user accounts
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/"
            className="inline-flex items-center rounded-lg border border-border/60 px-4 py-2 text-sm hover:bg-muted"
          >
            Back to app
          </Link>
          <SignOutButton />
        </div>
      </div>
      <AdminUserTable initialUsers={(data ?? []) as ProfileSummary[]} />
    </main>
  );
}
