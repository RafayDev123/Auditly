import type { AnalyzerCheck, ScoringResult } from "@/lib/types";

const categories = ["performance", "seo", "accessibility", "security", "ux"] as const;

type Category = (typeof categories)[number];

function scoreForCategory(checks: AnalyzerCheck[], category: Category) {
  const scoped = checks.filter((c) => c.category === category);
  if (!scoped.length) return 0;

  const totalWeight = scoped.reduce((sum, c) => sum + c.weight, 0);
  const earned = scoped.reduce((sum, c) => (c.passed ? sum + c.weight : sum), 0);
  return Math.max(0, Math.min(100, Math.round((earned / totalWeight) * 100)));
}

export function computeScores(checks: AnalyzerCheck[]): ScoringResult {
  const categoryScores = {
    performance: scoreForCategory(checks, "performance"),
    seo: scoreForCategory(checks, "seo"),
    accessibility: scoreForCategory(checks, "accessibility"),
    security: scoreForCategory(checks, "security"),
    ux: scoreForCategory(checks, "ux"),
  };

  const overallScore = Math.round(
    categoryScores.performance * 0.3 +
      categoryScores.seo * 0.2 +
      categoryScores.accessibility * 0.2 +
      categoryScores.security * 0.2 +
      categoryScores.ux * 0.1,
  );

  return { overallScore, categoryScores };
}
