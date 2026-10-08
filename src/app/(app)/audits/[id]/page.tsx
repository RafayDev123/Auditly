import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import {
  auditMetrics,
  auditStages,
  audits,
  websites,
} from "@/db/schema";
import { requireUser } from "@/lib/auth/server";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/utils";
import { AuditProgress } from "@/components/audit/audit-progress";
import { RescanButton } from "@/components/audit/rescan-button";
import { PageSpeedDeviceTabs } from "@/components/audit/pagespeed-device-tabs";
import { PageSpeedAutoRefresh } from "@/components/audit/pagespeed-auto-refresh";
import { DownloadReportButton } from "@/components/audit/download-report-button";
import { PAGESPEED_COMPLETION_KEYS } from "@/lib/pagespeed";

export default async function AuditReportPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const audit = await db
    .select({
      id: audits.id,
      status: audits.status,
      targetUrl: audits.targetUrl,
      createdAt: audits.createdAt,
      errorMessage: audits.errorMessage,
      domain: websites.domain,
    })
    .from(audits)
    .innerJoin(websites, eq(websites.id, audits.websiteId))
    .where(and(eq(audits.id, id), eq(audits.userId, user.userId)))
    .limit(1);

  if (!audit[0]) notFound();

  const [stages, metrics] = await Promise.all([
    db.select().from(auditStages).where(eq(auditStages.auditId, id)).orderBy(asc(auditStages.sortOrder)),
    db.select().from(auditMetrics).where(eq(auditMetrics.auditId, id)).orderBy(asc(auditMetrics.createdAt)),
  ]);

  const googleMetrics = metrics.filter((metric) => metric.source === "pagespeed-lab" || metric.source === "crux-field");
  const lighthouseMetrics = googleMetrics.filter((metric) => metric.source === "pagespeed-lab");
  const fieldMetrics = googleMetrics.filter((metric) => metric.source === "crux-field");
  const googleSuggestions = lighthouseMetrics.filter((metric) => metric.metricKey.includes("_suggestion_"));
  const googleReportMetrics = googleMetrics.filter(
    (metric) =>
      !metric.metricKey.includes("_suggestion_") &&
      !metric.metricKey.endsWith("_scan_complete") &&
      !metric.metricKey.endsWith("_diagnostics_complete"),
  );
  const pageSpeedWarning = stages.find((stage) => stage.stageKey === "performance")?.details;
  const lighthouseCategories = [
    { id: "performance", label: "Performance" },
    { id: "accessibility", label: "Accessibility" },
    { id: "best-practices", label: "Best Practices" },
    { id: "seo", label: "SEO" },
  ] as const;
  const lighthouseScoreData = lighthouseCategories.map((category) => ({
    category: category.label,
    mobile: metrics.find((metric) => metric.metricKey === `psi_mobile_${category.id}_score`)?.numericValue ?? null,
    desktop: metrics.find((metric) => metric.metricKey === `psi_desktop_${category.id}_score`)?.numericValue ?? null,
  }));
  const savedGoogleKeys = new Set(lighthouseMetrics.map((metric) => metric.metricKey));
  const needsGoogleRefresh = PAGESPEED_COMPLETION_KEYS.some((key) => !savedGoogleKeys.has(key));
  function hostnameFromUrl(value: unknown) {
    if (typeof value !== "string") return null;
    try {
      return new URL(value).hostname;
    } catch {
      return null;
    }
  }

  const googleRecommendationData = googleSuggestions.map((metric) => {
    const categoryId = metric.evidence?.category;
    const categoryLabel = lighthouseCategories.find((category) => category.id === categoryId)?.label ?? "Lighthouse";
    const strategy = metric.evidence?.strategy;
    return {
      category: categoryLabel,
      strategy: typeof strategy === "string" ? strategy : "device",
      title: metric.metricLabel,
      score: metric.numericValue,
      displayValue: typeof metric.evidence?.displayValue === "string" ? metric.evidence.displayValue : "",
      recommendation:
        typeof metric.evidence?.recommendation === "string"
          ? metric.evidence.recommendation
          : "Review this audit in Google PageSpeed Insights for details.",
      finalHost: hostnameFromUrl(metric.evidence?.finalUrl),
      diagnosticDetails:
        typeof metric.evidence?.diagnosticDetails === "string" ? metric.evidence.diagnosticDetails : null,
    };
  });

  function metricValue(metric: (typeof metrics)[number]) {
    if (metric.numericValue === null) return "—";
    const value = metric.metricKey.endsWith("_cls") ? metric.numericValue.toFixed(2) : metric.numericValue;
    return `${value}${metric.unit ? ` ${metric.unit}` : ""}`;
  }

  const deviceMetrics = {
    mobile: googleReportMetrics
      .filter((metric) => metric.source === "pagespeed-lab" && metric.metricKey.startsWith("psi_mobile_"))
      .map((metric) => ({ id: metric.id, label: metric.metricLabel, value: metricValue(metric) })),
    desktop: googleReportMetrics
      .filter((metric) => metric.source === "pagespeed-lab" && metric.metricKey.startsWith("psi_desktop_"))
      .map((metric) => ({ id: metric.id, label: metric.metricLabel, value: metricValue(metric) })),
  };
  const fieldMetricRows = fieldMetrics.map((metric) => ({
    id: metric.id,
    label: metric.metricLabel,
    value: metricValue(metric),
  }));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--muted-foreground)]">Audit report</p>
          <h1 className="text-2xl font-semibold">{audit[0].domain}</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Scanned: {formatDateTime(audit[0].createdAt)}</p>
          <div className="mt-2">
            <StatusBadge status={audit[0].status} />
          </div>
        </div>
        <div className="flex gap-2">
          {audit[0].status === "completed" ? (
            <DownloadReportButton
              report={{
                domain: audit[0].domain,
                targetUrl: audit[0].targetUrl,
                createdAt: audit[0].createdAt.toISOString(),
                scores: lighthouseScoreData,
                metrics: googleReportMetrics.map((metric) => ({
                  label: metric.metricLabel,
                  value: metric.numericValue,
                  unit: metric.unit ?? "",
                  source:
                    metric.source === "pagespeed-lab"
                      ? `Google Lighthouse (${typeof metric.evidence?.strategy === "string" ? metric.evidence.strategy : "lab"})`
                      : "Google CrUX real-user data",
                })),
                recommendations: googleRecommendationData,
              }}
            />
          ) : null}
          {audit[0].status !== "queued" && audit[0].status !== "running" ? (
            <RescanButton auditId={audit[0].id} />
          ) : null}
        </div>
      </header>

      <AuditProgress auditId={audit[0].id} initialStatus={audit[0].status} />

      {audit[0].status === "failed" ? (
        <Card>
          <h2 className="text-base font-semibold">Audit failed</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">{audit[0].errorMessage ?? "The scan could not complete."}</p>
        </Card>
      ) : null}

      <Card>
        <h2 className="text-base font-semibold">Google PageSpeed Insights</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">Lighthouse category scores from Google PageSpeed Insights.</p>
        {audit[0].status === "completed" ? (
          <PageSpeedAutoRefresh auditId={audit[0].id} needed={needsGoogleRefresh} />
        ) : null}
        {!lighthouseMetrics.length ? (
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            PageSpeed results are unavailable. {pageSpeedWarning ?? "No Google Lighthouse results were saved for this audit."}
          </p>
        ) : null}
        {lighthouseMetrics.length > 0 && !fieldMetrics.length ? (
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            CrUX field data is unavailable for this page or origin; lab results are shown below.
          </p>
        ) : null}
        {pageSpeedWarning ? (
          <p className="mt-3 text-sm text-[var(--warning-foreground)]" role="status">
            {pageSpeedWarning}
          </p>
        ) : null}
        <PageSpeedDeviceTabs
          scores={lighthouseScoreData}
          metrics={deviceMetrics}
          recommendations={googleRecommendationData}
          domain={audit[0].domain}
        />
        {fieldMetricRows.length ? (
          <div className="mt-6 border-t border-[var(--border-subtle)] pt-4">
            <h3 className="text-sm font-semibold">Real-user data (CrUX)</h3>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Based on real visits over the last 28 days; this data is shared across device tabs.
            </p>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-[var(--muted-foreground)]">
                  <tr>
                    <th className="py-1">Metric</th>
                    <th className="py-1">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {fieldMetricRows.map((metric) => (
                    <tr key={metric.id} className="border-t border-[var(--border-subtle)]">
                      <td className="py-2">{metric.label}</td>
                      <td className="mono py-2">{metric.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </Card>

    </div>
  );
}
