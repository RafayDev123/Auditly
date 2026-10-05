"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useState } from "react";

const items = [
  ["Dashboard", "/dashboard"],
  ["Audits", "/audits"],
  ["Websites", "/websites"],
  ["More", "/settings"],
] as const;

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="rounded-[var(--radius-sm)] border border-[var(--border)] p-2 lg:hidden"
        aria-label="Open navigation menu"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-4 w-4" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-40 bg-black/50 p-4 lg:hidden" role="dialog" aria-modal="true">
          <div className="surface mt-10 p-4">
            <p className="text-sm font-semibold">Auditly</p>
            <nav className="mt-4 space-y-1">
              {items.map(([label, href]) => (
                <Link key={href} href={href} className="block rounded px-3 py-2 text-sm hover:bg-[var(--surface-hover)]" onClick={() => setOpen(false)}>
                  {label}
                </Link>
              ))}
            </nav>
            <button type="button" className="mt-3 text-xs text-[var(--muted-foreground)]" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
