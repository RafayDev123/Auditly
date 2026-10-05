"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";

const commands = [
  ["New audit", "/audits/new"],
  ["Open dashboard", "/dashboard"],
  ["Search audits", "/audits"],
  ["Search websites", "/websites"],
  ["View history", "/history"],
  ["Open settings", "/settings"],
] as const;

export function CommandMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((v) => !v);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        className="hidden items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted-foreground)] md:inline-flex"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4" />
        Command menu
        <span className="mono text-xs">⌘K</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-start bg-black/50 p-4 pt-24" role="dialog" aria-modal="true">
          <Card className="w-full max-w-xl">
            <div className="space-y-2">
              {commands.map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="block rounded-[var(--radius-sm)] px-3 py-2 text-sm hover:bg-[var(--surface-hover)]"
                >
                  {label}
                </Link>
              ))}
              <button className="mt-2 text-xs text-[var(--muted-foreground)]" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
          </Card>
        </div>
      ) : null}
    </>
  );
}
