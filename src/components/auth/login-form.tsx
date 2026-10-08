"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        const form = new FormData(event.currentTarget);

        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            email: form.get("email"),
            password: form.get("password"),
          }),
        });

        if (!res.ok) {
          const json = (await res.json().catch(() => ({}))) as { error?: string };
          setError(json.error ?? "Unable to sign in.");
          setLoading(false);
          return;
        }

        window.location.href = "/dashboard";
      }}
    >
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm">
          Email
        </label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-sm">
          Password
        </label>
        <div className="relative">
          <Input id="password" name="password" type={show ? "text" : "password"} required autoComplete="current-password" />
          <button
            type="button"
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-2 top-2 rounded p-1 text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)]"
            onClick={() => setShow((v) => !v)}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-[var(--danger-foreground)]">{error}</p> : null}

      <Button className="w-full" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </Button>

      <Button type="button" variant="secondary" className="w-full" onClick={() => (window.location.href = "/api/auth/google")}>Continue with Google</Button>

      <div className="flex items-center justify-between text-sm text-[var(--muted-foreground)]">
        <Link href="/forgot-password" className="hover:text-[var(--foreground)]">
          Forgot password?
        </Link>
        <Link href="/register" className="hover:text-[var(--foreground)]">
          Create account
        </Link>
      </div>
    </form>
  );
}
