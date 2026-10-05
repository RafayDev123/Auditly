"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function RescanButton({ auditId }: { auditId: string }) {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      variant="secondary"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        const res = await fetch(`/api/audits/${auditId}/rescan`, { method: "POST" });
        const json = (await res.json().catch(() => ({}))) as { id?: string };
        if (json.id) window.location.href = `/audits/${json.id}`;
        else setLoading(false);
      }}
    >
      {loading ? "Starting…" : "Rescan"}
    </Button>
  );
}
