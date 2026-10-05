import { load } from "cheerio";
import type { AnalyzerCheck, DetectedTechnology, MetricResult } from "@/lib/types";

function severityFromPass(passed: boolean, failureSeverity: AnalyzerCheck["severity"]) {
  return passed ? "info" : failureSeverity;
}

function contentLengthStatus(size: number) {
  if (size < 150_000) return "info" as const;
  if (size < 350_000) return "medium" as const;
  return "high" as const;
}

export async function runAuditAnalysis(url: string) {
  const started = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  let response: Response;
  try {
    response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "user-agent": "WebsiteAuditAI/1.0 (+https://websiteaudit.ai)" },
    });
  } finally {
    clearTimeout(timeout);
  }

  const ttfb = Math.round(performance.now() - started);
  const html = await response.text();
  const bytes = Buffer.byteLength(html, "utf8");
  const $ = load(html);

  const title = $("title").text().trim();
  const metaDescription = $("meta[name='description']").attr("content")?.trim() ?? "";
  const canonical = $("link[rel='canonical']").attr("href")?.trim() ?? "";
  const h1Count = $("h1").length;
  const viewport = $("meta[name='viewport']").attr("content")?.trim() ?? "";
  const lang = $("html").attr("lang")?.trim() ?? "";
  const images = $("img").toArray();
  const missingAlt = images.filter((img) => !$(img).attr("alt")?.trim()).length;

  const checks: AnalyzerCheck[] = [
    {
      key: "https",
      category: "security",
      title: "HTTPS enabled",
      passed: url.startsWith("https://"),
      severity: "high",
      weight: 12,
      summary: url.startsWith("https://") ? "Target uses HTTPS." : "Target is not using HTTPS.",
      whyItMatters: "HTTPS protects integrity and confidentiality in transit.",
      recommendedFix: "Redirect all traffic to HTTPS and keep certificates valid.",
      evidence: { url },
      affectedUrl: url,
    },
    {
      key: "status-code",
      category: "ux",
      title: "Successful primary response",
      passed: response.ok,
      severity: "critical",
      weight: 16,
      summary: `Status code ${response.status}`,
      whyItMatters: "Non-2xx responses break user journeys and indexing signals.",
      recommendedFix: "Ensure the primary URL returns a stable 200 response.",
      evidence: { status: response.status },
      affectedUrl: url,
    },
    {
      key: "title",
      category: "seo",
      title: "Page title present",
      passed: title.length > 0,
      severity: "high",
      weight: 10,
      summary: title ? `Title detected (${title.length} chars)` : "No title detected.",
      whyItMatters: "Titles are core ranking and click-through signals.",
      recommendedFix: "Add a descriptive title tag around 50-60 characters.",
      evidence: { title },
      affectedUrl: url,
    },
    {
      key: "meta-description",
      category: "seo",
      title: "Meta description present",
      passed: metaDescription.length > 0,
      severity: "medium",
      weight: 8,
      summary: metaDescription ? `Description detected (${metaDescription.length} chars)` : "Missing meta description.",
      whyItMatters: "Descriptions help control search snippets and improve click-through rate.",
      recommendedFix: "Add a unique meta description (120-160 characters).",
      evidence: { metaDescription },
      affectedUrl: url,
    },
    {
      key: "canonical",
      category: "seo",
      title: "Canonical URL present",
      passed: canonical.length > 0,
      severity: "low",
      weight: 5,
      summary: canonical ? "Canonical link detected." : "No canonical tag found.",
      whyItMatters: "Canonical tags reduce duplicate-content ambiguity.",
      recommendedFix: "Add a canonical URL tag to primary pages.",
      evidence: { canonical },
      affectedUrl: url,
    },
    {
      key: "h1",
      category: "seo",
      title: "Single primary H1",
      passed: h1Count === 1,
      severity: "medium",
      weight: 7,
      summary: `Detected ${h1Count} H1 headings.`,
      whyItMatters: "A clear heading hierarchy improves crawl interpretation and readability.",
      recommendedFix: "Use exactly one primary H1 on the page.",
      evidence: { h1Count },
      affectedUrl: url,
    },
    {
      key: "viewport",
      category: "ux",
      title: "Mobile viewport configured",
      passed: viewport.length > 0,
      severity: "high",
      weight: 8,
      summary: viewport ? "Viewport meta tag found." : "No viewport meta tag found.",
      whyItMatters: "Viewport settings are required for proper mobile rendering.",
      recommendedFix: "Add meta viewport for responsive layout behavior.",
      evidence: { viewport },
      affectedUrl: url,
    },
    {
      key: "lang",
      category: "accessibility",
      title: "Document language declared",
      passed: lang.length > 0,
      severity: "medium",
      weight: 7,
      summary: lang ? `Language declared (${lang}).` : "No HTML lang attribute found.",
      whyItMatters: "Language metadata helps assistive technologies read content correctly.",
      recommendedFix: "Set a valid language in the html lang attribute.",
      evidence: { lang },
      affectedUrl: url,
    },
    {
      key: "image-alt",
      category: "accessibility",
      title: "Images include alt text",
      passed: missingAlt === 0,
      severity: "high",
      weight: 10,
      summary: `Images missing alt: ${missingAlt}/${images.length}`,
      whyItMatters: "Alternative text is needed for non-visual access and context.",
      recommendedFix: "Provide meaningful alt text for informative images.",
      evidence: { imageCount: images.length, missingAlt },
      affectedUrl: url,
    },
    {
      key: "content-size",
      category: "performance",
      title: "HTML document size",
      passed: bytes < 350_000,
      severity: "medium",
      weight: 8,
      summary: `HTML transfer size is ${Math.round(bytes / 1024)} KB.`,
      whyItMatters: "Large HTML payloads can delay rendering and increase parse cost.",
      recommendedFix: "Reduce server-rendered payload size and defer non-critical markup.",
      evidence: { bytes },
      affectedUrl: url,
    },
    {
      key: "ttfb",
      category: "performance",
      title: "Initial response time",
      passed: ttfb < 1800,
      severity: "high",
      weight: 12,
      summary: `Observed TTFB ${ttfb}ms from scanner region.`,

      whyItMatters: "Slow server response increases bounce risk and delays paint metrics.",
      recommendedFix: "Optimize backend response path, caching, and edge delivery.",
      evidence: { ttfbMs: ttfb },
      affectedUrl: url,
    },
  ];

  const headers = response.headers;
  const securityHeaders = [
    ["content-security-policy", "Content-Security-Policy"],
    ["strict-transport-security", "Strict-Transport-Security"],
    ["x-content-type-options", "X-Content-Type-Options"],
    ["referrer-policy", "Referrer-Policy"],
    ["permissions-policy", "Permissions-Policy"],
    ["x-frame-options", "X-Frame-Options"],
  ] as const;

  for (const [key, label] of securityHeaders) {
    const value = headers.get(key);
    checks.push({
      key: `header-${key}`,
      category: "security",
      title: `${label} header present`,
      passed: Boolean(value),
      severity: "medium",
      weight: 5,
      summary: value ? `${label} detected.` : `${label} missing.`,
      whyItMatters: "Security headers provide baseline browser-level protection signals.",
      recommendedFix: `Set the ${label} header at your application or edge layer.`,

      technicalDetails: value ?? undefined,
      evidence: { header: key, value },
      affectedUrl: url,
    });
  }

  const scriptSrc = $("script[src]")
    .toArray()
    .map((el) => $(el).attr("src") ?? "");

  const technologies: DetectedTechnology[] = [];
  const htmlText = html.toLowerCase();

  const techRules: Array<{ name: string; category: string; signals: string[]; confidence: "high" | "medium" | "low" }> = [
    { name: "Next.js", category: "Framework", signals: ["/_next/", "__next"], confidence: "high" },
    { name: "React", category: "Library", signals: ["react", "data-reactroot"], confidence: "medium" },
    { name: "WordPress", category: "CMS", signals: ["wp-content", "wp-includes"], confidence: "high" },
    { name: "Shopify", category: "E-commerce", signals: ["cdn.shopify.com", "shopify"], confidence: "high" },
    { name: "Tailwind CSS", category: "CSS", signals: ["tailwind", "--tw-"], confidence: "medium" },
    { name: "Google Analytics", category: "Analytics", signals: ["gtag", "google-analytics.com", "googletagmanager.com"], confidence: "high" },
    { name: "Cloudflare", category: "Infrastructure", signals: ["cloudflare", "cf-ray"], confidence: "medium" },
    { name: "Vercel", category: "Hosting", signals: ["x-vercel-id", "vercel"], confidence: "medium" },
  ];

  for (const rule of techRules) {
    const matched = rule.signals.filter(
      (signal) => htmlText.includes(signal) || scriptSrc.some((src) => src.toLowerCase().includes(signal)),
    );
    const headerSignals: Record<string, string> = {
      Cloudflare: "cf-ray",
      Vercel: "x-vercel-id",
    };
    const headerName = headerSignals[rule.name];
    if (headerName && headers.get(headerName)) matched.push(`${headerName} header`);

    if (matched.length > 0) {
      technologies.push({
        name: rule.name,
        category: rule.category,
        confidence: rule.confidence,
        signals: matched,
        version: null,
      });
    }
  }

  const metrics: MetricResult[] = [
    {
      category: "performance",
      metricKey: "ttfb",
      metricLabel: "TTFB",
      numericValue: ttfb,
      unit: "ms",
      status: ttfb < 800 ? "info" : ttfb < 1800 ? "medium" : "high",
      source: "http-check",
      evidence: { note: "Measured from scanner request timing." },
    },
    {
      category: "performance",
      metricKey: "html_size",
      metricLabel: "HTML size",
      numericValue: bytes,
      unit: "bytes",
      status: contentLengthStatus(bytes),
      source: "http-check",
      evidence: { kb: Math.round(bytes / 1024) },
    },
  ];

  return { checks, metrics, technologies, statusCode: response.status };
}
