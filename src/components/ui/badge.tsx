import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const tones: Record<Tone, string> = {
  neutral: "bg-[var(--muted)] text-[var(--foreground)]",
  success: "bg-[color-mix(in_srgb,var(--success-foreground)_12%,transparent)] text-[var(--success-foreground)]",
  warning: "bg-[color-mix(in_srgb,var(--warning-foreground)_12%,transparent)] text-[var(--warning-foreground)]",
  danger: "bg-[color-mix(in_srgb,var(--danger-foreground)_12%,transparent)] text-[var(--danger-foreground)]",
  info: "bg-[color-mix(in_srgb,var(--info-foreground)_12%,transparent)] text-[var(--info-foreground)]",
};

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", tones[tone], className)}>{children}</span>;
}
