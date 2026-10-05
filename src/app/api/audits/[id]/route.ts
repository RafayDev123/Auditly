import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
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
import { getSessionUser } from "@/lib/auth/session";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const audit = await db
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
      scoreVersion: audits.scoreVersion,
      createdAt: audits.createdAt,
      completedAt: audits.completedAt,
      errorMessage: audits.errorMessage,
      domain: websites.domain,
    })
    .from(audits)
    .innerJoin(websites, eq(websites.id, audits.websiteId))
    .where(and(eq(audits.id, id), eq(audits.userId, user.userId)))
    .limit(1);

  if (!audit[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [stages, findings, metrics, technologies, recs, ai] = await Promise.all([
    db.select().from(auditStages).where(eq(auditStages.auditId, id)).orderBy(asc(auditStages.sortOrder)),
    db.select().from(auditFindings).where(eq(auditFindings.auditId, id)).orderBy(asc(auditFindings.createdAt)),
    db.select().from(auditMetrics).where(eq(auditMetrics.auditId, id)).orderBy(asc(auditMetrics.createdAt)),
    db.select().from(auditTechnologies).where(eq(auditTechnologies.auditId, id)).orderBy(asc(auditTechnologies.createdAt)),
    db.select().from(recommendations).where(eq(recommendations.auditId, id)).orderBy(asc(recommendations.priority)),
    db.select().from(auditAiSummaries).where(eq(auditAiSummaries.auditId, id)).limit(1),
  ]);

  return NextResponse.json({
    audit: audit[0],
    stages,
    findings,
    metrics,
    technologies,
    recommendations: recs,
    aiSummary: ai[0] ?? null,
  });
}
