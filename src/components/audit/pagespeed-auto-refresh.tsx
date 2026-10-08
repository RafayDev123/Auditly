"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function PageSpeedAutoRefresh({ auditId, needed }: { auditId: string; needed: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!needed) return;

    let cancelled = false;
    const refresh = async () => {
      setRefreshing(true);
      setMessage("Fetching missing Google results without rerunning the audit...");
      try {
        for (let retry = 0; retry < 3; retry += 1) {
          try {
            for (let poll = 0; poll < 35; poll += 1) {
              const response = await fetch(`/api/audits/${auditId}/pagespeed`, { method: "POST" });
              if (response.status === 202) {
                await new Promise((resolve) => setTimeout(resolve, 1500));
                continue;
              }
              if (!response.ok) {
                if (response.status === 429 || response.status >= 500) {
                  throw new Error("Google PageSpeed is temporarily unavailable.");
                }
                throw new Error("Google results could not be refreshed.");
              }

              const result = (await response.json()) as { complete: boolean; warning?: string | null };
              if (cancelled) return;
              router.refresh();
              if (result.complete) {
                setMessage(null);
                return;
              }
              if (retry === 2) {
                setMessage(result.warning ?? "Google returned partial results. Missing data is left blank.");
                return;
              }
              break;
            }
            if (retry === 2) throw new Error("Google results are still processing. Reload this report shortly.");
          } catch (error) {
            if (retry === 2) throw error;
          }
          await new Promise((resolve) => setTimeout(resolve, (retry + 1) * 2000));
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : "Google results could not be refreshed.");
        }
      } finally {
        if (!cancelled) setRefreshing(false);
      }
    };

    void refresh();
    return () => {
      cancelled = true;
    };
  }, [auditId, needed, retryKey, router]);

  const retry = useCallback(() => {
    setMessage(null);
    setRetryKey((current) => current + 1);
  }, []);

  if (!needed && !message) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3" role="status">
      <p className="text-sm text-[var(--muted-foreground)]">{message ?? "Refreshing Google results..."}</p>
      {!refreshing && needed ? (
        <Button type="button" variant="secondary" onClick={retry}>
          Try PageSpeed again
        </Button>
      ) : null}
    </div>
  );
}