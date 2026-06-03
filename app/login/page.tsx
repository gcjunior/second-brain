import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-6 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Second Brain</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to access your memories
        </p>
      </div>
      <AuthForm mode="login" />
    </main>
  );
}
