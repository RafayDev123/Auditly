import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auditTechnologies, audits, websites } from "@/db/schema";
import { requireUser } from "@/lib/auth/server";
import { Card } from "@/components/ui/card";

export default async function TechnologyPage() {
  const user = await requireUser();

  const rows = await db
    .select({
      id: auditTechnologies.id,
      name: auditTechnologies.name,
      category: auditTechnologies.category,
      confidence: auditTechnologies.confidence,
      domain: websites.domain,
    })
    .from(auditTechnologies)
    .innerJoin(audits, eq(audits.id, auditTechnologies.auditId))
    .innerJoin(websites, eq(websites.id, audits.websiteId))
    .where(eq(audits.userId, user.userId));

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Technology stack</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Technologies detected across your audited websites.</p>
      </header>
      <Card>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((tech) => (
            <div key={tech.id} className="rounded-[var(--radius-sm)] border border-[var(--border)] p-3">
              <p className="font-medium">{tech.name}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{tech.category}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{tech.confidence} confidence · {tech.domain}</p>
            </div>
          ))}
          {!rows.length ? <p className="text-sm text-[var(--muted-foreground)]">No technology detections available yet.</p> : null}
        </div>
      </Card>
    </div>
  );
}
