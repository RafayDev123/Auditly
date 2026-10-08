"use client";

import { useState } from "react";

type Strategy = "mobile" | "desktop";

type Score = {
  category: string;
  score: number | null;
};

type Metric = {
  id: string;
  label: string;
  value: string;
};

type Recommendation = {
  category: string;
  strategy: string;
  title: string;
  displayValue: string;
  recommendation: string;
  finalHost: string | null;
  diagnosticDetails: string | null;
};

const CATEGORY_CONTEXT: Record<string, string> = {
  Performance: "This failed check points to a page speed or responsiveness issue and contributes to the Performance score.",
  SEO: "This failed check can make it harder for search engines to crawl, understand, or present the page, and contributes to the SEO score.",
  Accessibility: "This failed check may make the page harder for some people to use and contributes to the Accessibility score.",
  "Best Practices": "This failed check identifies a recommended web development practice that contributes to the Best Practices score.",
};

export function PageSpeedDeviceTabs({
  scores,
  metrics,
  recommendations,
  domain,
}: {
  scores: Array<{ category: string; mobile: number | null; desktop: number | null }>;
  metrics: Record<Strategy, Metric[]>;
  recommendations: Recommendation[];
  domain: string;
}) {
  const [strategy, setStrategy] = useState<Strategy>("mobile");
  const deviceScores: Score[] = scores.map((score) => ({
    category: score.category,
    score: score[strategy],
  }));
  const deviceRecommendations = recommendations.filter((recommendation) => recommendation.strategy === strategy);

  return (
    <section className="mt-5" aria-label="Google PageSpeed device results">
      <div className="flex gap-2 border-b border-[var(--border-subtle)]" role="tablist" aria-label="Select device">
        {(["mobile", "desktop"] as const).map((device) => (
          <button
            key={device}
            type="button"
            role="tab"
            id={`pagespeed-${device}-tab`}
            aria-selected={strategy === device}
            aria-controls={`pagespeed-${device}-panel`}
            onClick={() => setStrategy(device)}
            className={`border-b-2 px-4 py-2 text-sm font-medium capitalize ${
              strategy === device
                ? "border-[var(--foreground)] text-[var(--foreground)]"
                : "border-transparent text-[var(--muted-foreground)]"
            }`}
          >
            {device}
          </button>
        ))}
      </div>

      <div
        id={`pagespeed-${strategy}-panel`}
        role="tabpanel"
        aria-labelledby={`pagespeed-${strategy}-tab`}
        className="pt-4"
      >
        <h3 className="text-sm font-semibold capitalize">{strategy} Lighthouse scores</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {deviceScores.map(({ category, score }) => (
            <div key={category} className="rounded-lg border border-[var(--border-subtle)] p-3">
              <p className="text-sm text-[var(--muted-foreground)]">{category}</p>
              <p className="mono mt-1 text-xl font-semibold">{score === null ? "—" : `${score}/100`}</p>
            </div>
          ))}
        </div>

        <h3 className="mt-6 text-sm font-semibold">Google Lighthouse metrics</h3>
        {metrics[strategy].length ? (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-[var(--muted-foreground)]">
                <tr>
                  <th className="py-1">Metric</th>
                  <th className="py-1">Value</th>
                </tr>
              </thead>
              <tbody>
                {metrics[strategy].map((metric) => (
                  <tr key={metric.id} className="border-t border-[var(--border-subtle)]">
                    <td className="py-2">{metric.label}</td>
                    <td className="mono py-2">{metric.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">No Lighthouse metrics were collected for {strategy}.</p>
        )}

        <h3 className="mt-6 text-sm font-semibold">Issues and how to fix them</h3>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          These are individual failed checks. Their status is separate from the category scores shown above.
        </p>
        <div className="mt-3 space-y-3">
          {deviceRecommendations.map((recommendation, index) => (
            <article
              key={`${recommendation.category}-${recommendation.title}-${index}`}
              className="rounded-lg border border-[var(--border-subtle)] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h4 className="text-sm font-semibold">{recommendation.title}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--muted-foreground)]">{recommendation.category}</span>
                  <span className="rounded-full bg-[color-mix(in_srgb,var(--warning-foreground)_12%,transparent)] px-2 py-1 text-xs font-medium text-[var(--warning-foreground)]">
                    Needs improvement
                  </span>
                </div>
              </div>
              {recommendation.finalHost && recommendation.finalHost !== domain ? (
                <p className="mt-2 text-xs text-[var(--warning-foreground)]">
                  Lighthouse followed a redirect and analyzed {recommendation.finalHost}.
                </p>
              ) : null}
              {recommendation.displayValue ? (
                <p className="mt-2 text-sm">Measured: {recommendation.displayValue}</p>
              ) : null}
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                Why this matters
              </p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {CATEGORY_CONTEXT[recommendation.category] ??
                  `Lighthouse marked this ${recommendation.category} check as needing improvement.`}
              </p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                How to fix it
              </p>
              <p className="mt-1 text-sm">{recommendation.recommendation}</p>
              {recommendation.diagnosticDetails ? (
                <details className="mt-3 text-xs text-[var(--muted-foreground)]">
                  <summary className="cursor-pointer">View Lighthouse diagnostic details</summary>
                  <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap rounded bg-[var(--surface)] p-3">
                    {recommendation.diagnosticDetails}
                  </pre>
                </details>
              ) : null}
            </article>
          ))}
          {!deviceRecommendations.length ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              No failed actionable Lighthouse audits were returned for {strategy}.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
