import { scoreStatus } from "@/lib/utils";

function ringColor(score: number) {
  const status = scoreStatus(score);
  if (status === "healthy") return "#34d399";
  if (status === "good") return "#38bdf8";
  if (status === "needs-improvement") return "#fbbf24";
  return "#f87171";
}

export function ScoreRing({ score }: { score: number }) {
  const radius = 42;
  const stroke = 8;
  const normalized = 2 * Math.PI * radius;
  const offset = normalized - (score / 100) * normalized;

  return (
    <div className="relative h-32 w-32">
      <svg className="h-32 w-32 -rotate-90" viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke={ringColor(score)}
          strokeWidth={stroke}
          strokeDasharray={normalized}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <p className="mono text-2xl font-semibold">{score}</p>
      </div>
    </div>
  );
}
