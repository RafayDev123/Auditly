import { Badge } from "@/components/ui/badge";
import type { Severity } from "@/lib/types";

export function SeverityBadge({ severity }: { severity: Severity }) {
  if (severity === "critical") return <Badge tone="danger">Critical</Badge>;
  if (severity === "high") return <Badge tone="danger">High</Badge>;
  if (severity === "medium") return <Badge tone="warning">Medium</Badge>;
  if (severity === "low") return <Badge tone="info">Low</Badge>;
  return <Badge tone="neutral">Info</Badge>;
}
