import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, GraduationCap, School, Users } from "lucide-react";
import { requireRole } from "@/lib/events/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/card";

export const metadata: Metadata = { title: "Coordinator schools" };

type AssignmentRow = { room_id: string | null };
type TeamLinkRow = { team_id: string; room_id: string };
type TeamRow = { id: string; name: string; school_id: string };
type MemberRow = { team_id: string; user_id: string };
type RegistrationRow = { user_id: string; school_id: string };
type SchoolRow = { id: string; name: string; city: string | null; state: string | null };

export default async function CoordinatorSchoolsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { viewer, event } = await requireRole(slug, "coordinator");
  const supabase = await createSupabaseServerClient();

  const { data: assignmentRows } = await supabase
    .from("coordinator_assignments")
    .select("room_id")
    .eq("event_id", event.id)
    .eq("user_id", viewer.id)
    .eq("status", "active");
  const assignments = (assignmentRows ?? []) as AssignmentRow[];
  const allRooms = assignments.some((row) => row.room_id === null);
  const scopedRoomIds = assignments
    .map((row) => row.room_id)
    .filter((id): id is string => Boolean(id));

  const { data: linkRows } = await supabase
    .from("room_assignments")
    .select("team_id, room_id")
    .eq("event_id", event.id);
  const links = ((linkRows ?? []) as TeamLinkRow[]).filter(
    (row) => allRooms || scopedRoomIds.includes(row.room_id),
  );
  const teamIds = Array.from(new Set(links.map((row) => row.team_id)));

  const { data: teamRows } = teamIds.length
    ? await supabase.from("teams").select("id, name, school_id").in("id", teamIds)
    : { data: [] as TeamRow[] };
  const teams = (teamRows ?? []) as TeamRow[];
  const teamById = new Map(teams.map((team) => [team.id, team]));
  const schoolIds = Array.from(new Set(teams.map((team) => team.school_id)));

  const { data: memberRows } = teamIds.length
    ? await supabase.from("team_members").select("team_id, user_id").in("team_id", teamIds)
    : { data: [] as MemberRow[] };
  const members = (memberRows ?? []) as MemberRow[];
  const participantIds = Array.from(new Set(members.map((member) => member.user_id)));

  const [{ data: schoolRows }, { data: registrationRows }] = await Promise.all([
    schoolIds.length
      ? await supabase.from("schools").select("id, name, city, state").in("id", schoolIds).order("name")
      : Promise.resolve({ data: [] as SchoolRow[] }),
    participantIds.length
      ? await supabase
          .from("event_registrations")
          .select("user_id, school_id")
          .eq("event_id", event.id)
          .in("user_id", participantIds)
      : Promise.resolve({ data: [] as RegistrationRow[] }),
  ]);

  const schools = (schoolRows ?? []) as SchoolRow[];
  const registrations = (registrationRows ?? []) as RegistrationRow[];
  const participantSchool = new Map(registrations.map((row) => [row.user_id, row.school_id]));

  const teamsBySchool = new Map<string, Set<string>>();
  for (const link of links) {
    const team = teamById.get(link.team_id);
    if (!team) continue;
    const set = teamsBySchool.get(team.school_id) ?? new Set<string>();
    set.add(team.id);
    teamsBySchool.set(team.school_id, set);
  }
  const participantsBySchool = new Map<string, number>();
  for (const member of members) {
    const schoolId = participantSchool.get(member.user_id);
    if (!schoolId) continue;
    participantsBySchool.set(schoolId, (participantsBySchool.get(schoolId) ?? 0) + 1);
  }

  const scopedLabel = allRooms ? "All rooms" : `${scopedRoomIds.length} room${scopedRoomIds.length === 1 ? "" : "s"}`;

  return (
    <>
      <PageHeader
        eyebrow="Coordinator workspace"
        title="Schools in scope"
        description="Every school represented by a team inside your assigned rooms. The view stops at the participant boundary."
        action={<Badge variant="violet">{schools.length} schools · {scopedLabel}</Badge>}
      />
      <main id="main-content" className="page-wrap py-8 sm:py-10">
        {schools.length === 0 ? (
          <EmptyState
            icon={<School className="h-5 w-5" />}
            title="No schools in scope"
            description="Schools appear once the principal assigns teams to your rooms. Coordinator scope does not expose event-wide schools."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {schools.map((school) => {
              const teamCount = teamsBySchool.get(school.id)?.size ?? 0;
              const participantCount = participantsBySchool.get(school.id) ?? 0;
              return (
                <article key={school.id} className="surface-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eaf0f8] text-[var(--primary)]">
                      <GraduationCap aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <Badge variant="neutral">{teamCount} team{teamCount === 1 ? "" : "s"}</Badge>
                  </div>
                  <h2 className="mt-4 text-lg font-extrabold tracking-[-0.02em]">{school.name}</h2>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {[school.city, school.state].filter(Boolean).join(", ") || "Location not recorded"}
                  </p>
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-[var(--surface-muted)] p-3 text-xs">
                    <Users aria-hidden="true" className="h-3.5 w-3.5 text-[var(--event-violet-strong)]" />
                    <span className="font-bold">{participantCount}</span>
                    <span className="text-[var(--muted-foreground)]">participant{participantCount === 1 ? "" : "s"} in your rooms</span>
                  </div>
                  <Button asChild variant="secondary" size="sm" className="mt-4 w-full">
                    <Link href={`/events/${slug}/coordinator/rooms`}>
                      View rooms <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </article>
              );
            })}
          </div>
        )}
        <p className="mt-8 max-w-2xl text-xs leading-relaxed text-[var(--muted-foreground)]">
          Counts are derived from teams and confirmed registrations visible through your active room assignment.
          They are not event-wide totals, and they do not include schools with no team in your scope.
        </p>
      </main>
    </>
  );
}
