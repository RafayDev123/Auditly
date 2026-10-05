import Link from "next/link";
import { and, eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { audits, websites } from "@/db/schema";
import { requireUser } from "@/lib/auth/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

export default async function WebsiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const site = await db
    .select({ id: websites.id, domain: websites.domain, normalizedUrl: websites.normalizedUrl, createdAt: websites.createdAt })
    .from(websites)
    .where(and(eq(websites.id, id), eq(websites.userId, user.userId)))
    .limit(1);

  if (!site[0]) notFound();

  const history = await db
    .select({ id: audits.id, status: audits.status, overallScore: audits.overallScore, createdAt: audits.createdAt })
    .from(audits)
    .where(eq(audits.websiteId, id))
    .orderBy(sql`${audits.createdAt} desc`)
    .limit(20);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{site[0].domain}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{site[0].normalizedUrl}</p>
        </div>
        <Link href={`/audits/new?url=${encodeURIComponent(site[0].normalizedUrl)}`}>
          <Button>Run audit</Button>
        </Link>
      </header>

      <Card>
        <h2 className="text-base font-semibold">Audit history</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {history.map((item) => (
            <li key={item.id} className="flex items-center justify-between rounded border border-[var(--border)] px-3 py-2">
              <Link href={`/audits/${item.id}`} className="hover:underline">
                {formatDateTime(item.createdAt)}
              </Link>
              <span className="mono">{item.overallScore ?? "—"}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
