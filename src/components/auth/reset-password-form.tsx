"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ResetPasswordForm({ token }: { token: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        const form = new FormData(event.currentTarget);

        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token, password: form.get("password") }),
        });

        if (!res.ok) {
          const json = (await res.json().catch(() => ({}))) as { error?: string };
          setError(json.error ?? "Unable to reset password.");
          setLoading(false);
          return;
        }

        setMessage("Password reset complete. You can sign in now.");
        setLoading(false);
      }}
    >
      <div className="space-y-1">
        <label htmlFor="password" className="text-sm">
          New password
        </label>
        <Input id="password" name="password" type="password" required autoComplete="new-password" />
      </div>
      <Button className="w-full" disabled={loading}>
        {loading ? "Resetting…" : "Reset password"}
      </Button>
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-400">{message}</p> : null}
    </form>
  );
}
