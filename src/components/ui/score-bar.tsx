import { cn } from "@/lib/utils";

export function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = score >= 90 ? "bg-emerald-400" : score >= 75 ? "bg-sky-400" : score >= 50 ? "bg-amber-400" : "bg-rose-400";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="mono">{score}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--muted)]">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
