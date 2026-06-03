"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AuthFormMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthFormMode;
};

const OAUTH_REDIRECT = `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`;

async function recordFailure(email: string, reason: string, provider?: string) {
  await fetch("/api/auth/failure", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, reason, provider }),
  });
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleOAuth(provider: "google", label: string) {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        await recordFailure(email || "unknown@oauth.local", error.message, provider);
        toast.error(`${label} sign-in failed`, { description: error.message });
        setLoading(false);
      }
    } catch {
      await recordFailure(email || "unknown@oauth.local", "oauth_cancelled", provider);
      toast.error(`${label} sign-in was cancelled`);
      setLoading(false);
    }
  }

  async function handleEmailAuth(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);

    const supabase = createClient();

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: OAUTH_REDIRECT,
          },
        });

        if (error) {
          await recordFailure(email, error.message, "email");
          toast.error("Sign up failed", { description: error.message });
          return;
        }

        toast.success("Account created. Check your email if confirmation is enabled.");
        router.push("/pending");
        router.refresh();
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        await recordFailure(email, error.message, "email");
        toast.error("Sign in failed", { description: error.message });
        return;
      }

      await fetch("/api/auth/success", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "email" }),
      });

      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-border/60 shadow-card">
      <CardHeader>
        <CardTitle className="text-xl">
          {mode === "login" ? "Sign in" : "Create account"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => handleOAuth("google", "Google")}
          >
            <Mail className="size-4" aria-hidden />
            Continue with Google
          </Button>
        </div>

        <div className="relative text-center text-sm text-muted-foreground">
          <span className="bg-card px-2">or email</span>
          <div className="absolute inset-x-0 top-1/2 -z-10 border-t border-border/60" />
        </div>

        <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-border/60 bg-background px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Password
            <input
              type="password"
              required
              minLength={8}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-border/60 bg-background px-3 py-2"
            />
          </label>
          <Button type="submit" disabled={loading}>
            {mode === "login" ? "Sign in with email" : "Sign up with email"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>
              No account?{" "}
              <Link href="/signup" className="text-primary underline-offset-4 hover:underline">
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/login" className="text-primary underline-offset-4 hover:underline">
                Sign in
              </Link>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
