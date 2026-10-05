import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: "queued" | "running" | "completed" | "failed" | "partial" }) {
  if (status === "completed") return <Badge tone="success">Completed</Badge>;
  if (status === "running") return <Badge tone="info">Running</Badge>;
  if (status === "failed") return <Badge tone="danger">Failed</Badge>;
  if (status === "partial") return <Badge tone="warning">Partial</Badge>;
  return <Badge tone="neutral">Queued</Badge>;
}
