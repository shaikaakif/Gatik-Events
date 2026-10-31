import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock3, MapPin } from "lucide-react";
import { requireRole } from "@/lib/events/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDate, formatTime, sentenceCase } from "@/lib/utils";
import type { ScheduleItem } from "@/lib/types";
import { PageHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Event schedule" };

function timeRange(item: ScheduleItem, timezone: string) {
  if (item.starts_at && item.ends_at) {
    return `${formatTime(item.starts_at, timezone)} – ${formatTime(item.ends_at, timezone)}`;
  }
  if (item.starts_at) return formatTime(item.starts_at, timezone);
  return item.time_label ?? "Time to be confirmed";
}

export default async function ParticipantSchedulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { event } = await requireRole(slug, "participant");
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("schedule_items")
    .select("*")
    .eq("event_id", event.id)
    .eq("is_published", true)
    .order("day_date")
    .order("sequence");
  const items = (data ?? []) as ScheduleItem[];

  const days = new Map<string, ScheduleItem[]>();
  for (const item of items) {
    const list = days.get(item.day_date) ?? [];
    list.push(item);
    days.set(item.day_date, list);
  }

  return (
    <>
      <PageHeader
        eyebrow="Official schedule"
        title="The event timeline."
        description={`Published schedule items in ${event.timezone}. Missing times and locations remain explicitly unconfirmed rather than guessed.`}
        action={<Badge variant="navy">{items.length} {items.length === 1 ? "item" : "items"}</Badge>}
      />
      <main id="main-content" className="page-wrap py-8 sm:py-10">
        <Link href={`/events/${slug}/participant`} className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" /> Participant overview
        </Link>

        {items.length === 0 ? (
          <section className="mt-6 surface-card p-6 sm:p-8">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--surface-peach)] text-[var(--gatik-orange-ink)]">
              <CalendarDays aria-hidden="true" className="h-6 w-6" />
            </span>
            <h2 className="mt-5 text-2xl font-extrabold tracking-[-0.025em]">Schedule not published</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--muted-foreground)]">
              The official schedule has not been published for this event. Times, locations, and event-ending
              details will not be invented in the interface.
            </p>
          </section>
        ) : (
          <div className="mt-6 space-y-8">
            {Array.from(days.entries()).map(([day, dayItems]) => {
              const dayDate = new Date(`${day}T12:00:00`);
              return (
                <section key={day}>
                  <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--border)] pb-3">
                    <div>
                      <p className="eyebrow mb-1">{new Intl.DateTimeFormat("en-IN", { weekday: "long", timeZone: event.timezone }).format(dayDate)}</p>
                      <h2 className="text-xl font-extrabold tracking-[-0.02em]">{formatDate(day, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</h2>
                    </div>
                    <Badge variant="neutral">{dayItems.length} {dayItems.length === 1 ? "waypoint" : "waypoints"}</Badge>
                  </div>
                  <ol className="mt-5 space-y-3">
                    {dayItems.map((item) => (
                      <li key={item.id} className="surface-card grid gap-4 p-4 sm:grid-cols-[11rem_1fr] sm:p-5">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-extrabold text-[var(--event-violet-strong)]">
                            <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
                            {timeRange(item, event.timezone)}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <Badge variant={item.kind === "activity" ? "violet" : item.kind === "break" ? "lime" : item.kind === "ceremony" ? "orange" : "neutral"}>
                              {sentenceCase(item.kind)}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-base font-extrabold tracking-[-0.01em]">{item.title}</h3>
                          {item.description ? <p className="mt-1 text-sm leading-relaxed text-[var(--muted-foreground)]">{item.description}</p> : null}
                          <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                            <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
                            {item.location ?? "Location to be confirmed"}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              );
            })}
          </div>
        )}

        <p className="mt-10 text-xs text-[var(--muted-foreground)]">
          All times shown in {event.timezone}. The published schedule is the operational source of truth; no
          inferred closing time is added.
        </p>
      </main>
    </>
  );
}
