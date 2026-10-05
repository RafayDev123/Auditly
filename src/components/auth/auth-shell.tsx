import type { ReactNode } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";

export function AuthShell({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Link href="/" className="text-sm font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          ← Back to Auditly
        </Link>
        <Card className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">{description}</p>
          </div>
          {children}
        </Card>
      </div>
    </main>
  );
}
