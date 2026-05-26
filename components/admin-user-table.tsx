"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProfileSummary } from "@/lib/types";

type AdminUserTableProps = {
  initialUsers: ProfileSummary[];
};

export function AdminUserTable({ initialUsers }: AdminUserTableProps) {
  const [users, setUsers] = useState(initialUsers);
  const [loading, setLoading] = useState(false);

  async function loadUsers() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/users");
      const data = (await response.json()) as {
        users?: ProfileSummary[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load users");
      }
      setUsers(data.users ?? []);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load users",
      );
    } finally {
      setLoading(false);
    }
  }

  async function runAction(
    userId: string,
    action: "approve" | "block" | "unlock",
  ) {
    try {
      const response = await fetch(`/api/admin/users/${userId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? `Failed to ${action} user`);
      }
      toast.success(`User ${action}d`);
      await loadUsers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : `Failed to ${action}`,
      );
    }
  }

  return (
    <Card className="w-full max-w-5xl border-border/60 shadow-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>User management</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => loadUsers()}
        >
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading users…</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-muted-foreground">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/60 text-muted-foreground">
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Failures</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border/40">
                    <td className="py-3 pr-4">{user.email}</td>
                    <td className="py-3 pr-4">{user.role}</td>
                    <td className="py-3 pr-4">{user.account_status}</td>
                    <td className="py-3 pr-4">{user.failed_login_count}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        {user.account_status === "pending_approval" && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => runAction(user.id, "approve")}
                          >
                            Approve
                          </Button>
                        )}
                        {user.account_status !== "blocked" && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => runAction(user.id, "block")}
                          >
                            Block
                          </Button>
                        )}
                        {(user.account_status === "blocked" ||
                          user.failed_login_count > 0) && (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => runAction(user.id, "unlock")}
                          >
                            Unlock
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
