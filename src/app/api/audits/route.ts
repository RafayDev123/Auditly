import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { after } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { audits, websites } from "@/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { validatePublicTarget } from "@/lib/url";
import { initializeAuditStages, runAuditJob } from "@/services/audit-runner";

export const maxDuration = 60;

const createAuditSchema = z.object({
  url: z.string().min(8),
  pagesToScan: z.number().int().min(1).max(20).optional(),
  mobile: z.boolean().optional(),
  deepCrawl: z.boolean().optional(),
  detectTech: z.boolean().optional(),
  jsRendering: z.boolean().optional(),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const list = await db
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
    .where(eq(audits.userId, user.userId))
    .orderBy(desc(audits.createdAt))
    .limit(100);

  return NextResponse.json({ audits: list });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createAuditSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid audit request." }, { status: 400 });

  const validated = await validatePublicTarget(parsed.data.url);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.message }, { status: 400 });
  }

  const existingWebsite = await db
    .select({ id: websites.id })
    .from(websites)
    .where(and(eq(websites.userId, user.userId), eq(websites.domain, validated.domain)))
    .limit(1);

  const websiteId = existingWebsite[0]
    ? existingWebsite[0].id
    : (
        await db
          .insert(websites)
          .values({
            userId: user.userId,
            domain: validated.domain,
            normalizedUrl: validated.normalizedUrl,
          })
          .returning({ id: websites.id })
      )[0].id;

  const inserted = await db
    .insert(audits)
    .values({
      userId: user.userId,
      websiteId,
      targetUrl: validated.normalizedUrl,
      status: "queued",
      scanConfig: {
        pagesToScan: parsed.data.pagesToScan ?? 1,
        mobile: parsed.data.mobile ?? true,
        deepCrawl: parsed.data.deepCrawl ?? false,
        detectTech: parsed.data.detectTech ?? true,
        jsRendering: parsed.data.jsRendering ?? false,
      },
    })
    .returning({ id: audits.id });

  await initializeAuditStages(inserted[0].id);

  after(() => runAuditJob(inserted[0].id));

  return NextResponse.json({ id: inserted[0].id }, { status: 201 });
}
