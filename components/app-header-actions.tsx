"use client";

import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";

type AppHeaderActionsProps = {
  email: string;
  isAdmin: boolean;
};

export function AppHeaderActions({ email, isAdmin }: AppHeaderActionsProps) {
  const initial = email.charAt(0).toUpperCase();

  return (
    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
      {isAdmin && (
        <Link
          href="/admin"
          className="hidden rounded-full border border-border/70 bg-card/80 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm hover:text-foreground sm:inline-flex"
        >
          Admin
        </Link>
      )}
      <SignOutButton />
      <div
        className="flex size-9 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background"
        title={email}
      >
        {initial}
      </div>
    </div>
  );
}
