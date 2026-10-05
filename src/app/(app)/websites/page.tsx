import Link from "next/link";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { audits, websites } from "@/db/schema";
import { requireUser } from "@/lib/auth/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

export default async function WebsitesPage() {
  const user = await requireUser();

  const list = await db
    .select({
      id: websites.id,
      domain: websites.domain,
      normalizedUrl: websites.normalizedUrl,
      updatedAt: websites.updatedAt,
      latestAuditId: websites.latestAuditId,
      latestScore: audits.overallScore,
      latestStatus: audits.status,
      latestScan: audits.createdAt,
    })
    .from(websites)
    .leftJoin(audits, eq(audits.id, websites.latestAuditId))
    .where(eq(websites.userId, user.userId))
    .orderBy(sql`${websites.updatedAt} desc`);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Websites</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Track health across all monitored domains.</p>
        </div>
        <Link href="/audits/new">
          <Button>Audit website</Button>
        </Link>
      </header>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="text-xs text-[var(--muted-foreground)]">
              <tr>
                <th className="py-2">Domain</th>
                <th className="py-2">Latest score</th>
                <th className="py-2">Status</th>
                <th className="py-2">Last scan</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((site) => (
                <tr key={site.id} className="border-t border-[var(--border-subtle)]">
                  <td className="py-2">{site.domain}</td>
                  <td className="mono py-2">{site.latestScore ?? "—"}</td>
                  <td className="py-2">{site.latestStatus ?? "Not scanned"}</td>
                  <td className="py-2 text-[var(--muted-foreground)]">{formatDateTime(site.latestScan)}</td>
                  <td className="py-2">
                    <div className="flex gap-3">
                      <Link href={`/websites/${site.id}`} className="hover:underline">
                        View
                      </Link>
                      <Link href={`/audits/new?url=${encodeURIComponent(site.normalizedUrl)}`} className="hover:underline">
                        Audit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {!list.length ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[var(--muted-foreground)]">
                    Run your first audit to start tracking website health.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
