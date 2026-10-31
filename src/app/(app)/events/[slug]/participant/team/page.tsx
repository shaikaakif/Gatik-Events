import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Crown, Mail, MapPin, ShieldAlert, UserRound } from "lucide-react";
import { getEventBySlug, requireRole } from "@/lib/events/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { Registration, Team } from "@/lib/types";
import { PageHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/avatar";
import {
  CreateTeamForm,
  InviteTeammateForm,
  TeamActionForm,
  TeamDetailsForm,
} from "@/components/participant/team-management";

export const metadata: Metadata = { title: "My team" };

type MembershipRow = { team_id: string; role: "leader" | "member"; joined_at: string };
type MemberRow = { user_id: string; role: "leader" | "member"; joined_at: string };
type ProfileRow = { id: string; full_name: string; avatar_url: string | null };
type InvitationRow = { id: string; invitee_email: string; status: string; expires_at: string; created_at: string };
type SchoolOption = { id: string; name: string; city: string | null };
type RoomRow = { id: string; name: string; location: string | null; status: string };

export default async function ParticipantTeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ created?: string; joined?: string; left?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const { viewer, event } = await requireRole(slug, "participant");
  const eventRow = await getEventBySlug(slug);
  if (!eventRow) notFound();

  const supabase = await createSupabaseServerClient();
  const [registrationResult, membershipResult, schoolLinkResult, pendingInvitationResult] = await Promise.all([
    supabase.from("event_registrations").select("*").eq("event_id", event.id).maybeSingle(),
    supabase.from("team_members").select("team_id, role, joined_at").eq("event_id", event.id).maybeSingle(),
    supabase.from("event_schools").select("school_id").eq("event_id", event.id).in("status", ["registered", "confirmed"]),
    supabase.from("team_invitations_safe").select("id").eq("status", "pending"),
  ]);

  const registration = registrationResult.data as Registration | null;
  const membership = membershipResult.data as MembershipRow | null;
  const schoolIds = (schoolLinkResult.data ?? []).map((row) => row.school_id as string);
  const { data: schoolRows } = schoolIds.length
    ? await supabase.from("schools").select("id, name, city").in("id", schoolIds).order("name")
    : { data: [] as SchoolOption[] };
  const schools = (schoolRows ?? []) as SchoolOption[];
  const pendingInvitations = pendingInvitationResult.data?.length ?? 0;

  let team: Team | null = null;
  let members: MemberRow[] = [];
  let profiles = new Map<string, ProfileRow>();
  let invitations: InvitationRow[] = [];
  let room: RoomRow | null = null;

  if (membership) {
    const { data: teamData } = await supabase.from("teams").select("*").eq("id", membership.team_id).maybeSingle();
    team = teamData as Team | null;
    if (team) {
      const [memberResult, profileResult, invitationResult, roomAssignmentResult] = await Promise.all([
        supabase.from("team_members").select("user_id, role, joined_at").eq("team_id", team.id).order("joined_at"),
        supabase.from("profiles").select("id, full_name, avatar_url").in(
          "id",
          (await supabase.from("team_members").select("user_id").eq("team_id", team.id)).data?.map((row) => row.user_id) ?? [viewer.id],
        ),
        supabase
          .from("team_invitations_safe")
          .select("id, invitee_email, status, expires_at, created_at")
          .eq("team_id", team.id)
          .eq("status", "pending")
          .order("created_at", { ascending: false }),
        supabase.from("room_assignments").select("room_id").eq("team_id", team.id).maybeSingle(),
      ]);
      members = (memberResult.data ?? []) as MemberRow[];
      profiles = new Map(((profileResult.data ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]));
      invitations = (invitationResult.data ?? []) as InvitationRow[];
      if (roomAssignmentResult.data?.room_id) {
        const { data: roomData } = await supabase
          .from("rooms")
          .select("id, name, location, status")
          .eq("id", roomAssignmentResult.data.room_id)
          .maybeSingle();
        room = roomData as RoomRow | null;
      }
    }
  }

  const isLeader = membership?.role === "leader" && team?.leader_user_id === viewer.id;
  const defaultSchoolId = registration?.school_id ?? schools[0]?.id;

  return (
    <>
      <PageHeader
        eyebrow="Participant workspace"
        title="My team"
        description="One team per participant per event. Leadership, invitations, and room placement are recorded server-side."
        action={
          pendingInvitations > 0 ? (
            <Button asChild variant="violet" size="sm">
              <Link href="/invitations">{pendingInvitations} pending invitation{pendingInvitations === 1 ? "" : "s"} <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></Link>
            </Button>
          ) : undefined
        }
      />
      <main id="main-content" className="page-wrap py-8 sm:py-10">
        {query.created ? <Alert variant="success" title="Team created" className="mb-5">You are the team leader. Invite teammates to reach the minimum team size.</Alert> : null}
        {query.joined ? <Alert variant="success" title="Team joined" className="mb-5">Your membership is recorded for this event.</Alert> : null}
        {query.left ? <Alert variant="info" title="You left the team" className="mb-5">You can create a new team or accept another invitation while team changes remain open.</Alert> : null}

        {!registration ? (
          <div className="surface-card p-6">
            <h2 className="text-lg font-extrabold">Register before forming a team</h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              A confirmed registration is required for every team member. No exception is made through the interface.
            </p>
            <Button asChild className="mt-5">
              <Link href={`/events/${slug}/participant/register`}>Complete registration</Link>
            </Button>
          </div>
        ) : !team ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
            <section className="surface-card p-5 sm:p-6">
              <p className="eyebrow mb-3">No team yet</p>
              <h2 className="text-xl font-extrabold tracking-[-0.02em]">Create your team</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                You become the leader. Your team needs {event.min_team_size}–{event.max_team_size} members to be complete.
              </p>
              <div className="mt-5">
                {schools.length > 0 ? (
                  <CreateTeamForm eventId={event.id} slug={slug} schools={schools} defaultSchoolId={defaultSchoolId} />
                ) : (
                  <Alert variant="warning" title="No schools are available">
                    The event principal must register your school for this event before a team can be created.
                  </Alert>
                )}
              </div>
            </section>
            <aside className="space-y-4">
              <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
                <p className="eyebrow mb-3">Join instead</p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  If a team leader has invited you, review the invitation in your account. Invitations are
                  account-bound and cannot be forwarded.
                </p>
                <Button asChild variant="secondary" size="sm" className="mt-4 w-full">
                  <Link href="/invitations"><Mail aria-hidden="true" className="h-3.5 w-3.5" /> Review invitations</Link>
                </Button>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
                <p className="eyebrow mb-3">Event team rules</p>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3"><dt className="text-[var(--muted-foreground)]">Minimum</dt><dd className="font-bold">{event.min_team_size}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-[var(--muted-foreground)]">Maximum</dt><dd className="font-bold">{event.max_team_size}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-[var(--muted-foreground)]">Teams per event</dt><dd className="font-bold">{event.max_teams ?? "No cap"}</dd></div>
                </dl>
              </div>
            </aside>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <section className="surface-card overflow-hidden">
                <div className="relative bg-[var(--primary)] p-5 text-white sm:p-6">
                  <div aria-hidden="true" className="route-mark absolute inset-0 opacity-60" />
                  <div className="relative flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[0.6rem] font-extrabold uppercase tracking-[0.18em] text-white/45">Team code · {team.code}</p>
                      <h2 className="mt-2 font-display text-4xl leading-none">{team.name}</h2>
                      <p className="mt-2 text-sm text-white/60">{team.description ?? "No team description yet."}</p>
                    </div>
                    <Badge variant={team.status === "complete" ? "success" : team.status === "forming" ? "warning" : "neutral"}>
                      {team.status}
                    </Badge>
                  </div>
                </div>
                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-sm font-extrabold">Members · {members.length}/{event.max_team_size}</h3>
                    {room ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--muted-foreground)]">
                        <MapPin aria-hidden="true" className="h-3.5 w-3.5" /> {room.name}{room.location ? ` · ${room.location}` : ""}
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--muted-foreground)]">Room not assigned</span>
                    )}
                  </div>
                  <ul className="mt-4 divide-y divide-[var(--border)]">
                    {members.map((member) => {
                      const profile = profiles.get(member.user_id);
                      const memberIsSelf = member.user_id === viewer.id;
                      return (
                        <li key={member.user_id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                          <Avatar name={profile?.full_name ?? "Team member"} url={profile?.avatar_url} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold">
                              {profile?.full_name ?? "Team member"}
                              {memberIsSelf ? <span className="ml-1.5 text-xs font-normal text-[var(--muted-foreground)]">(you)</span> : null}
                            </p>
                            <p className="text-[0.68rem] text-[var(--muted-foreground)]">Joined {formatDate(member.joined_at)}</p>
                          </div>
                          <div className="ml-auto flex flex-wrap items-center gap-1.5">
                            {member.role === "leader" ? <Badge variant="violet"><Crown aria-hidden="true" className="h-3 w-3" /> Leader</Badge> : <Badge>Member</Badge>}
                            {isLeader && !memberIsSelf ? (
                              <>
                                <TeamActionForm
                                  kind="transfer"
                                  slug={slug}
                                  teamId={team.id}
                                  userId={member.user_id}
                                  label="Make leader"
                                  pendingLabel="Transferring…"
                                  variant="outline"
                                  confirmMessage={`Make ${profile?.full_name ?? "this member"} the team leader? You will become a regular member.`}
                                />
                                <TeamActionForm
                                  kind="remove"
                                  slug={slug}
                                  teamId={team.id}
                                  userId={member.user_id}
                                  label="Remove"
                                  pendingLabel="Removing…"
                                  variant="ghost"
                                  confirmMessage={`Remove ${profile?.full_name ?? "this member"} from the team?`}
                                />
                              </>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-4">
                    {isLeader ? (
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {members.length < event.min_team_size
                          ? `Invite ${event.min_team_size - members.length} more member${event.min_team_size - members.length === 1 ? "" : "s"} to complete the team.`
                          : members.length >= event.max_team_size
                            ? "Team is at maximum size."
                            : "Team is complete. You can still invite members up to the maximum."}
                      </p>
                    ) : (
                      <p className="text-xs text-[var(--muted-foreground)]">Only the team leader can invite or remove members.</p>
                    )}
                    <div className="ml-auto">
                      <TeamActionForm
                        kind="leave"
                        slug={slug}
                        teamId={team.id}
                        userId={viewer.id}
                        label="Leave team"
                        pendingLabel="Leaving…"
                        variant="ghost"
                        confirmMessage="Leave this team? If you are the only member, the team will be deleted."
                      />
                    </div>
                  </div>
                </div>
              </section>

              {isLeader ? (
                <section className="surface-card p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="eyebrow mb-2">Invitations</p>
                      <h2 className="text-lg font-extrabold">Grow the team</h2>
                    </div>
                    <Badge variant="violet">{invitations.length} pending</Badge>
                  </div>
                  <div className="mt-5">
                    <InviteTeammateForm slug={slug} teamId={team.id} />
                  </div>
                  {invitations.length > 0 ? (
                    <ul className="mt-6 divide-y divide-[var(--border)] border-t border-[var(--border)]">
                      {invitations.map((invitation) => (
                        <li key={invitation.id} className="flex flex-wrap items-center gap-3 py-3">
                          <Mail aria-hidden="true" className="h-4 w-4 text-[var(--muted-foreground)]" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{invitation.invitee_email}</p>
                            <p className="text-[0.68rem] text-[var(--muted-foreground)]">Expires {formatDate(invitation.expires_at)}</p>
                          </div>
                          <div className="ml-auto">
                            <TeamActionForm
                              kind="revoke"
                              slug={slug}
                              teamId={team.id}
                              invitationId={invitation.id}
                              label="Revoke"
                              pendingLabel="Revoking…"
                              variant="ghost"
                              confirmMessage="Revoke this invitation? The link will stop working."
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ) : null}

              {isLeader ? (
                <section className="surface-card p-5 sm:p-6">
                  <p className="eyebrow mb-2">Team details</p>
                  <h2 className="text-lg font-extrabold">Edit your team</h2>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    Team details can be edited while event registration is open and the team is not locked.
                  </p>
                  <div className="mt-5">
                    <TeamDetailsForm
                      slug={slug}
                      teamId={team.id}
                      name={team.name}
                      description={team.description}
                      schools={schools}
                      defaultSchoolId={team.school_id}
                    />
                  </div>
                </section>
              ) : null}
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
                <div className="flex items-center gap-2">
                  <ShieldAlert aria-hidden="true" className="h-4 w-4 text-[var(--event-violet-strong)]" />
                  <h2 className="text-sm font-extrabold">Team integrity</h2>
                </div>
                <ul className="mt-3 space-y-2 text-xs leading-relaxed text-[var(--muted-foreground)]">
                  <li>One participant can belong to only one team per event.</li>
                  <li>Every member needs a confirmed registration.</li>
                  <li>Invitations are single-use and expire after seven days.</li>
                  <li>Leadership must be transferred before a leader can leave a multi-member team.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
                <p className="eyebrow mb-3">Your role</p>
                <p className="flex items-center gap-2 text-sm font-bold">
                  <UserRound aria-hidden="true" className="h-4 w-4 text-[var(--event-violet-strong)]" />
                  {membership?.role === "leader" ? "Team leader" : "Team member"}
                </p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  The database validates this role for every invitation and team change.
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
                <p className="eyebrow mb-3">Need a different team?</p>
                <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
                  If you already joined a team, leaving is subject to the team rules above. Staff cannot bypass
                  the one-team constraint through the interface.
                </p>
              </div>
            </aside>
          </div>
        )}
      </main>
    </>
  );
}
