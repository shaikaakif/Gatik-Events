import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, DoorOpen, Gauge, Users } from "lucide-react";
import { requireRole } from "@/lib/events/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sentenceCase } from "@/lib/utils";
import type { Room } from "@/lib/types";
import { PageHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/card";

export const metadata: Metadata = { title: "Principal overview" };



export default async function PrincipalOverviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { viewer, event } = await requireRole(slug, "principal");
  const supabase = await createSupabaseServerClient();

  const [{ data: roomData }, { data: staffData }, { data: participantData }, { data: teamData }] = await Promise.all([
    supabase.from("rooms").select("id, name, code, status, team_capacity, sort_order").eq("event_id", event.id).order("sort_order"),
    supabase.from("event_memberships").select("role, status").eq("event_id", event.id).eq("status", "active"),
    supabase.from("event_registrations").select("id").eq("event_id", event.id).eq("status", "confirmed"),
    supabase.from("teams").select("id").eq("event_id", event.id),
  ]);
  const rooms = (roomData ?? []) as Room[];
  const staff = (staffData ?? []) as Array<{ role: string; status: string }>;
  const participantCount = (participantData ?? []).length;
  const teamCount = (teamData ?? []).length;

  const roomStatus = new Map<string, { active: number; total: number }>();
  const roomTeamCount = new Map<string, number>();
  for (const room of rooms) {
    const current = roomStatus.get(room.id) ?? { active: 0, total: 0 };
    current.total += 1;
    if (room.status === "active") current.active += 1;
    roomStatus.set(room.id, current);
  }

  const volunteers = staff.filter((s) => s.role === "volunteer").length;
  const coordinators = staff.filter((s) => s.role === "coordinator").length;

  return (
    <>
      <PageHeader
        eyebrow="Principal workspace"
        title={`Event command, ${(viewer.profile?.full_name ?? "principal").split(" ")[0]}.`}
        description="Own the event: configuration, people, schedule, and operational oversight."
        action={<Badge variant="tangerine">{staff.length} staff, {teamCount} teams</Badge>}
      />
      <main id="main-content" className="page-wrap py-8 sm:py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="surface-card p-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">Event status</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.04em]">{sentenceCase(event.status)}</h2>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">{eventDateRange(event)}</p>
          </div>
          <div className="surface-card p-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">Staff</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.04em]">{staff.length}</h2>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              {volunteers} volunteer{volunteers === 1 ? "" : "s"} , {coordinators} coordinator{coordinators === 1 ? "" : "s"}
            </p>
          </div>
          <div className="surface-card p-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">Participants</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.04em]">{participantCount}</h2>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">Confirmed registrations</p>
          </div>
          <div className="surface-card p-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">Teams</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.04em]">{teamCount}</h2>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">Across {rooms.length} room{rooms.length === 1 ? "" : "s"}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <section>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="eyebrow mb-2">Room board</p>
                <h2 className="text-2xl font-extrabold tracking-[-0.03em]">Rooms in this event</h2>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/events/${slug}/principal/rooms`}>
                  Manage rooms <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
            {rooms.length === 0 ? (
              <EmptyState
                className="mt-4"
                icon={<DoorOpen className="h-5 w-5" />}
                title="No rooms yet"
                description="Create rooms from the rooms page to begin assigning teams and volunteers."
                action={<Button asChild variant="secondary" size="sm"><Link href={`/events/${slug}/principal/rooms`}>Create room</Link></Button>}
              />
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {rooms.map((room) => {
                  const count = roomTeamCount.get(room.id) ?? 0;
                  return (
                    <article key={room.id} className="surface-card p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-extrabold">{room.name}</h3>
                          <p className="text-xs text-[var(--muted-foreground)]">{room.code}</p>
                        </div>
                        <Badge variant={room.status === "active" ? "success" : room.status === "issue" ? "danger" : "neutral"}>
                          {sentenceCase(room.status)}
                        </Badge>
                      </div>
                      <p className="mt-2 text-[0.68rem] text-[var(--muted-foreground)]">
                        {room.location ?? "Location to be confirmed"}
                      </p>
                      <p className="mt-1 text-[0.68rem] text-[var(--muted-foreground)]">
                        {count} team{count === 1 ? "" : "s"} assigned
                      </p>
                      <Button asChild variant="secondary" size="sm" className="mt-3 w-full">
                        <Link href={`/events/${slug}/principal/rooms`}>Open room</Link>
                      </Button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="space-y-5">
            <section className="surface-card p-5">
              <div className="flex items-center gap-2">
                <Users aria-hidden="true" className="h-4 w-4 text-[var(--event-violet-strong)]" />
                <h2 className="text-sm font-extrabold">Staff roles</h2>
              </div>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[var(--muted-foreground)]">Principals</dt>
                  <dd className="font-bold">{staff.filter((s) => s.role === "principal").length}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[var(--muted-foreground)]">Coordinators</dt>
                  <dd className="font-bold">{coordinators}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[var(--muted-foreground)]">Volunteers</dt>
                  <dd className="font-bold">{volunteers}</dd>
                </div>
              </dl>
              <Button asChild size="sm" className="mt-4 w-full">
                <Link href={`/events/${slug}/principal/staff`}>Manage staff <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></Link>
              </Button>
            </section>

            <section className="surface-card p-5">
              <div className="flex items-center gap-2">
                <Gauge aria-hidden="true" className="h-4 w-4 text-[var(--event-violet-strong)]" />
                <h2 className="text-sm font-extrabold">Quick paths</h2>
              </div>
              <ul className="mt-3 space-y-2">
                <li>
                  <Button asChild variant="ghost" size="sm" className="w-full justify-start text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                    <Link href={`/events/${slug}/principal/settings`}>Event settings & lifecycle</Link>
                  </Button>
                </li>
                <li>
                  <Button asChild variant="ghost" size="sm" className="w-full justify-start text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                    <Link href={`/events/${slug}/principal/participants`}>Participants & teams</Link>
                  </Button>
                </li>
                <li>
                  <Button asChild variant="ghost" size="sm" className="w-full justify-start text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                    <Link href={`/events/${slug}/principal/schedule`}>Schedule</Link>
                  </Button>
                </li>
                <li>
                  <Button asChild variant="ghost" size="sm" className="w-full justify-start text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                    <Link href={`/events/${slug}/principal/challenge`}>Challenge</Link>
                  </Button>
                </li>
              </ul>
            </section>
          </aside>
        </div>
      </main>
    </>
  );
}

function eventDateRange(event: { starts_on: string; ends_on: string; timezone: string }) {
  return `${event.starts_on} - ${event.ends_on} (${event.timezone})`;
}
