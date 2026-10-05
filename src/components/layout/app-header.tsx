import { Bell } from "lucide-react";
import { CommandMenu } from "@/components/layout/command-menu";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function AppHeader({ userName }: { userName: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border-subtle)] bg-[color:var(--background)/0.92] px-4 py-3 backdrop-blur md:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <MobileNav />
        </div>
        <div className="flex items-center gap-2">
          <CommandMenu />
          <button className="rounded-[var(--radius-sm)] border border-[var(--border)] p-2" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </button>
          <ThemeToggle />
          <p className="hidden text-sm text-[var(--muted-foreground)] md:block">{userName}</p>
        </div>
      </div>
    </header>
  );
}
