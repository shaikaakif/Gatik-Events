import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock3, MapPin } from "lucide-react";
import { requireRole } from "@/lib/events/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDate, formatTime, sentenceCase } from "@/lib/utils";
import type { ScheduleItem } from "@/lib/types";
import { PageHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Volunteer schedule" };

export default async function VolunteerSchedulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { event } = await requireRole(slug, "volunteer");
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("schedule_items")
    .select("*")
    .eq("event_id", event.id)
    .eq("is_published", true)
    .order("day_date")
    .order("sequence");
  const items = (data ?? []) as ScheduleItem[];

  return (
    <>
      <PageHeader
        eyebrow="Official schedule"
        title="Your operational timeline."
        description={`Published items in ${event.timezone}. Use this to know what is happening in and around your assigned room.`}
        action={<Badge variant="navy">{items.length} items</Badge>}
      />
      <main id="main-content" className="page-wrap py-8 sm:py-10">
        <Link href={`/events/${slug}/volunteer`} className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" /> Volunteer overview
        </Link>
        {items.length === 0 ? (
          <div className="mt-6 surface-card p-6">
            <CalendarDays aria-hidden="true" className="h-6 w-6 text-[var(--primary)]" />
            <h2 className="mt-4 text-xl font-extrabold">Schedule not published</h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">No schedule has been published for this event.</p>
          </div>
        ) : (
          <ol className="mt-6 space-y-3">
            {items.map((item) => (
              <li key={item.id} className="surface-card grid gap-3 p-4 sm:grid-cols-[9rem_1fr] sm:p-5">
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-extrabold text-[var(--event-violet-strong)]">
                    <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
                    {item.time_label ?? (item.starts_at ? formatTime(item.starts_at, event.timezone) : "TBC")}
                    {item.starts_at && item.ends_at ? ` – ${formatTime(item.ends_at, event.timezone)}` : ""}
                  </p>
                  <p className="mt-1 text-[0.68rem] text-[var(--muted-foreground)]">{formatDate(item.day_date)}</p>
                  <Badge variant="neutral" className="mt-2">{sentenceCase(item.kind)}</Badge>
                </div>
                <div>
                  <p className="text-sm font-bold">{item.title}</p>
                  {item.description ? <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">{item.description}</p> : null}
                  <p className="mt-2 flex items-center gap-1 text-[0.68rem] text-[var(--muted-foreground)]">
                    <MapPin aria-hidden="true" className="h-3 w-3" /> {item.location ?? "Location to be confirmed"}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </main>
    </>
  );
}
