import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditStages, audits } from "@/db/schema";
import { getSessionUser } from "@/lib/auth/session";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const audit = await db
    .select({ id: audits.id, status: audits.status, errorMessage: audits.errorMessage })
    .from(audits)
    .where(and(eq(audits.id, id), eq(audits.userId, user.userId)))
    .limit(1);

  if (!audit[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const stages = await db.select().from(auditStages).where(eq(auditStages.auditId, id)).orderBy(asc(auditStages.sortOrder));
  return NextResponse.json({ audit: audit[0], stages });
}
