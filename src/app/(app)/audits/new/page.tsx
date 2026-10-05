import { NewAuditForm } from "@/components/audit/new-audit-form";

export default function NewAuditPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Which website should we audit?</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Start with a public URL. We apply secure validation before scanning.</p>
      </header>
      <NewAuditForm />
    </div>
  );
}
