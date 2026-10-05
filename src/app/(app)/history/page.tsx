import { eq, sql } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { audits, websites } from "@/db/schema";
import { requireUser } from "@/lib/auth/server";
import { Card } from "@/components/ui/card";

export default async function HistoryPage() {
  const user = await requireUser();
  const items = await db
    .select({ id: audits.id, domain: websites.domain, overallScore: audits.overallScore, createdAt: audits.createdAt })
    .from(audits)
    .innerJoin(websites, eq(websites.id, audits.websiteId))
    .where(eq(audits.userId, user.userId))
    .orderBy(sql`${audits.createdAt} desc`)
    .limit(50);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">History</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Track score movement over time.</p>
      </header>
      <Card>
        <ul className="space-y-2">
          {items.map((item, index) => {
            const prev = items[index + 1];
            const delta = prev?.overallScore && item.overallScore ? item.overallScore - prev.overallScore : null;
            return (
              <li key={item.id} className="flex items-center justify-between rounded border border-[var(--border)] px-3 py-2 text-sm">
                <Link href={`/audits/${item.id}`} className="hover:underline">
                  {item.domain}
                </Link>
                <div className="flex items-center gap-3">
                  <span className="mono">{item.overallScore ?? "—"}</span>
                  {delta !== null ? <span className={delta >= 0 ? "text-emerald-400" : "text-rose-400"}>{delta >= 0 ? `+${delta}` : delta}</span> : null}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
