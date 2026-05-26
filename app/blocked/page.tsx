import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SignOutButton } from "@/components/sign-out-button";

export default function BlockedPage() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-6 p-6">
      <Alert variant="destructive" className="max-w-md">
        <AlertTitle>Account blocked</AlertTitle>
        <AlertDescription>
          Your account has been blocked after too many failed sign-in attempts or
          by an administrator. Contact an admin to unlock your account.
        </AlertDescription>
      </Alert>
      <SignOutButton />
    </main>
  );
}
