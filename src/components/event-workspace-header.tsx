import Link from "next/link";
import type { EventRole, EventSummary } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";
import { eventDateRange, eventPhaseLabel } from "@/lib/events/utils";
import { Badge } from "@/components/ui/badge";

const rolePaths: Record<EventRole, string> = {
  participant: "participant",
  volunteer: "volunteer",
  coordinator: "coordinator",
  principal: "principal",
};

export function EventWorkspaceHeader({
  event,
  roles,
  activeRole,
}: {
  event: Pick<EventSummary, "slug" | "title" | "starts_on" | "ends_on" | "timezone" | "venue_name"> & { status: string };
  roles: EventRole[];
  activeRole: EventRole;
}) {
  const phase = eventPhaseLabel(event.starts_on, event.ends_on, event.timezone);
  return (
    <div className="border-b border-[var(--border)] bg-white/80 backdrop-blur-md sticky top-0 z-20">
      <div className="page-wrap py-4.5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/events" className="text-xs font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Events</Link>
              <span className="w-px h-3 bg-[var(--border-strong)]" />
              <Link href={`/events/${event.slug}`} className="text-xs font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)]">{event.title}</Link>
              <span className="w-px h-3 bg-[var(--border-strong)]" />
              <span className="text-xs font-bold text-[var(--foreground)]">{ROLE_LABELS[activeRole]}</span>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-3">
              <h1 className="text-lg font-extrabold tracking-[-0.03em] sm:text-xl">{event.title}</h1>
              <Badge variant={phase === "Live" ? "success" : phase === "Upcoming" ? "tangerine" : "muted"}>{phase}</Badge>
            </div>
            <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">
              {eventDateRange(event.starts_on, event.ends_on, event.timezone)} · {event.venue_name}
            </p>
          </div>
          <div className="flex flex-wrap gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-1">
            {roles.map((role) => (
              <Link
                key={role}
                href={`/events/${event.slug}/${rolePaths[role]}`}
                aria-current={role === activeRole ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition ${role === activeRole ? "bg-white text-[var(--foreground)] shadow-sm" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}
              >
                {ROLE_LABELS[role]}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
