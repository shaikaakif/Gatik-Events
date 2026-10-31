import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Crown, FolderKanban, MapPin } from "lucide-react";
import { requireRole } from "@/lib/events/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Team, TeamMember } from "@/lib/types";
import { PageHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/card";

export const metadata: Metadata = { title: "Teams" };

type TeamRow = Team & { member_count: number; room_name: string | null; room_code: string | null };

export default async function PrincipalTeamsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { event } = await requireRole(slug, "principal");
  const supabase = await createSupabaseServerClient();

  const [{ data: teamRows }, { data: memberRows }, { data: assignmentRows }, { data: roomRows }] = await Promise.all([
    supabase.from("teams").select("*").eq("event_id", event.id).order("name"),
    supabase.from("team_members").select("team_id, user_id, role").eq("event_id", event.id),
    supabase.from("room_assignments").select("team_id, room_id").eq("event_id", event.id),
    supabase.from("rooms").select("id, name, code").eq("event_id", event.id),
  ]);
  const teams = (teamRows ?? []) as Team[];
  const members = (memberRows ?? []) as TeamMember[];
  const assignments = (assignmentRows ?? []) as Array<{ team_id: string; room_id: string }>;
  const rooms = (roomRows ?? []) as Array<{ id: string; name: string; code: string }>;
  const roomById = new Map(rooms.map((r) => [r.id, r]));
  const roomByTeam = new Map(assignments.map((a) => [a.team_id, roomById.get(a.room_id)]));
  const memberCountByTeam = new Map<string, number>();
  for (const m of members) memberCountByTeam.set(m.team_id, (memberCountByTeam.get(m.team_id) ?? 0) + 1);

  const teamRowsEnriched: TeamRow[] = teams.map((team) => ({
    ...team,
    member_count: memberCountByTeam.get(team.id) ?? 0,
    room_name: roomByTeam.get(team.id)?.name ?? null,
    room_code: roomByTeam.get(team.id)?.code ?? null,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Principal workspace"
        title="Teams"
        description={`All teams for ${event.title}. Room assignment is managed on the rooms page.`}
        action={<Badge variant="navy">{teams.length} team{teams.length === 1 ? "" : "s"}</Badge>}
      />
      <main id="main-content" className="page-wrap py-8 sm:py-10">
        <Link
          href={`/events/${slug}/principal`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" /> Back to overview
        </Link>

        {teams.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon={<FolderKanban className="h-5 w-5" />}
            title="No teams yet"
            description="Teams are created by participants from their team workspace. They appear here once created."
          />
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {teamRowsEnriched.map((team) => {
              const room = roomByTeam.get(team.id);
              return (
                <article key={team.id} className="surface-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                        Team {team.code}
                      </p>
                      <h3 className="mt-1 text-lg font-extrabold tracking-[-0.02em]">{team.name}</h3>
                    </div>
                    <Badge variant={team.member_count >= 2 ? "success" : "warning"}>
                      {team.member_count} members
                    </Badge>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                    <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
                    <span>{room ? `${room.name} · ${room.code}` : "Room not assigned"}</span>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <Crown aria-hidden="true" className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                    <span className="text-sm font-bold">Leader</span>
                  </div>
                  <Button asChild variant="secondary" size="sm" className="mt-4 w-full">
                    <Link href={`/events/${slug}/principal/teams/${team.id}`}>Open team</Link>
                  </Button>
                </article>
              );
            })}
          </div>
        )}
        <p className="mt-8 max-w-2xl text-xs leading-relaxed text-[var(--muted-foreground)]">
          Teams are participant-owned. The principal can assign teams to rooms and inspect rosters, but team membership
          changes remain participant actions.
        </p>
      </main>
    </>
  );
}
