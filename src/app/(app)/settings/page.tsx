"use client";

import { Card } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Workspace settings.</p>
      </header>

      <Card className="space-y-3">
        <h2 className="text-base font-semibold">Shared workspace</h2>
      </Card>
    </div>
  );
}
