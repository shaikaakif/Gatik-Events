import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, DoorOpen, Gauge, ShieldCheck, Users, Waypoints } from "lucide-react";
import { requireRole } from "@/lib/events/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDateTime, sentenceCase } from "@/lib/utils";
import type { Room } from "@/lib/types";
import { PageHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/card";

export const metadata: Metadata = { title: "Coordinator overview" };

type Stats = {
  rooms: number;
  active_rooms: number;
  teams: number;
  participants: number;
  checked_in: number;
  flagged: number;
  scope: "event" | "assigned_rooms";
};
type CheckInRow = { id: string; room_id: string; status: string; subject_name: string | null; checked_in_at: string };

export default async function CoordinatorOverviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { viewer, event } = await requireRole(slug, "coordinator");
  const supabase = await createSupabaseServerClient();

  const { data: assignmentRows } = await supabase
    .from("coordinator_assignments")
    .select("room_id")
    .eq("event_id", event.id)
    .eq("user_id", viewer.id)
    .eq("status", "active");
  const allRooms = (assignmentRows ?? []).some((row) => row.room_id === null);
  const assignedRoomIds = (assignmentRows ?? [])
    .map((row) => row.room_id as string | null)
    .filter((id): id is string => Boolean(id));

  const [{ data: statsData }, { data: roomData }] = await Promise.all([
    supabase.rpc("get_event_operational_stats", { p_event_id: event.id }),
    allRooms
      ? supabase.from("rooms").select("*").eq("event_id", event.id).order("sort_order")
      : assignedRoomIds.length
        ? supabase.from("rooms").select("*").in("id", assignedRoomIds).order("sort_order")
        : Promise.resolve({ data: [] }),
  ]);
  const stats = (statsData ?? null) as Stats | null;
  const rooms = (roomData ?? []) as Room[];
  const roomIds = rooms.map((room) => room.id);
  const { data: checkInData } = roomIds.length
    ? await supabase
        .from("check_ins")
        .select("id, room_id, status, subject_name, checked_in_at")
        .eq("event_id", event.id)
        .in("room_id", roomIds)
        .order("checked_in_at", { ascending: false })
        .limit(6)
    : { data: [] };
  const checkIns = (checkInData ?? []) as CheckInRow[];
  const roomNames = new Map(rooms.map((room) => [room.id, room.name]));

  return (
    <>
      <PageHeader
        eyebrow="Coordinator workspace"
        title="Your assigned scope."
        description="A room → team → school → participant view limited by your active coordinator assignment."
        action={<Badge variant="tangerine">{allRooms ? "All rooms" : `${assignedRoomIds.length} room${assignedRoomIds.length === 1 ? "" : "s"}`}</Badge>}
      />
      <main id="main-content" className="page-wrap py-8 sm:py-10">
        {!assignmentRows || assignmentRows.length === 0 ? (
          <Alert variant="warning" title="No coordinator scope assigned" className="mb-6">
            Your coordinator role exists, but no room scope is active. Ask the event principal to assign rooms.
            Statistics and room data remain unavailable until then.
          </Alert>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Rooms in scope" value={stats?.rooms ?? rooms.length} detail={`${stats?.active_rooms ?? 0} active`} tone="navy" />
          <StatCard label="Teams" value={stats?.teams ?? 0} detail="Assigned to your rooms" tone="violet" />
          <StatCard label="Participants" value={stats?.participants ?? 0} detail="In scoped teams" tone="orange" />
          <StatCard label="Verified check-ins" value={stats?.checked_in ?? 0} detail={`${stats?.flagged ?? 0} unresolved`} tone="lime" />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <section>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="eyebrow mb-2">Drill-down</p>
                <h2 className="text-2xl font-extrabold tracking-[-0.03em]">Rooms in your scope</h2>
              </div>
              <Button asChild variant="ghost" size="sm"><Link href={`/events/${slug}/coordinator/rooms`}>All rooms</Link></Button>
            </div>
            {rooms.length === 0 ? (
              <EmptyState
                className="mt-4"
                icon={<DoorOpen className="h-5 w-5" />}
                title="No rooms available"
                description="No room scope is active for your coordinator membership. The event principal controls this assignment."
              />
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {rooms.map((room) => (
                  <article key={room.id} className="surface-card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-extrabold">{room.name}</h3>
                        <p className="text-xs text-[var(--muted-foreground)]">{room.code}{room.location ? ` · ${room.location}` : ""}</p>
                      </div>
                      <Badge variant={room.status === "active" ? "success" : room.status === "issue" ? "danger" : "neutral"}>{sentenceCase(room.status)}</Badge>
                    </div>
                    <Button asChild variant="secondary" size="sm" className="mt-4 w-full">
                      <Link href={`/events/${slug}/coordinator/rooms/${room.id}`}>Open room <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></Link>
                    </Button>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-5">
            <section className="surface-card p-5">
              <div className="flex items-center gap-2">
                <Gauge aria-hidden="true" className="h-4 w-4 text-[var(--event-violet-strong)]" />
                <h2 className="text-sm font-extrabold">Scope integrity</h2>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[var(--muted-foreground)]">
                {allRooms
                  ? "Your assignment covers every room in this event. This is an all-room scope granted by the principal."
                  : "Only the rooms listed here are readable. Teams, participants, and check-ins outside this scope are filtered by row-level security."}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge variant="navy"><ShieldCheck aria-hidden="true" className="h-3 w-3" /> RLS scoped</Badge>
                <Badge variant="navy"><Waypoints aria-hidden="true" className="h-3 w-3" /> Room to participant</Badge>
              </div>
            </section>

            <section className="surface-card p-5">
              <div className="flex items-center gap-2">
                <Users aria-hidden="true" className="h-4 w-4 text-[var(--event-violet-strong)]" />
                <h2 className="text-sm font-extrabold">Recent room activity</h2>
              </div>
              {checkIns.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--muted-foreground)]">No check-in activity in your scope yet.</p>
              ) : (
                <ul className="mt-4 divide-y divide-[var(--border)]">
                  {checkIns.map((checkIn) => (
                    <li key={checkIn.id} className="py-2.5 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        <Badge variant={checkIn.status === "verified" ? "success" : "warning"}>{sentenceCase(checkIn.status)}</Badge>
                        <span className="truncate text-xs font-semibold">{checkIn.subject_name ?? "Participant"}</span>
                      </div>
                      <p className="mt-1 text-[0.68rem] text-[var(--muted-foreground)]">
                        {roomNames.get(checkIn.room_id) ?? "Room"} · {formatDateTime(checkIn.checked_in_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </div>
      </main>
    </>
  );
}
