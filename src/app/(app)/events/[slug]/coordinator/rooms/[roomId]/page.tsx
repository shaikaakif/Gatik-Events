import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  DoorOpen,
  GraduationCap,
  MapPin,
  ShieldAlert,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { requireRole } from "@/lib/events/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDateTime, sentenceCase } from "@/lib/utils";
import type { Room } from "@/lib/types";
import { PageHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/avatar";
import { EmptyState } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Coordinator room detail" };

type AssignmentRow = { room_id: string | null };
type TeamLinkRow = { team_id: string };
type TeamRow = {
  id: string;
  name: string;
  code: string;
  school_id: string;
  leader_user_id: string;
  status: string;
  description: string | null;
};
type MemberRow = { team_id: string; user_id: string; role: "leader" | "member" };
type RegistrationRow = { user_id: string; grade_year: string; roll_number: string | null; status: string };
type ProfileRow = { id: string; full_name: string; avatar_url: string | null };
type SchoolRow = { id: string; name: string; city: string | null; state: string | null };
type VolunteerRow = { user_id: string };
type CheckInRow = {
  id: string;
  status: string;
  subject_name: string | null;
  checked_in_at: string;
  participant_user_id: string | null;
};

export default async function CoordinatorRoomDetailPage({
  params,
}: {
  params: Promise<{ slug: string; roomId: string }>;
}) {
  const { slug, roomId } = await params;
  const { viewer, event } = await requireRole(slug, "coordinator");
  const supabase = await createSupabaseServerClient();

  const { data: assignmentRows } = await supabase
    .from("coordinator_assignments")
    .select("room_id")
    .eq("event_id", event.id)
    .eq("user_id", viewer.id)
    .eq("status", "active");
  const assignments = (assignmentRows ?? []) as AssignmentRow[];
  const hasScope = assignments.some((row) => row.room_id === null || row.room_id === roomId);
  if (!hasScope) notFound();

  const { data: roomData } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .eq("event_id", event.id)
    .maybeSingle();
  if (!roomData) notFound();
  const room = roomData as Room;

  const [{ data: linkRows }, { data: volunteerRows }, { data: checkInRows }] = await Promise.all([
    supabase.from("room_assignments").select("team_id").eq("room_id", room.id),
    supabase
      .from("volunteer_assignments")
      .select("user_id")
      .eq("room_id", room.id)
      .eq("status", "active"),
    supabase
      .from("check_ins")
      .select("id, status, subject_name, checked_in_at, participant_user_id")
      .eq("event_id", event.id)
      .eq("room_id", room.id)
      .order("checked_in_at", { ascending: false })
      .limit(10),
  ]);

  const teamIds = ((linkRows ?? []) as TeamLinkRow[]).map((row) => row.team_id);
  const volunteerIds = ((volunteerRows ?? []) as VolunteerRow[]).map((row) => row.user_id);
  const checkIns = (checkInRows ?? []) as CheckInRow[];

  const [{ data: teamRows }, { data: memberRows }] = await Promise.all([
    teamIds.length
      ? supabase
          .from("teams")
          .select("id, name, code, school_id, leader_user_id, status, description")
          .in("id", teamIds)
          .order("name")
      : Promise.resolve({ data: [] as TeamRow[] }),
    teamIds.length
      ? supabase.from("team_members").select("team_id, user_id, role").in("team_id", teamIds)
      : Promise.resolve({ data: [] as MemberRow[] }),
  ]);
  const teams = (teamRows ?? []) as TeamRow[];
  const members = (memberRows ?? []) as MemberRow[];
  const participantIds = Array.from(new Set(members.map((member) => member.user_id)));
  const schoolIds = Array.from(new Set(teams.map((team) => team.school_id)));

  const [{ data: registrationRows }, { data: profileRows }, { data: schoolRows }, { data: volunteerProfiles }] =
    await Promise.all([
      participantIds.length
        ? supabase
            .from("event_registrations")
            .select("user_id, grade_year, roll_number, status")
            .eq("event_id", event.id)
            .in("user_id", participantIds)
        : Promise.resolve({ data: [] as RegistrationRow[] }),
      participantIds.length
        ? supabase.from("profiles").select("id, full_name, avatar_url").in("id", participantIds)
        : Promise.resolve({ data: [] as ProfileRow[] }),
      schoolIds.length
        ? supabase.from("schools").select("id, name, city, state").in("id", schoolIds).order("name")
        : Promise.resolve({ data: [] as SchoolRow[] }),
      volunteerIds.length
        ? supabase.from("profiles").select("id, full_name, avatar_url").in("id", volunteerIds)
        : Promise.resolve({ data: [] as ProfileRow[] }),
    ]);

  const registrations = new Map(((registrationRows ?? []) as RegistrationRow[]).map((row) => [row.user_id, row]));
  const profiles = new Map(((profileRows ?? []) as ProfileRow[]).map((row) => [row.id, row]));
  const schools = new Map(((schoolRows ?? []) as SchoolRow[]).map((row) => [row.id, row]));
  const volunteers = (volunteerProfiles ?? []) as ProfileRow[];
  const membersByTeam = new Map<string, MemberRow[]>();
  for (const member of members) {
    const list = membersByTeam.get(member.team_id) ?? [];
    list.push(member);
    membersByTeam.set(member.team_id, list);
  }
  const verified = checkIns.filter((checkIn) => checkIn.status === "verified").length;
  const unresolved = checkIns.filter((checkIn) => checkIn.status !== "verified" && checkIn.status !== "duplicate").length;

  return (
    <>
      <PageHeader
        eyebrow={`Coordinator · ${room.code}`}
        title={room.name}
        description={`${room.location ?? "Location to be confirmed"} · ${teams.length} of ${room.team_capacity} team slots used`}
        action={
          <Badge variant={room.status === "active" ? "success" : room.status === "issue" ? "danger" : "neutral"}>
            {sentenceCase(room.status)}
          </Badge>
        }
      />
      <main id="main-content" className="page-wrap py-8 sm:py-10">
        <Link
          href={`/events/${slug}/coordinator/rooms`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" /> All rooms in scope
        </Link>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Teams" value={teams.length} detail={`${room.team_capacity} capacity`} tone="navy" />
          <StatCard label="Participants" value={participantIds.length} detail="Across assigned teams" tone="violet" />
          <StatCard label="Verified" value={verified} detail="Recent room records" tone="lime" />
          <StatCard label="Unresolved" value={unresolved} detail="Not counted as attendance" tone="orange" />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <section>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="eyebrow mb-2">Team drill-down</p>
                  <h2 className="text-2xl font-extrabold tracking-[-0.03em]">Teams and participants</h2>
                </div>
                <Badge variant="violet">{teams.length} in this room</Badge>
              </div>

              {teams.length === 0 ? (
                <EmptyState
                  className="mt-4"
                  icon={<Users className="h-5 w-5" />}
                  title="No teams assigned"
                  description="The event principal publishes room assignments. Teams appear here once this room has an assignment."
                />
              ) : (
                <div className="mt-4 space-y-4">
                  {teams.map((team) => {
                    const teamMembers = (membersByTeam.get(team.id) ?? []).slice().sort((a, b) => {
                      if (a.role === b.role) return 0;
                      return a.role === "leader" ? -1 : 1;
                    });
                    const school = schools.get(team.school_id);
                    return (
                      <article key={team.id} className="surface-card overflow-hidden">
                        <div className="border-b border-[var(--border)] bg-[var(--surface-muted)] p-4 sm:p-5">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                                Team {team.code}
                              </p>
                              <h3 className="mt-1 text-lg font-extrabold tracking-[-0.02em]">{team.name}</h3>
                              <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                                <GraduationCap aria-hidden="true" className="h-3.5 w-3.5" />
                                {school ? `${school.name}${school.city ? ` · ${school.city}` : ""}` : "School not available"}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge variant={team.status === "complete" ? "success" : team.status === "forming" ? "warning" : "neutral"}>
                                {sentenceCase(team.status)}
                              </Badge>
                              <Badge variant="neutral">{teamMembers.length} members</Badge>
                            </div>
                          </div>
                          {team.description ? (
                            <p className="mt-2 text-xs leading-relaxed text-[var(--muted-foreground)]">{team.description}</p>
                          ) : null}
                        </div>
                        <div className="p-4 sm:p-5">
                          {teamMembers.length === 0 ? (
                            <p className="text-sm text-[var(--muted-foreground)]">No members recorded.</p>
                          ) : (
                            <ul className="divide-y divide-[var(--border)]">
                              {teamMembers.map((member) => {
                                const profile = profiles.get(member.user_id);
                                const registration = registrations.get(member.user_id);
                                return (
                                  <li key={member.user_id} className="flex flex-wrap items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                                    <Avatar name={profile?.full_name ?? "Participant"} url={profile?.avatar_url} size="sm" />
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-bold">{profile?.full_name ?? "Participant"}</p>
                                      <p className="text-[0.68rem] text-[var(--muted-foreground)]">
                                        {registration ? `Grade ${registration.grade_year}` : "Registration not visible"}
                                        {registration?.roll_number ? ` · Roll ${registration.roll_number}` : ""}
                                      </p>
                                    </div>
                                    <div className="ml-auto">
                                      <Badge variant={member.role === "leader" ? "violet" : "neutral"}>{sentenceCase(member.role)}</Badge>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-5">
            <section className="surface-card p-5">
              <div className="flex items-center gap-2">
                <DoorOpen aria-hidden="true" className="h-4 w-4 text-[var(--event-violet-strong)]" />
                <h2 className="text-sm font-extrabold">Room state</h2>
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[var(--muted-foreground)]">Status</dt>
                  <dd><Badge variant={room.status === "active" ? "success" : room.status === "issue" ? "danger" : "neutral"}>{sentenceCase(room.status)}</Badge></dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="flex items-center gap-1.5 text-[var(--muted-foreground)]"><MapPin aria-hidden="true" className="h-3.5 w-3.5" /> Location</dt>
                  <dd className="text-right font-semibold">{room.location ?? "To be confirmed"}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[var(--muted-foreground)]">Team slots</dt>
                  <dd className="font-semibold">{teams.length} / {room.team_capacity}</dd>
                </div>
              </dl>
              {room.status_note ? (
                <p className="mt-3 rounded-xl bg-[var(--surface-muted)] p-3 text-xs leading-relaxed text-[var(--muted-foreground)]">
                  {room.status_note}
                </p>
              ) : null}
            </section>

            <section className="surface-card p-5">
              <div className="flex items-center gap-2">
                <UserRoundCheck aria-hidden="true" className="h-4 w-4 text-[var(--event-violet-strong)]" />
                <h2 className="text-sm font-extrabold">Room volunteer</h2>
              </div>
              {volunteers.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--muted-foreground)]">No active volunteer assignment for this room.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {volunteers.map((volunteer) => (
                    <li key={volunteer.id} className="flex items-center gap-3">
                      <Avatar name={volunteer.full_name} url={volunteer.avatar_url} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{volunteer.full_name}</p>
                        <p className="text-[0.68rem] text-[var(--muted-foreground)]">Volunteer · active</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-[0.68rem] leading-relaxed text-[var(--muted-foreground)]">
                The principal assigns volunteers. Coordinator scope does not grant check-in authority.
              </p>
            </section>

            <section className="surface-card p-5">
              <div className="flex items-center gap-2">
                <Clock3 aria-hidden="true" className="h-4 w-4 text-[var(--event-violet-strong)]" />
                <h2 className="text-sm font-extrabold">Recent check-ins</h2>
              </div>
              {checkIns.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--muted-foreground)]">No check-in activity recorded in this room yet.</p>
              ) : (
                <ul className="mt-4 divide-y divide-[var(--border)]">
                  {checkIns.map((checkIn) => (
                    <li key={checkIn.id} className="py-2.5 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        <Badge variant={checkIn.status === "verified" ? "success" : checkIn.status === "duplicate" ? "neutral" : "warning"}>
                          {sentenceCase(checkIn.status)}
                        </Badge>
                        <span className="truncate text-xs font-semibold">
                          {checkIn.subject_name ?? (checkIn.participant_user_id ? "Participant" : "Unnamed attempt")}
                        </span>
                      </div>
                      <p className="mt-1 text-[0.68rem] text-[var(--muted-foreground)]">{formatDateTime(checkIn.checked_in_at)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="flex items-center gap-2">
                <ShieldAlert aria-hidden="true" className="h-4 w-4 text-[var(--warning)]" />
                <h2 className="text-sm font-extrabold">Oversight only</h2>
              </div>
              <ul className="mt-3 space-y-2 text-xs leading-relaxed text-[var(--muted-foreground)]">
                <li>Coordinators read their assigned rooms and their teams.</li>
                <li>Check-in verification remains a volunteer action.</li>
                <li>Unresolved attempts are never counted as attendance.</li>
                <li>The database repeats every scope check.</li>
              </ul>
            </div>

            <Button asChild variant="ghost" size="sm" className="w-full">
              <Link href={`/events/${slug}/coordinator`}>Back to coordinator overview</Link>
            </Button>
          </aside>
        </div>

        {verified > 0 ? (
          <p className="mt-8 flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
            <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5 text-[var(--success)]" />
            {verified} recent verified record{verified === 1 ? "" : "s"} shown; this is a recent-activity view, not the room total.
          </p>
        ) : null}
      </main>
    </>
  );
}
