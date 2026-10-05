import { Card } from "@/components/ui/card";

export default function BillingPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Plan limits and upcoming invoicing controls.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <h2 className="text-lg font-semibold">Free</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">Limited audits for individuals.</p>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Pro</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">Higher limits with history and PDF reports.</p>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Agency</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">Multi-website reporting and team workflows.</p>
        </Card>
      </div>
    </div>
  );
}
