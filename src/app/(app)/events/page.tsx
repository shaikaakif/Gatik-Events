import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, Search, Sparkles } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/env";
import { getViewer } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { eventDateRange, eventPhaseLabel, eventStatusLabel } from "@/lib/events/utils";
import type { EventRole, EventSummary } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/card";
import { SetupState } from "@/components/setup-notice";
import { SearchInput } from "@/components/ui/search-input";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "Events",
  description: "Published campus events coordinated through Gatik Events.",
};

type MembershipRow = { event_id: string; role: EventRole };

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  if (!isSupabaseConfigured()) {
    return (
      <main id="main-content" className="page-wrap py-16">
        <SetupState feature="The database-driven event directory" />
      </main>
    );
  }

  const params = await searchParams;
  const viewer = await getViewer();
  const supabase = await createSupabaseServerClient();
  const publishedStatuses = [
    "published",
    "registration_open",
    "registration_closed",
    "in_progress",
    "completed",
    "archived",
  ];

  const eventsPromise = supabase
    .from("events")
    .select("id, slug, title, category, description, poster_url, venue_name, venue_address, timezone, starts_on, ends_on, status, registration_opens_at, registration_closes_at, min_team_size, max_team_size, max_teams, capacity")
    .in("status", publishedStatuses)
    .order("starts_on", { ascending: false })
    .limit(50);

  const membershipsPromise = viewer
    ? supabase.from("event_memberships").select("event_id, role").eq("user_id", viewer.id).eq("status", "active")
    : Promise.resolve({ data: [] as MembershipRow[], error: null });

  const [eventsResult, membershipsResult] = await Promise.all([eventsPromise, membershipsPromise]);
  const events = (eventsResult.data ?? []) as EventSummary[];
  const memberships = (membershipsResult.data ?? []) as MembershipRow[];
  const rolesByEvent = new Map<string, EventRole[]>();

  for (const membership of memberships) {
    const current = rolesByEvent.get(membership.event_id) ?? [];
    if (!current.includes(membership.role)) current.push(membership.role);
    rolesByEvent.set(membership.event_id, current);
  }

  const query = (params.q ?? "").trim().toLowerCase();
  const category = params.category ?? "all";
  const filtered = events.filter((event) => {
    const matchesQuery = !query || [event.title, event.venue_name, event.description ?? ""]
      .some((value) => value.toLowerCase().includes(query));
    return matchesQuery && (category === "all" || event.category === category);
  });
  const categories = ["all", ...Array.from(new Set(events.map((event) => event.category)))];

  return (
    <>
      <main id="main-content">
        <section className="border-b-2 border-[var(--ink)] bg-[var(--sage)]">
          <div className="page-wrap py-12 sm:py-16">
            <Link href="/" className="mb-8 inline-flex min-h-11 items-center gap-2 text-xs font-extrabold underline underline-offset-4">
              <ArrowLeft aria-hidden="true" className="h-4 w-4" /> G Group of Institutions
            </Link>
            <div className="grid items-end gap-8 md:grid-cols-[1fr_auto]">
              <div>
                <p className="eyebrow">Gatik Events · Directory</p>
                <h1 className="mt-4 max-w-4xl font-display text-6xl leading-[0.86] tracking-[-0.055em] sm:text-8xl">
                  Every campus moment,
                  <em className="block font-normal text-[var(--terracotta)]">coordinated.</em>
                </h1>
                <p className="mt-7 max-w-xl text-base font-semibold leading-relaxed text-[var(--muted-foreground)] sm:text-lg">
                  Discover published institutional activities, understand what is happening, and continue into the workspace authorized for you.
                </p>
              </div>
              <div className="border-l-2 border-[var(--ink)] pl-5 font-mono text-xs font-bold uppercase tracking-[0.1em]">
                <span className="block text-4xl font-normal text-[var(--terracotta)]">{events.length.toString().padStart(2, "0")}</span>
                Published {events.length === 1 ? "event" : "events"}
              </div>
            </div>
          </div>
        </section>

        <section className="page-wrap py-10 sm:py-14">
          <form method="get" className="grid gap-4 border-b-2 border-[var(--ink)] pb-8 md:grid-cols-[minmax(0,28rem)_1fr] md:items-center">
            <SearchInput
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Search by event or venue"
              aria-label="Search events"
              className="w-full"
            />
            <div className="flex flex-wrap gap-2 md:justify-end">
              {categories.map((item) => {
                const active = category === item;
                const next = new URLSearchParams({
                  ...(query ? { q: params.q ?? "" } : {}),
                  ...(item !== "all" ? { category: item } : {}),
                });
                return (
                  <Link
                    key={item}
                    href={`/events?${next.toString()}`}
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex min-h-11 items-center border-2 px-4 text-xs font-extrabold uppercase tracking-[0.08em] transition ${active ? "border-[var(--ink)] bg-[var(--mustard)] shadow-[3px_3px_0_var(--ink)]" : "border-[var(--border-strong)] bg-[var(--surface)] hover:border-[var(--ink)]"}`}
                  >
                    {item === "all" ? "All events" : item.replaceAll("_", " ")}
                  </Link>
                );
              })}
              <button type="submit" className="sr-only">Search</button>
            </div>
          </form>

          {filtered.length > 0 ? (
            <div className="mt-10 grid gap-7 lg:grid-cols-2">
              {filtered.map((event, index) => {
                const roles = rolesByEvent.get(event.id) ?? [];
                const phase = eventPhaseLabel(event.starts_on, event.ends_on, event.timezone);
                return (
                  <article key={event.id} className="group grid min-h-[28rem] border-2 border-[var(--ink)] bg-[var(--surface)] shadow-[5px_5px_0_var(--ink)] sm:grid-cols-[0.34fr_0.66fr]">
                    <div className="flex flex-col justify-between border-b-2 border-[var(--ink)] bg-[var(--terracotta)] p-5 text-[var(--paper)] sm:border-b-0 sm:border-r-2">
                      <p className="font-mono text-xs font-bold tracking-[0.12em]">{String(index + 1).padStart(2, "0")}</p>
                      <p className="[writing-mode:vertical-rl] rotate-180 font-mono text-xs font-bold uppercase tracking-[0.14em]">
                        {event.category.replaceAll("_", " ")}
                      </p>
                    </div>
                    <div className="flex min-w-0 flex-col p-6 sm:p-8">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <Badge variant={phase.toLowerCase() === "completed" ? "muted" : "success"}>{phase}</Badge>
                        <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
                          {eventStatusLabel(event.status)}
                        </span>
                      </div>
                      <h2 className="mt-8 font-display text-4xl leading-[0.95] tracking-[-0.035em] sm:text-5xl">{event.title}</h2>
                      <p className="mt-5 line-clamp-3 text-sm font-medium leading-relaxed text-[var(--muted-foreground)]">
                        {event.description ?? "Event details will appear when the organizer publishes them."}
                      </p>
                      <dl className="mt-8 grid gap-3 border-t border-[var(--border)] pt-5 text-xs font-bold">
                        <div className="flex items-start gap-3"><CalendarDays aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--terracotta)]" /><dd>{eventDateRange(event.starts_on, event.ends_on, event.timezone)}</dd></div>
                        <div className="flex items-start gap-3"><MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--terracotta)]" /><dd>{event.venue_name}</dd></div>
                      </dl>
                      {roles.length > 0 ? (
                        <div className="mt-5 flex flex-wrap gap-2" aria-label="Your event roles">
                          {roles.map((role) => <Badge key={role} variant="surface">{ROLE_LABELS[role]}</Badge>)}
                        </div>
                      ) : null}
                      <Link href={`/events/${event.slug}`} className="mt-auto flex min-h-12 items-center justify-between border-t-2 border-[var(--ink)] pt-5 text-sm font-extrabold">
                        Explore event <ArrowRight aria-hidden="true" className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : events.length === 0 ? (
            <EmptyState className="mt-10" icon={<Sparkles className="h-5 w-5" />} title="No published events yet" description="The directory is connected, but no event is currently published." />
          ) : (
            <EmptyState className="mt-10" icon={<Search className="h-5 w-5" />} title="No matching events" description="Try another event name, venue, or category." action={<Button asChild variant="outline"><Link href="/events">Clear search</Link></Button>} />
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
