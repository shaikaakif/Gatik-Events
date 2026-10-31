"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ClipboardCheck,
  Compass,
  FolderKanban,
  Gauge,
  KeyRound,
  Megaphone,
  School,
  ScrollText,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  Waypoints,
} from "lucide-react";
import type { EventRole } from "@/lib/types";
import { cn } from "@/lib/utils";

const items: Record<EventRole, Array<{ href: string; label: string; icon: typeof Compass; exact?: boolean }>> = {
  participant: [
    { href: "", label: "Overview", icon: Gauge, exact: true },
    { href: "/team", label: "My team", icon: Users },
    { href: "/challenge", label: "Challenge", icon: ScrollText },
    { href: "/schedule", label: "Schedule", icon: CalendarDays },
  ],
  volunteer: [
    { href: "", label: "Overview", icon: Gauge, exact: true },
    { href: "/rooms", label: "My rooms", icon: ClipboardCheck },
    { href: "/schedule", label: "Schedule", icon: CalendarDays },
  ],
  coordinator: [
    { href: "", label: "Overview", icon: Gauge, exact: true },
    { href: "/rooms", label: "Rooms", icon: Waypoints },
    { href: "/schools", label: "Schools", icon: School },
    { href: "/schedule", label: "Schedule", icon: CalendarDays },
  ],
  principal: [
    { href: "", label: "Overview", icon: Gauge, exact: true },
    { href: "/participants", label: "Participants", icon: Users },
    { href: "/teams", label: "Teams", icon: FolderKanban },
    { href: "/rooms", label: "Rooms", icon: Waypoints },
    { href: "/staff", label: "Staff", icon: ShieldCheck },
    { href: "/schedule", label: "Schedule", icon: CalendarDays },
    { href: "/announcements", label: "Announcements", icon: Megaphone },
    { href: "/challenge", label: "Challenge", icon: ScrollText },
    { href: "/audit", label: "Audit", icon: KeyRound },
    { href: "/settings", label: "Settings", icon: Settings },
  ],
};

const roleIcon: Record<EventRole, typeof Compass> = {
  participant: Compass,
  volunteer: ClipboardCheck,
  coordinator: Waypoints,
  principal: KeyRound,
};

export function WorkspaceNav({
  eventSlug,
  role,
  viewerName,
}: {
  eventSlug: string;
  role: EventRole;
  viewerName: string;
}) {
  const pathname = usePathname();
  const base = `/events/${eventSlug}/${role}`;
  const Icon = roleIcon[role];
  return (
    <nav aria-label={`${role} workspace`} className="border-b border-[var(--border)] bg-[var(--surface-muted)]">
      <div className="page-wrap flex items-center gap-1 overflow-x-auto py-2.5">
        <div className="flex items-center gap-2 px-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[var(--brand-navy)] text-white">
            <Icon aria-hidden="true" className="h-4 w-4" />
          </span>
          <span className="text-xs font-bold text-[var(--muted-foreground)] tracking-[0.1em] uppercase">{role === "principal" ? "Principal" : role.charAt(0).toUpperCase() + role.slice(1)}</span>
        </div>
        {items[role].map(({ href, label, icon: Icon, exact }) => {
          const target = `${base}${href}`;
          const active = exact ? pathname === target : pathname.startsWith(target);
          return (
            <Link
              key={target}
              href={target}
              aria-current={active ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition",
                active
                  ? "bg-white text-[var(--foreground)] shadow-sm border-transparent"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/60 border-transparent",
              )}
            >
              <Icon aria-hidden="true" className={cn("h-3.5 w-3.5", active ? "text-[var(--brand-tangerine)]" : "text-[var(--muted-foreground)]")} />
              {label}
            </Link>
          );
        })}
        <div className="h-4 w-px bg-[var(--border-strong)] mx-2" />
        <Link
          href="/profile"
          className="ml-auto hidden shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] sm:inline-flex"
        >
          <UserRound aria-hidden="true" className="h-3.5 w-3.5" />
          {viewerName.split(" ")[0]}
        </Link>
      </div>
    </nav>
  );
}
