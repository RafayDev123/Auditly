import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  auditAiSummaries,
  auditFindings,
  auditMetrics,
  auditStages,
  auditTechnologies,
  audits,
  recommendations,
  websites,
} from "@/db/schema";
import { generateAiSummary } from "@/lib/ai";
import { runAuditAnalysis } from "@/lib/analyzer";
import { runPageSpeedAnalysis } from "@/lib/pagespeed";
import { computeScores } from "@/lib/scoring";
import { SCAN_STAGES } from "@/lib/types";
import { validatePublicTarget } from "@/lib/url";

export async function initializeAuditStages(auditId: string) {
  await db.insert(auditStages).values(
    SCAN_STAGES.map((stage, idx) => ({
      auditId,
      stageKey: stage.key,
      label: stage.label,
      sortOrder: idx,
      status: "pending" as const,
    })),
  );
}

async function setStage(auditId: string, stageKey: string, status: "pending" | "running" | "completed" | "failed", details?: string) {
  await db
    .update(auditStages)
    .set({ status, details: details ?? null, updatedAt: new Date() })
    .where(and(eq(auditStages.auditId, auditId), eq(auditStages.stageKey, stageKey)));
}

export async function runAuditJob(auditId: string) {
  const audit = await db
    .select({ id: audits.id, targetUrl: audits.targetUrl, websiteId: audits.websiteId })
    .from(audits)
    .where(eq(audits.id, auditId))
    .limit(1);

  if (!audit[0]) return;

  await db
    .update(audits)
    .set({ status: "running", startedAt: new Date(), errorMessage: null, updatedAt: new Date() })
    .where(eq(audits.id, auditId));

  try {
    await setStage(auditId, "validate-url", "running");
    const validated = await validatePublicTarget(audit[0].targetUrl);
    if (!validated.ok) {
      await setStage(auditId, "validate-url", "failed", validated.message);
      throw new Error(validated.message);
    }
    await setStage(auditId, "validate-url", "completed");

    await setStage(auditId, "connect", "running");
    await setStage(auditId, "connect", "completed");

    await setStage(auditId, "performance", "running");
    const [analysis, pageSpeed] = await Promise.all([
      runAuditAnalysis(validated.normalizedUrl),
      runPageSpeedAnalysis(validated.normalizedUrl),
    ]);
    analysis.metrics.push(...pageSpeed.metrics);
    await setStage(auditId, "performance", "completed", pageSpeed.warning ?? undefined);

    await setStage(auditId, "seo", "completed");
    await setStage(auditId, "accessibility", "completed");
    await setStage(auditId, "security", "completed");
    await setStage(auditId, "technology", "completed");

    const scores = computeScores(analysis.checks);

    await db.transaction(async (tx) => {
      await tx.delete(auditFindings).where(eq(auditFindings.auditId, auditId));
      await tx.delete(auditMetrics).where(eq(auditMetrics.auditId, auditId));
      await tx.delete(auditTechnologies).where(eq(auditTechnologies.auditId, auditId));
      await tx.delete(recommendations).where(eq(recommendations.auditId, auditId));
      await tx.delete(auditAiSummaries).where(eq(auditAiSummaries.auditId, auditId));

      const failedChecks = analysis.checks.filter((check) => !check.passed);
      if (failedChecks.length) {
        await tx.insert(auditFindings).values(
          failedChecks.map((check) => ({
            auditId,
            category: check.category,
            severity: check.severity,
            title: check.title,
            summary: check.summary,
            whyItMatters: check.whyItMatters,
            recommendedFix: check.recommendedFix,
            technicalDetails: check.technicalDetails ?? null,
            aiExplanation: null,
            affectedUrl: check.affectedUrl ?? null,
            evidence: check.evidence ?? null,
          })),
        );
      }

      if (analysis.metrics.length) {
        await tx.insert(auditMetrics).values(
          analysis.metrics.map((metric) => ({
            auditId,
            category: metric.category,
            metricKey: metric.metricKey,
            metricLabel: metric.metricLabel,
            numericValue: metric.numericValue,
            unit: metric.unit,
            status: metric.status,
            source: metric.source,
            evidence: metric.evidence ?? null,
          })),
        );
      }

      if (analysis.technologies.length) {
        await tx.insert(auditTechnologies).values(
          analysis.technologies.map((tech) => ({
            auditId,
            name: tech.name,
            category: tech.category,
            confidence: tech.confidence,
            evidence: { signals: tech.signals, version: tech.version ?? null },
          })),
        );
      }

      if (failedChecks.length) {
        await tx.insert(recommendations).values(
          failedChecks
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 8)
            .map((check, index) => ({
              auditId,
              priority: index + 1,
              title: check.title,
              description: check.recommendedFix,
              impact: check.whyItMatters,
              effort: check.severity === "critical" || check.severity === "high" ? "high" : "medium",
            })),
        );
      }

      const ai = await generateAiSummary(analysis.checks);
      await tx.insert(auditAiSummaries).values({
        auditId,
        model: process.env.AI_API_KEY ? "configured-provider" : "rules-fallback",
        summary: ai.summary,
        topProblems: ai.topProblems,
        quickWins: ai.quickWins,
        recommendedOrder: ai.recommendedOrder,
        businessImpact: ai.businessImpact,
      });

      await tx
        .update(audits)
        .set({
          status: "completed",
          overallScore: scores.overallScore,
          performanceScore: scores.categoryScores.performance,
          seoScore: scores.categoryScores.seo,
          accessibilityScore: scores.categoryScores.accessibility,
          securityScore: scores.categoryScores.security,
          uxScore: scores.categoryScores.ux,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(audits.id, auditId));

      await tx.update(websites).set({ latestAuditId: auditId, updatedAt: new Date() }).where(eq(websites.id, audit[0].websiteId));
    });

    await setStage(auditId, "recommendations", "completed");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Audit failed unexpectedly.";
    await db.update(audits).set({ status: "failed", errorMessage: message, updatedAt: new Date() }).where(eq(audits.id, auditId));

    const stages = await db
      .select({ stageKey: auditStages.stageKey, status: auditStages.status })
      .from(auditStages)
      .where(eq(auditStages.auditId, auditId))
      .orderBy(asc(auditStages.sortOrder));

    const running = stages.find((stage) => stage.status === "running");
    if (running) {
      await setStage(auditId, running.stageKey, "failed", message);
    }
  }
}

export async function getLatestAuditsForUser(userId: string, limit = 10) {
  return db
    .select({
      id: audits.id,
      targetUrl: audits.targetUrl,
      status: audits.status,
      overallScore: audits.overallScore,
      performanceScore: audits.performanceScore,
      seoScore: audits.seoScore,
      accessibilityScore: audits.accessibilityScore,
      securityScore: audits.securityScore,
      uxScore: audits.uxScore,
      createdAt: audits.createdAt,
      completedAt: audits.completedAt,
      domain: websites.domain,
    })
    .from(audits)
    .innerJoin(websites, eq(websites.id, audits.websiteId))
    .where(eq(audits.userId, userId))
    .orderBy(desc(audits.createdAt))
    .limit(limit);
}
