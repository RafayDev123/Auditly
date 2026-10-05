import Link from "next/link";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { audits, websites } from "@/db/schema";
import { requireUser } from "@/lib/auth/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/utils";

export default async function AuditsPage() {
  const user = await requireUser();
  const list = await db
    .select({
      id: audits.id,
      domain: websites.domain,
      targetUrl: audits.targetUrl,
      status: audits.status,
      overallScore: audits.overallScore,
      performance: audits.performanceScore,
      seo: audits.seoScore,
      accessibility: audits.accessibilityScore,
      security: audits.securityScore,
      createdAt: audits.createdAt,
    })
    .from(audits)
    .innerJoin(websites, eq(websites.id, audits.websiteId))
    .where(eq(audits.userId, user.userId))
    .orderBy(sql`${audits.createdAt} desc`)
    .limit(100);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Audits</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Scan history with deterministic score tracking.</p>
        </div>
        <Link href="/audits/new">
          <Button>New audit</Button>
        </Link>
      </header>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="text-xs text-[var(--muted-foreground)]">
              <tr>
                <th className="py-2">Domain</th>
                <th className="py-2">Overall</th>
                <th className="py-2">Performance</th>
                <th className="py-2">SEO</th>
                <th className="py-2">Accessibility</th>
                <th className="py-2">Security</th>
                <th className="py-2">Status</th>
                <th className="py-2">Scanned</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => (
                <tr key={row.id} className="border-t border-[var(--border-subtle)]">
                  <td className="py-2">
                    <Link href={`/audits/${row.id}`} className="hover:underline">
                      {row.domain}
                    </Link>
                  </td>
                  <td className="mono py-2">{row.overallScore ?? "—"}</td>
                  <td className="mono py-2">{row.performance ?? "—"}</td>
                  <td className="mono py-2">{row.seo ?? "—"}</td>
                  <td className="mono py-2">{row.accessibility ?? "—"}</td>
                  <td className="mono py-2">{row.security ?? "—"}</td>
                  <td className="py-2">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="py-2 text-[var(--muted-foreground)]">{formatDateTime(row.createdAt)}</td>
                </tr>
              ))}
              {!list.length ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[var(--muted-foreground)]">
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
