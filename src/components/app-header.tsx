import Link from "next/link";
import { CalendarDays, ChevronRight, CircleUserRound } from "lucide-react";
import { Logo } from "@/components/logo";
import { Avatar } from "@/components/avatar";
import { SignOutButton } from "@/components/sign-out-button";
import type { Viewer } from "@/lib/auth/guards";

export function AppHeader({ viewer }: { viewer: Viewer }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[rgba(247,248,252,0.92)] backdrop-blur-xl">
      <div className="page-wrap flex min-h-16 items-center justify-between gap-4 py-2.5">
        <div className="flex items-center gap-3">
          <Logo compact />
          <span className="hidden h-5 w-px bg-[var(--border)] sm:block" />
          <nav aria-label="Workspace" className="flex items-center gap-1 text-sm font-bold">
            <Link href="/events" className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-[var(--muted-foreground)] hover:bg-white hover:text-[var(--foreground)]">
              <CalendarDays aria-hidden="true" className="h-4 w-4" /> Events
            </Link>
            <Link href="/profile" className="hidden items-center gap-2 rounded-full px-3 py-2 text-[var(--muted-foreground)] hover:bg-white hover:text-[var(--foreground)] sm:inline-flex">
              <CircleUserRound aria-hidden="true" className="h-4 w-4" /> Profile
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/profile" className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-white py-1 pl-1 pr-3 hover:border-[var(--border-strong)]">
            <Avatar name={viewer.profile?.full_name} url={viewer.profile?.avatar_url} size="sm" />
            <span className="hidden max-w-36 truncate text-xs font-bold sm:block">
              {viewer.profile?.full_name || "Complete profile"}
            </span>
            <ChevronRight aria-hidden="true" className="h-3 w-3 text-[var(--muted-foreground)]" />
          </Link>
          <span className="hidden sm:block"><SignOutButton /></span>
          <span className="sm:hidden">
            <SignOutButton />
          </span>
        </div>
      </div>
    </header>
  );
}
