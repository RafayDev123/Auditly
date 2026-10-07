import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { after } from "next/server";
import { db } from "@/db";
import { audits } from "@/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { initializeAuditStages, runAuditJob } from "@/services/audit-runner";

export const maxDuration = 60;

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await db
    .select({ id: audits.id, websiteId: audits.websiteId, targetUrl: audits.targetUrl })
    .from(audits)
    .where(and(eq(audits.id, id), eq(audits.userId, user.userId)))
    .limit(1);

  if (!existing[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const inserted = await db
    .insert(audits)
    .values({
      userId: user.userId,
      websiteId: existing[0].websiteId,
      targetUrl: existing[0].targetUrl,
      status: "queued",
    })
    .returning({ id: audits.id });

  await initializeAuditStages(inserted[0].id);
  after(() => runAuditJob(inserted[0].id));

  return NextResponse.json({ id: inserted[0].id });
}
