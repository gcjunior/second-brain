import { AuthForm } from "@/components/auth-form";

export default function SignupPage() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-6 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          An admin must approve your account before you can use the app
        </p>
      </div>
      <AuthForm mode="signup" />
    </main>
  );
}
