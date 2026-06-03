import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SignOutButton } from "@/components/sign-out-button";

export default function PendingPage() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-6 p-6">
      <Alert className="max-w-md border-border/60">
        <AlertTitle>Awaiting approval</AlertTitle>
        <AlertDescription>
          Your account is registered. An administrator must approve your access
          before you can use Second Brain. You will be able to sign in again
          once approved.
        </AlertDescription>
      </Alert>
      <div className="flex gap-3">
        <SignOutButton />
        <Link
          href="/login"
          className="inline-flex items-center rounded-lg border border-border/60 px-4 py-2 text-sm hover:bg-muted"
        >
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
