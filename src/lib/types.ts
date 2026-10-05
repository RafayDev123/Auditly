export const SCAN_STAGES = [
  { key: "validate-url", label: "Validating URL" },
  { key: "connect", label: "Connecting to target" },
  { key: "performance", label: "Analyzing performance" },
  { key: "seo", label: "Checking SEO" },
  { key: "accessibility", label: "Checking accessibility" },
  { key: "security", label: "Checking security signals" },
  { key: "technology", label: "Detecting technologies" },
  { key: "recommendations", label: "Generating recommendations" },
] as const;

export type ScanStageKey = (typeof SCAN_STAGES)[number]["key"];
export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type AuditCategory = "performance" | "seo" | "accessibility" | "best_practices" | "security" | "ux" | "technology";
export type AuditStatus = "queued" | "running" | "completed" | "failed" | "partial";
export type TechnologyConfidence = "high" | "medium" | "low";

export interface AnalyzerCheck {
  key: string;
  category: AuditCategory;
  title: string;
  passed: boolean;
  severity: Severity;
  weight: number;
  summary: string;
  whyItMatters: string;
  recommendedFix: string;
  technicalDetails?: string;
  evidence?: Record<string, unknown>;
  affectedUrl?: string;
}

export interface DetectedTechnology {
  name: string;
  category: string;
  confidence: TechnologyConfidence;
  signals: string[];
  version?: string | null;
}

export interface MetricResult {
  category: AuditCategory;
  metricKey: string;
  metricLabel: string;
  numericValue: number | null;
  unit: string;
  status: Severity;
  source: "http-check" | "pagespeed-lab" | "crux-field";
  evidence?: Record<string, unknown>;
}

export interface ScoringResult {
  overallScore: number;
  categoryScores: Record<"performance" | "seo" | "accessibility" | "security" | "ux", number>;
}

export interface AiSummary {
  summary: string;
  topProblems: string[];
  quickWins: string[];
  recommendedOrder: string[];
  businessImpact: string;
}
