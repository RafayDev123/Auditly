"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setLoading(true);
        const form = new FormData(event.currentTarget);

        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: form.get("email") }),
        });

        const json = (await res.json().catch(() => ({}))) as { message?: string };
        setMessage(json.message ?? "If an account exists, a reset link has been sent.");
        setLoading(false);
      }}
    >
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm">
          Account email
        </label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <Button className="w-full" disabled={loading}>
        {loading ? "Sending link…" : "Send reset link"}
      </Button>
      {message ? <p className="text-sm text-[var(--muted-foreground)]">{message}</p> : null}
      <p className="text-sm text-[var(--muted-foreground)]">
        <Link href="/login" className="text-[var(--foreground)]">
          Back to login
        </Link>
      </p>
    </form>
  );
}
