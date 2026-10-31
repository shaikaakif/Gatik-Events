import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, ClipboardCheck, DoorOpen, ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/events/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDate, formatTime, sentenceCase } from "@/lib/utils";
import type { Room, ScheduleItem } from "@/lib/types";
import { PageHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/card";

export const metadata: Metadata = { title: "Volunteer overview" };

export default async function VolunteerOverviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { viewer, event } = await requireRole(slug, "volunteer");
  const supabase = await createSupabaseServerClient();

  const { data: assignmentRows } = await supabase
    .from("volunteer_assignments")
    .select("room_id")
    .eq("event_id", event.id)
    .eq("user_id", viewer.id)
    .eq("status", "active");
  const roomIds = (assignmentRows ?? []).map((row) => row.room_id as string);
  const [{ data: roomRows }, { data: scheduleRows }] = await Promise.all([
    roomIds.length
      ? supabase.from("rooms").select("*").in("id", roomIds).order("sort_order")
      : Promise.resolve({ data: [] }),
    supabase
      .from("schedule_items")
      .select("*")
      .eq("event_id", event.id)
      .eq("is_published", true)
      .order("day_date")
      .order("sequence")
      .limit(3),
  ]);
  const rooms = (roomRows ?? []) as Room[];
  const schedule = (scheduleRows ?? []) as ScheduleItem[];

  const { data: teamLinks } = roomIds.length
    ? await supabase.from("room_assignments").select("team_id, room_id").in("room_id", roomIds)
    : { data: [] };
  const teamIds = (teamLinks ?? []).map((row) => row.team_id as string);
  const { data: memberRows } = teamIds.length
    ? await supabase.from("team_members").select("team_id, user_id").in("team_id", teamIds)
    : { data: [] };
  const { data: checkInRows } = roomIds.length
    ? await supabase.from("check_ins").select("room_id, status").eq("event_id", event.id).in("room_id", roomIds)
    : { data: [] };

  const teamsByRoom = new Map<string, number>();
  for (const link of teamLinks ?? []) {
    teamsByRoom.set(link.room_id, (teamsByRoom.get(link.room_id) ?? 0) + 1);
  }
  const participantsByTeam = new Map<string, number>();
  for (const member of memberRows ?? []) {
    participantsByTeam.set(member.team_id, (participantsByTeam.get(member.team_id) ?? 0) + 1);
  }
  const participantsByRoom = new Map<string, number>();
  for (const link of teamLinks ?? []) {
    participantsByRoom.set(link.room_id, (participantsByRoom.get(link.room_id) ?? 0) + (participantsByTeam.get(link.team_id) ?? 0));
  }
  const verifiedByRoom = new Map<string, number>();
  let flagged = 0;
  for (const checkIn of checkInRows ?? []) {
    if (checkIn.status === "verified") {
      verifiedByRoom.set(checkIn.room_id, (verifiedByRoom.get(checkIn.room_id) ?? 0) + 1);
    } else if (checkIn.status !== "duplicate") {
      flagged += 1;
    }
  }

  const totalParticipants = participantsByRoom.size
    ? Array.from(participantsByRoom.values()).reduce((sum, count) => sum + count, 0)
    : 0;
  const totalVerified = Array.from(verifiedByRoom.values()).reduce((sum, count) => sum + count, 0);
  const activeRooms = rooms.filter((room) => room.status === "active").length;

  return (
    <>
      <PageHeader
        eyebrow="Volunteer workspace"
        title={`Room control, ${(viewer.profile?.full_name ?? "volunteer").split(" ")[0]}.`}
        description="Only rooms assigned to your account appear here. Every verification is server-authorized and audited."
        action={<Badge variant={roomIds.length ? "violet" : "warning"}>{roomIds.length} assigned room{roomIds.length === 1 ? "" : "s"}</Badge>}
      />
      <main id="main-content" className="page-wrap py-8 sm:py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Assigned rooms" value={rooms.length} detail={`${activeRooms} active`} tone="navy" />
          <StatCard label="Participants in scope" value={totalParticipants} detail="Across assigned teams" tone="violet" />
          <StatCard label="Verified check-ins" value={totalVerified} detail="Recorded by you or a prior volunteer" tone="lime" />
          <StatCard label="Unresolved attempts" value={flagged} detail="Not counted as attendance" tone="orange" />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <section>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="eyebrow mb-2">Your rooms</p>
                <h2 className="text-2xl font-extrabold tracking-[-0.03em]">Open the room console</h2>
              </div>
              <Button asChild variant="ghost" size="sm"><Link href={`/events/${slug}/volunteer/rooms`}>All rooms</Link></Button>
            </div>
            {rooms.length === 0 ? (
              <EmptyState
                className="mt-4"
                icon={<DoorOpen className="h-5 w-5" />}
                title="No room assigned yet"
                description="The event principal assigns one volunteer to each operating room. Your console will appear as soon as the assignment is active."
              />
            ) : (
              <div className="mt-4 space-y-3">
                {rooms.map((room) => (
                  <article key={room.id} className="surface-card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-extrabold tracking-[-0.02em]">{room.name}</h3>
                          <Badge variant={room.status === "active" ? "success" : room.status === "issue" ? "danger" : "neutral"}>
                            {sentenceCase(room.status)}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                          {room.code}{room.location ? ` · ${room.location}` : " · Location to be confirmed"}
                        </p>
                      </div>
                      <Button asChild size="sm"><Link href={`/events/${slug}/volunteer/rooms/${room.id}`}>Open console <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></Link></Button>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-4 text-xs">
                      <div>
                        <p className="font-extrabold text-[var(--foreground)]">{teamsByRoom.get(room.id) ?? 0}</p>
                        <p className="text-[var(--muted-foreground)]">Teams</p>
                      </div>
                      <div>
                        <p className="font-extrabold text-[var(--foreground)]">{participantsByRoom.get(room.id) ?? 0}</p>
                        <p className="text-[var(--muted-foreground)]">Participants</p>
                      </div>
                      <div>
                        <p className="font-extrabold text-[var(--success)]">{verifiedByRoom.get(room.id) ?? 0}</p>
                        <p className="text-[var(--muted-foreground)]">Verified</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-5">
            <section className="surface-card p-5">
              <div className="flex items-center gap-2">
                <CalendarDays aria-hidden="true" className="h-4 w-4 text-[var(--event-violet-strong)]" />
                <h2 className="text-sm font-extrabold">Next on the schedule</h2>
              </div>
              {schedule.length > 0 ? (
                <ol className="mt-4 space-y-3">
                  {schedule.map((item) => (
                    <li key={item.id} className="border-t border-[var(--border)] pt-3 first:border-0 first:pt-0">
                      <p className="text-xs font-extrabold text-[var(--event-violet-strong)]">
                        {item.time_label ?? (item.starts_at ? formatTime(item.starts_at, event.timezone) : "Time to be confirmed")}
                      </p>
                      <p className="mt-0.5 text-sm font-bold">{item.title}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{formatDate(item.day_date)}{item.location ? ` · ${item.location}` : ""}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-3 text-sm text-[var(--muted-foreground)]">The official schedule has not been published yet.</p>
              )}
              <Button asChild variant="ghost" size="sm" className="mt-4"><Link href={`/events/${slug}/volunteer/schedule`}>Full schedule</Link></Button>
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="flex items-center gap-2">
                <ClipboardCheck aria-hidden="true" className="h-4 w-4 text-[var(--event-violet-strong)]" />
                <h2 className="text-sm font-extrabold">Check-in discipline</h2>
              </div>
              <ul className="mt-3 space-y-2 text-xs leading-relaxed text-[var(--muted-foreground)]">
                <li>Verify only participants assigned to your room.</li>
                <li>A participant can be verified once per event.</li>
                <li>Record unregistered or ambiguous attempts without creating attendance.</li>
                <li>Every action is written to the event audit trail.</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck aria-hidden="true" className="h-4 w-4 text-[var(--primary)]" />
                <h2 className="text-sm font-extrabold">Scope</h2>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[var(--muted-foreground)]">
                Rooms outside your active assignment are not readable through this workspace. The database repeats
                this check for every check-in.
              </p>
            </section>
          </aside>
        </div>
      </main>
    </>
  );
}
