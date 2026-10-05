"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function NewAuditForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Card className="max-w-2xl space-y-4">
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setLoading(true);
          setError(null);
          const form = new FormData(event.currentTarget);

          const res = await fetch("/api/audits", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              url: form.get("url"),
              pagesToScan: 1,
              mobile: true,
              detectTech: true,
            }),
          });

          const json = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
          if (!res.ok || !json.id) {
            setError(json.error ?? "Unable to start audit.");
            setLoading(false);
            return;
          }

          router.push(`/audits/${json.id}`);
        }}
      >
        <div className="space-y-1">
          <label htmlFor="url" className="text-sm font-medium">
            Website URL
          </label>
          <Input id="url" name="url" type="url" required defaultValue={searchParams.get("url") ?? "https://example.com"} />
        </div>

        <div className="grid gap-3 text-sm text-[var(--muted-foreground)] md:grid-cols-2">
          <p>Pages to scan: 1 (MVP default)</p>
          <p>Mode: Mobile + technology detection</p>
          <p>JavaScript rendering: Disabled by default</p>
          <p>Deep crawl: Disabled by default</p>
        </div>

        {error ? <p className="text-sm text-rose-400">{error}</p> : null}

        <Button disabled={loading}>{loading ? "Starting audit…" : "Start audit"}</Button>
      </form>
    </Card>
  );
}
