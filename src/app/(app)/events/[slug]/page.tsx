import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Clock3, MapPin, Users } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/env";
import { getViewer } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canRegister, eventDateRange, eventPhaseLabel, eventStatusLabel } from "@/lib/events/utils";
import type { EventChallenge, EventRole, EventSummary, Registration, ScheduleItem } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { SetupState } from "@/components/setup-notice";
import { formatDate, formatTime } from "@/lib/utils";

export const metadata = {
  title: "Event",
  description: "Published event information, schedule, and access through Gatik Events.",
};

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  if (!isSupabaseConfigured()) {
    return <main id="main-content" className="page-wrap py-16"><SetupState feature="Event details" /></main>;
  }

  const { slug } = await params;
  const viewer = await getViewer();
  const supabase = await createSupabaseServerClient();
  const { data: event } = await supabase.from("events").select("*").eq("slug", slug).maybeSingle();
  if (!event) notFound();
  const typedEvent = event as EventSummary;

  const schedulePromise = supabase
    .from("schedule_items")
    .select("id, day_date, starts_at, ends_at, time_label, title, description, location, kind, sequence, is_published")
    .eq("event_id", typedEvent.id)
    .eq("is_published", true)
    .order("day_date")
    .order("sequence")
    .limit(5);
  const challengePromise = supabase
    .from("event_challenges")
    .select("id, event_id, title, summary, sections, is_published, version, updated_at")
    .eq("event_id", typedEvent.id)
    .eq("is_published", true)
    .maybeSingle();
  const membershipsPromise = viewer
    ? supabase.from("event_memberships").select("role").eq("event_id", typedEvent.id).eq("user_id", viewer.id).eq("status", "active")
    : Promise.resolve({ data: [] as { role: EventRole }[], error: null });
  const registrationPromise = viewer
    ? supabase.from("event_registrations").select("*").eq("event_id", typedEvent.id).eq("user_id", viewer.id).maybeSingle()
    : Promise.resolve({ data: null as Registration | null, error: null });

  const [scheduleResult, challengeResult, membershipsResult, registrationResult] = await Promise.all([
    schedulePromise,
    challengePromise,
    membershipsPromise,
    registrationPromise,
  ]);
  const schedule = (scheduleResult.data ?? []) as ScheduleItem[];
  const challenge = challengeResult.data as EventChallenge | null;
  const roles = ((membershipsResult.data ?? []) as { role: EventRole }[]).map((row) => row.role);
  const registration = registrationResult.data as Registration | null;
  const phase = eventPhaseLabel(typedEvent.starts_on, typedEvent.ends_on, typedEvent.timezone);
  const registrationOpen = canRegister(typedEvent.status, typedEvent.registration_opens_at, typedEvent.registration_closes_at);

  const destination = viewer
    ? roles.length > 0
      ? `/events/${slug}/roles`
      : registrationOpen && !registration
        ? `/events/${slug}/participant/register`
        : `/events/${slug}/roles`
    : `/login?next=${encodeURIComponent(`/events/${slug}/roles`)}`;
  const actionLabel = !viewer
    ? "Sign in to continue"
    : roles.length > 0
      ? roles.length === 1
        ? `Continue as ${ROLE_LABELS[roles[0]]}`
        : "Choose your workspace"
      : registrationOpen && !registration
        ? "Register for this event"
        : "View access status";

  return (
    <main id="main-content">
      <section className="relative isolate overflow-hidden border-b-2 border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]">
        <div aria-hidden="true" className="absolute -right-44 -top-52 -z-10 h-[34rem] w-[34rem] rounded-full bg-[var(--terracotta)] opacity-70 blur-[100px]" />
        <div aria-hidden="true" className="route-mark absolute inset-0 -z-10 opacity-50" />
        <div className="page-wrap py-8 sm:py-14">
          <Link href="/events" className="inline-flex min-h-11 items-center gap-2 text-xs font-extrabold underline decoration-[var(--coral)] decoration-2 underline-offset-4">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" /> All events
          </Link>

          <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={phase.toLowerCase() === "completed" ? "muted" : "success"}>{phase}</Badge>
                <span className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/65">
                  {eventStatusLabel(typedEvent.status)} · {typedEvent.category.replaceAll("_", " ")}
                </span>
              </div>
              <h1 className="mt-7 max-w-5xl font-display text-6xl leading-[0.84] tracking-[-0.055em] sm:text-8xl lg:text-[7.5rem]">
                {typedEvent.title}
              </h1>
              <p className="mt-7 max-w-2xl text-base font-medium leading-relaxed text-white/75 sm:text-lg">
                {typedEvent.description ?? "The organizer has not published a detailed event description yet."}
              </p>
            </div>

            <aside className="border-2 border-white bg-[var(--paper)] p-6 text-[var(--ink)] shadow-[7px_7px_0_var(--coral)]">
              <p className="eyebrow">Continue securely</p>
              <p className="mt-4 text-sm font-semibold leading-relaxed text-[var(--muted-foreground)]">
                Your account and event membership are checked again before any workspace opens.
              </p>
              <Link href={destination} className="mt-6 flex min-h-14 items-center justify-between border-2 border-[var(--ink)] bg-[var(--coral)] px-4 text-sm font-extrabold shadow-[4px_4px_0_var(--ink)] transition active:translate-x-1 active:translate-y-1 active:shadow-none">
                {actionLabel} <ArrowRight aria-hidden="true" className="h-5 w-5" />
              </Link>
              {roles.length > 1 ? (
                <p className="mt-4 font-mono text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
                  {roles.length} authorized roles available
                </p>
              ) : null}
            </aside>
          </div>

          <dl className="mt-14 grid border-2 border-white/30 sm:grid-cols-3">
            <div className="border-b border-white/30 p-5 sm:border-b-0 sm:border-r"><dt className="flex items-center gap-2 font-mono text-[0.65rem] font-bold uppercase tracking-[0.1em] text-white/55"><CalendarDays className="h-4 w-4" /> Dates</dt><dd className="mt-2 text-sm font-bold">{eventDateRange(typedEvent.starts_on, typedEvent.ends_on, typedEvent.timezone)}</dd></div>
            <div className="border-b border-white/30 p-5 sm:border-b-0 sm:border-r"><dt className="flex items-center gap-2 font-mono text-[0.65rem] font-bold uppercase tracking-[0.1em] text-white/55"><MapPin className="h-4 w-4" /> Venue</dt><dd className="mt-2 text-sm font-bold">{typedEvent.venue_name}</dd></div>
            <div className="p-5"><dt className="flex items-center gap-2 font-mono text-[0.65rem] font-bold uppercase tracking-[0.1em] text-white/55"><Users className="h-4 w-4" /> Team rule</dt><dd className="mt-2 text-sm font-bold">{typedEvent.min_team_size}–{typedEvent.max_team_size} participants</dd></div>
          </dl>
        </div>
      </section>

      <div className="page-wrap grid gap-12 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          <section aria-labelledby="schedule-title">
            <p className="eyebrow">Published programme</p>
            <h2 id="schedule-title" className="mt-3 font-display text-5xl leading-none tracking-[-0.04em]">Schedule preview</h2>
            {schedule.length > 0 ? (
              <ol className="mt-8 border-t-2 border-[var(--ink)]">
                {schedule.map((item, index) => (
                  <li key={item.id} className="grid gap-3 border-b border-[var(--border)] py-6 sm:grid-cols-[4rem_8rem_1fr] sm:items-start">
                    <span className="font-mono text-xs font-bold text-[var(--terracotta)]">{String(index + 1).padStart(2, "0")}</span>
                    <div className="flex items-center gap-2 text-xs font-extrabold"><Clock3 aria-hidden="true" className="h-4 w-4" />{item.time_label ?? (item.starts_at ? formatTime(item.starts_at, typedEvent.timezone) : "Time TBA")}</div>
                    <div><h3 className="text-base font-extrabold">{item.title}</h3><p className="mt-1 text-xs font-medium text-[var(--muted-foreground)]">{formatDate(item.day_date)}{item.location ? ` · ${item.location}` : ""}</p></div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-8 border-2 border-dashed border-[var(--border-strong)] p-6 text-sm font-medium text-[var(--muted-foreground)]">No schedule items have been published for this event.</p>
            )}
          </section>

          {challenge ? (
            <section className="mt-14 border-l-[10px] border-[var(--mustard)] bg-[var(--sage)] p-7 sm:p-9" aria-labelledby="challenge-title">
              <p className="eyebrow">Published challenge · Version {challenge.version}</p>
              <h2 id="challenge-title" className="mt-3 font-display text-4xl leading-none">{challenge.title}</h2>
              {challenge.summary ? <p className="mt-5 max-w-2xl text-sm font-medium leading-relaxed text-[var(--muted-foreground)]">{challenge.summary}</p> : null}
            </section>
          ) : null}
        </div>

        <aside>
          <div className="sticky top-28 border-2 border-[var(--ink)] bg-[var(--surface)] p-6 shadow-[5px_5px_0_var(--ink)]">
            <p className="eyebrow">Event brief</p>
            <dl className="mt-5 divide-y divide-[var(--border)] text-sm">
              <div className="py-4 first:pt-0"><dt className="text-xs font-bold text-[var(--muted-foreground)]">Timezone</dt><dd className="mt-1 font-extrabold">{typedEvent.timezone}</dd></div>
              <div className="py-4"><dt className="text-xs font-bold text-[var(--muted-foreground)]">Registration</dt><dd className="mt-1 font-extrabold">{registrationOpen ? "Open" : "Not open"}</dd></div>
              <div className="py-4"><dt className="text-xs font-bold text-[var(--muted-foreground)]">Capacity</dt><dd className="mt-1 font-extrabold">{typedEvent.capacity ?? "Not published"}</dd></div>
              <div className="pt-4"><dt className="text-xs font-bold text-[var(--muted-foreground)]">Venue address</dt><dd className="mt-1 font-extrabold">{typedEvent.venue_address ?? "Not published"}</dd></div>
            </dl>
          </div>
        </aside>
      </div>
    </main>
  );
}
