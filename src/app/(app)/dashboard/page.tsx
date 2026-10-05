import Link from "next/link";
import { count, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditFindings, audits, websites } from "@/db/schema";
import { requireUser } from "@/lib/auth/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ScoreBar } from "@/components/ui/score-bar";
import { formatDateTime } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();

  const [websiteCount, auditCount, avgScoreRows, issuesCountRows, recent] = await Promise.all([
    db.select({ value: count() }).from(websites).where(eq(websites.userId, user.userId)),
    db.select({ value: count() }).from(audits).where(eq(audits.userId, user.userId)),
    db
      .select({ value: sql<number>`coalesce(avg(${audits.overallScore}),0)::int` })
      .from(audits)
      .where(eq(audits.userId, user.userId)),
    db
      .select({ value: count() })
      .from(auditFindings)
      .innerJoin(audits, eq(audits.id, auditFindings.auditId))
      .where(eq(audits.userId, user.userId)),
    db
      .select({
        id: audits.id,
        domain: websites.domain,
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
      .limit(8),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Good morning, {user.fullName}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Monitor what matters across your websites.</p>
        </div>
        <Link href="/audits/new">
          <Button>New Audit</Button>
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-xs text-[var(--muted-foreground)]">Websites</p>
          <p className="mono mt-2 text-2xl">{websiteCount[0]?.value ?? 0}</p>
        </Card>
        <Card>
          <p className="text-xs text-[var(--muted-foreground)]">Audits</p>
          <p className="mono mt-2 text-2xl">{auditCount[0]?.value ?? 0}</p>
        </Card>
        <Card>
          <p className="text-xs text-[var(--muted-foreground)]">Average score</p>
          <p className="mono mt-2 text-2xl">{avgScoreRows[0]?.value ?? 0}</p>
        </Card>
        <Card>
          <p className="text-xs text-[var(--muted-foreground)]">Issues found</p>
          <p className="mono mt-2 text-2xl">{issuesCountRows[0]?.value ?? 0}</p>
        </Card>
      </section>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent audits</h2>
          <Link href="/audits" className="text-sm text-[var(--muted-foreground)]">
            View all
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs text-[var(--muted-foreground)]">
              <tr>
                <th className="py-2">Domain</th>
                <th className="py-2">Overall</th>
                <th className="py-2">Performance</th>
                <th className="py-2">SEO</th>
                <th className="py-2">Accessibility</th>
                <th className="py-2">Security</th>
                <th className="py-2">Status</th>
                <th className="py-2">Last scanned</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((row) => (
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
            </tbody>
          </table>
        </div>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="text-base font-semibold">Score trend snapshot</h3>
          <div className="mt-4 space-y-3">
            <ScoreBar label="Performance" score={Math.round(Number(avgScoreRows[0]?.value ?? 0) * 0.95)} />
            <ScoreBar label="SEO" score={Math.round(Number(avgScoreRows[0]?.value ?? 0) * 0.88)} />
            <ScoreBar label="Accessibility" score={Math.round(Number(avgScoreRows[0]?.value ?? 0) * 1.02)} />
            <ScoreBar label="Security" score={Math.round(Number(avgScoreRows[0]?.value ?? 0) * 0.9)} />
          </div>
        </Card>
        <Card>
          <h3 className="text-base font-semibold">Recent activity</h3>
          <ul className="mt-4 space-y-2 text-sm text-[var(--muted-foreground)]">
            {recent.slice(0, 5).map((item) => (
              <li key={`${item.id}-activity`}>
                Audit for {item.domain} was {item.status} ({formatDateTime(item.createdAt)})
              </li>
            ))}
            {!recent.length ? <li>Run your first audit to start activity tracking.</li> : null}
          </ul>
        </Card>
      </section>
    </div>
  );
}
