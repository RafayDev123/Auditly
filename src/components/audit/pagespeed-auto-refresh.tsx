"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function PageSpeedAutoRefresh({ auditId, needed }: { auditId: string; needed: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!needed) return;

    let cancelled = false;
    const refresh = async () => {
      setMessage("Fetching missing Google results without rerunning the audit...");
      try {
        for (let attempt = 0; attempt < 35; attempt += 1) {
          const response = await fetch(`/api/audits/${auditId}/pagespeed`, { method: "POST" });
          if (response.status === 202) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            continue;
          }
          if (!response.ok) throw new Error("Google results could not be refreshed.");

          const result = (await response.json()) as { complete: boolean; warning?: string | null };
          if (cancelled) return;
          if (result.complete) {
            setMessage(null);
            router.refresh();
          } else {
            setMessage(result.warning ?? "Google returned partial results. Missing data is left blank.");
            router.refresh();
          }
          return;
        }
        throw new Error("Google results are still processing. Reload this report shortly.");
      } catch (error) {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : "Google results could not be refreshed.");
        }
      }
    };

    void refresh();
    return () => {
      cancelled = true;
    };
  }, [auditId, needed, router]);

  if (!needed && !message) return null;
  return (
    <p className="mt-3 text-sm text-[var(--muted-foreground)]" role="status">
      {message ?? "Refreshing Google results..."}
    </p>
  );
}