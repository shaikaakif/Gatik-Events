import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock3, MapPin } from "lucide-react";
import { requireRole } from "@/lib/events/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDate, formatTime } from "@/lib/utils";
import type { ScheduleItem } from "@/lib/types";
import { PageHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/card";

export const metadata: Metadata = { title: "Schedule" };

export default async function PrincipalSchedulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { event } = await requireRole(slug, "principal");
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("schedule_items")
    .select("*")
    .eq("event_id", event.id)
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
        eyebrow="Principal workspace"
        title="Schedule"
        description={`Manage the published timeline for ${event.title} in ${event.timezone}.`}
        action={<Badge variant="navy">{items.length} item{items.length === 1 ? "" : "s"}</Badge>}
      />
      <main id="main-content" className="page-wrap py-8 sm:py-10">
        <Link
          href={`/events/${slug}/principal`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" /> Back to overview
        </Link>

        {items.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon={<CalendarDays className="h-5 w-5" />}
            title="No schedule items yet"
            description="Add schedule items below. Items are unpublished by default; publish them when ready."
          />
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
                    <Badge variant="neutral">{dayItems.length}</Badge>
                  </div>
                  <ol className="mt-5 space-y-3">
                    {dayItems.map((item) => (
                      <li key={item.id} className="surface-card grid gap-4 p-4 sm:grid-cols-[10rem_1fr] sm:p-5">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-extrabold text-[var(--event-violet-strong)]">
                            <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
                            {item.time_label ?? (item.starts_at ? formatTime(item.starts_at, event.timezone) : "TBC")}
                            {item.starts_at && item.ends_at ? ` – ${formatTime(item.ends_at, event.timezone)}` : ""}
                          </div>
                          <Badge variant={item.is_published ? "success" : "neutral"} className="mt-2">
                            {item.is_published ? "Published" : "Draft"}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm font-bold">{item.title}</p>
                          {item.description ? (
                            <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">{item.description}</p>
                          ) : null}
                          <p className="mt-2 flex items-center gap-1 text-[0.68rem] text-[var(--muted-foreground)]">
                            <MapPin aria-hidden="true" className="h-3 w-3" />
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
        <p className="mt-8 max-w-2xl text-xs leading-relaxed text-[var(--muted-foreground)]">
          Missing times and locations remain explicitly unconfirmed rather than guessed. Publish items when the official
          programme is confirmed.
        </p>
      </main>
    </>
  );
}
