"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  ["Overview", "/dashboard"],
  ["Audits", "/audits"],
  ["Websites", "/websites"],
  ["Technology", "/technology"],
  ["History", "/history"],
  ["Settings", "/settings"],
  ["Billing", "/billing"],
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-64 shrink-0 border-r border-[var(--border-subtle)] bg-[var(--surface)] p-4 lg:block">
      <p className="px-2 text-sm font-semibold">Auditly</p>
      <nav className="mt-6 space-y-1">
        {items.map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "block rounded-[var(--radius-sm)] px-3 py-2 text-sm text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]",
              pathname === href && "bg-[var(--surface-hover)] text-[var(--foreground)]",
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
