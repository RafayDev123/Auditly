"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RegisterForm() {
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

        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            fullName: form.get("fullName"),
            email: form.get("email"),
            password: form.get("password"),
          }),
        });

        if (!res.ok) {
          const json = (await res.json().catch(() => ({}))) as { error?: string };
          setError(json.error ?? "Unable to create account.");
          setLoading(false);
          return;
        }

        window.location.href = "/dashboard";
      }}
    >
      <div className="space-y-1">
        <label htmlFor="fullName" className="text-sm">
          Full name
        </label>
        <Input id="fullName" name="fullName" required autoComplete="name" />
      </div>

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
          <Input id="password" name="password" type={show ? "text" : "password"} required autoComplete="new-password" />
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
        {loading ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-sm text-[var(--muted-foreground)]">
        Already have an account? <Link href="/login" className="text-[var(--foreground)]">Sign in</Link>
      </p>
    </form>
  );
}
