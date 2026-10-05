import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditMetrics, auditStages, audits } from "@/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { PAGESPEED_COMPLETION_KEYS, runPageSpeedAnalysis } from "@/lib/pagespeed";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const audit = await db
    .select({ id: audits.id, targetUrl: audits.targetUrl, status: audits.status })
    .from(audits)
    .where(and(eq(audits.id, id), eq(audits.userId, user.userId)))
    .limit(1);

  if (!audit[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (audit[0].status !== "completed") {
    return NextResponse.json({ error: "Audit is not complete." }, { status: 409 });
  }

  const savedScores = await db
    .select({ metricKey: auditMetrics.metricKey })
    .from(auditMetrics)
    .where(
      and(
        eq(auditMetrics.auditId, id),
        eq(auditMetrics.source, "pagespeed-lab"),
        inArray(auditMetrics.metricKey, PAGESPEED_COMPLETION_KEYS),
      ),
    );
  if (new Set(savedScores.map((metric) => metric.metricKey)).size === PAGESPEED_COMPLETION_KEYS.length) {
    return NextResponse.json({ complete: true, refreshed: false });
  }

  const claim = await db
    .update(auditStages)
    .set({ status: "running", details: "Fetching missing Google PageSpeed results.", updatedAt: new Date() })
    .where(
      and(
        eq(auditStages.auditId, id),
        eq(auditStages.stageKey, "performance"),
        inArray(auditStages.status, ["completed", "failed"]),
      ),
    )
    .returning({ id: auditStages.id });
  if (!claim.length) return NextResponse.json({ refreshing: true }, { status: 202 });

  try {
    const result = await runPageSpeedAnalysis(audit[0].targetUrl);
    const returnedKeys = new Set(result.metrics.map((metric) => metric.metricKey));
    const complete = PAGESPEED_COMPLETION_KEYS.every((key) => returnedKeys.has(key));

    await db.transaction(async (tx) => {
      for (const metric of result.metrics) {
        await tx
          .delete(auditMetrics)
          .where(and(eq(auditMetrics.auditId, id), eq(auditMetrics.metricKey, metric.metricKey)));
      }
      if (result.metrics.length) {
        await tx.insert(auditMetrics).values(
          result.metrics.map((metric) => ({
            auditId: id,
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
      await tx
        .update(auditStages)
        .set({
          status: "completed",
          details: result.warning ?? (complete ? null : "Google returned partial category data."),
          updatedAt: new Date(),
        })
        .where(eq(auditStages.id, claim[0].id));
    });

    return NextResponse.json({ complete, warning: result.warning ?? null });
  } catch {
    await db
      .update(auditStages)
      .set({ status: "failed", details: "Google PageSpeed refresh failed.", updatedAt: new Date() })
      .where(eq(auditStages.id, claim[0].id));
    return NextResponse.json({ error: "Google PageSpeed refresh failed." }, { status: 502 });
  }
}