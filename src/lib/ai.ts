import type { AiSummary, AnalyzerCheck } from "@/lib/types";

function topFailed(checks: AnalyzerCheck[]) {
  return checks
    .filter((c) => !c.passed)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3);
}

export async function generateAiSummary(checks: AnalyzerCheck[]): Promise<AiSummary> {
  const failed = topFailed(checks);

  if (!failed.length) {
    return {
      summary: "The audit did not detect major failures in automated checks. Continue monitoring for regressions.",
      topProblems: [],
      quickWins: ["Schedule weekly audits", "Monitor score trends by category"],
      recommendedOrder: ["Monitor", "Iterate", "Re-verify"],
      businessImpact: "Maintaining technical quality helps protect conversion performance and organic visibility.",
    };
  }

  return {
    summary: `Your site shows solid fundamentals, but ${failed
      .map((f) => f.title.toLowerCase())
      .join(", ")} are reducing your overall score.`,
    topProblems: failed.map((item) => item.title),
    quickWins: failed.slice(0, 2).map((item) => item.recommendedFix),
    recommendedOrder: failed.map((item, index) => `${index + 1}. ${item.title}`),
    businessImpact:
      "Prioritizing these fixes first can improve search visibility, reduce friction, and support stronger user trust.",
  };
}
