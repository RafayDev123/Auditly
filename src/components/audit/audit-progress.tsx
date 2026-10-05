"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Stage = {
  id: string;
  stageKey: string;
  label: string;
  status: "pending" | "running" | "completed" | "failed";
  details: string | null;
};

export function AuditProgress({ auditId, initialStatus }: { auditId: string; initialStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [stages, setStages] = useState<Stage[]>([]);

  useEffect(() => {
    let stop = false;
    const timer = setInterval(async () => {
      const res = await fetch(`/api/audits/${auditId}/status`, { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as { audit: { status: string }; stages: Stage[] };
      if (stop) return;
      setStatus(json.audit.status);
      setStages(json.stages);

      if (json.audit.status === "completed" || json.audit.status === "failed" || json.audit.status === "partial") {
        clearInterval(timer);
        router.refresh();
      }
    }, 1800);

    return () => {
      stop = true;
      clearInterval(timer);
    };
  }, [auditId, router]);

  if (status === "completed") return null;

  return (
    <section className="surface p-4">
      <h2 className="text-base font-semibold">Preparing scan</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {stages.map((stage) => (
          <li key={stage.id} className="flex items-center justify-between gap-2 rounded px-2 py-1">
            <span>{stage.label}</span>
            <span className="mono text-xs text-[var(--muted-foreground)]">
              {stage.status === "completed" ? "✓" : stage.status === "running" ? "●" : stage.status === "failed" ? "✕" : "○"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
