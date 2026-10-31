import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Circle,
  ClipboardList,
  Clock3,
  MapPin,
  Megaphone,
  ScrollText,
  Ticket,
  Users,
} from "lucide-react";
import { requireRole } from "@/lib/events/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDate, formatTime } from "@/lib/utils";
import type { Announcement, Registration, ScheduleItem, Team } from "@/lib/types";
import { PageHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { StatCard } from "@/components/ui/card";

export const metadata: Metadata = { title: "Participant overview" };

type ChallengeRow = { id: string; title: string; is_published: boolean; updated_at: string };
type TeamMemberRow = { user_id: string; role: "leader" | "member" };
type RoomRow = { id: string; name: string; location: string | null; status: string };

export default async function ParticipantOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ registered?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const { viewer, event } = await requireRole(slug, "participant");
  const supabase = await createSupabaseServerClient();

  const [registrationResult, teamMemberResult, challengeResult, scheduleResult, announcementResult, invitationResult] =
    await Promise.all([
      supabase.from("event_registrations").select("*").eq("event_id", event.id).maybeSingle(),
      supabase.from("team_members").select("team_id, role").eq("event_id", event.id).maybeSingle(),
      supabase.from("event_challenges").select("id, title, is_published, updated_at").eq("event_id", event.id).maybeSingle(),
      supabase
        .from("schedule_items")
        .select("*")
        .eq("event_id", event.id)
        .eq("is_published", true)
        .order("day_date")
        .order("sequence")
        .limit(4),
      supabase
        .from("event_announcements")
        .select("*")
        .eq("event_id", event.id)
        .in("audience", ["all", "participants"])
        .order("is_pinned", { ascending: false })
        .order("published_at", { ascending: false })
        .limit(2),
      supabase.from("team_invitations_safe").select("id").eq("status", "pending"),
    ]);

  const registration = registrationResult.data as Registration | null;
  const teamMembership = teamMemberResult.data as { team_id: string; role: "leader" | "member" } | null;
  const challenge = challengeResult.data as ChallengeRow | null;
  const schedule = (scheduleResult.data ?? []) as ScheduleItem[];
  const announcements = (announcementResult.data ?? []) as Announcement[];
  const invitationCount = invitationResult.data?.length ?? 0;

  let team: Team | null = null;
  let members: TeamMemberRow[] = [];
  let room: RoomRow | null = null;
  if (teamMembership) {
    const { data } = await supabase.from("teams").select("*").eq("id", teamMembership.team_id).maybeSingle();
    team = data as Team | null;
    const { data: memberRows } = await supabase
      .from("team_members")
      .select("user_id, role")
      .eq("team_id", teamMembership.team_id);
    members = (memberRows ?? []) as TeamMemberRow[];
    if (team) {
      const { data: assignment } = await supabase
        .from("room_assignments")
        .select("room_id")
        .eq("team_id", team.id)
        .maybeSingle();
      if (assignment?.room_id) {
        const { data: roomRow } = await supabase
          .from("rooms")
          .select("id, name, location, status")
          .eq("id", assignment.room_id)
          .maybeSingle();
        room = roomRow as RoomRow | null;
      }
    }
  }

  const steps = [
    {
      label: "Registration confirmed",
      detail: registration ? "Your place is recorded." : "Complete event registration.",
      done: Boolean(registration),
      href: `/events/${slug}/participant/register`,
    },
    {
      label: "Team formed",
      detail: team
        ? `${team.name} · ${members.length} of ${event.max_team_size} members`
        : "Create a team or accept an invitation.",
      done: Boolean(team),
      href: `/events/${slug}/participant/team`,
    },
    {
      label: "Challenge available",
      detail: challenge?.is_published ? "The challenge is published." : "Waiting for official content.",
      done: Boolean(challenge?.is_published),
      href: `/events/${slug}/participant/challenge`,
    },
    {
      label: "Schedule published",
      detail: schedule.length > 0 ? "The official timeline is available." : "Waiting for the schedule.",
      done: schedule.length > 0,
      href: `/events/${slug}/participant/schedule`,
    },
  ];
  const completed = steps.filter((step) => step.done).length;

  return (
    <>
      <PageHeader
        eyebrow="Participant overview"
        title={`Welcome, ${(viewer.profile?.full_name ?? "participant").split(" ")[0]}.`}
        description="Your registration, team, challenge, and the official timeline — in the order they happen."
        action={
          invitationCount > 0 ? (
            <Button asChild variant="tangerine" size="sm">
              <Link href="/invitations">
                <Ticket aria-hidden="true" className="h-3.5 w-3.5" /> {invitationCount} invitation{invitationCount === 1 ? "" : "s"}
              </Link>
            </Button>
          ) : undefined
        }
      />

      <main id="main-content" className="page-wrap py-8 sm:py-10">
        {query.registered ? (
          <Alert variant="success" title="Registration confirmed" className="mb-6">
            Your participant membership is active. Next: create a team or accept an invitation.
          </Alert>
        ) : null}
        {!registration ? (
          <Alert variant="warning" title="Registration record missing" className="mb-6">
            Your participant role exists, but no registration record was found. Complete registration before
            creating a team. <Link href={`/events/${slug}/participant/register`} className="font-bold underline">Register now</Link>.
          </Alert>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Next steps complete" value={`${completed}/4`} detail="Registration to ready" tone="violet" />
          <StatCard
            label="Team"
            value={team ? `${members.length}/${event.max_team_size}` : "None"}
            detail={team ? team.name : "Not formed yet"}
            tone="navy"
          />
          <StatCard
            label="Room"
            value={room?.name ?? "Unassigned"}
            detail={room?.location ?? "The principal assigns rooms"}
            tone="lime"
          />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-8">
            <section>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="eyebrow mb-2">Your route</p>
                  <h2 className="text-2xl font-extrabold tracking-[-0.03em]">Four steps to ready</h2>
                </div>
                <Badge variant="navy">{completed} of 4</Badge>
              </div>
              <ol className="route-line mt-5 space-y-5 pl-9">
                {steps.map((step, index) => (
                  <li key={step.label} className="relative">
                    <span
                      aria-hidden="true"
                      className={`absolute -left-9 top-0.5 grid h-5 w-5 place-items-center rounded-full ${step.done ? "bg-[var(--event-violet-strong)] text-white" : "border border-[var(--border-strong)] bg-white text-[var(--muted-foreground)]"}`}
                    >
                      {step.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-2.5 w-2.5" />}
                    </span>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold">
                          {String(index + 1).padStart(2, "0")} · {step.label}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{step.detail}</p>
                      </div>
                      {!step.done ? (
                        <Link href={step.href} className="inline-flex items-center gap-1 text-xs font-bold text-[var(--event-violet-strong)] hover:underline">
                          Continue <ArrowRight aria-hidden="true" className="h-3 w-3" />
                        </Link>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="eyebrow mb-2">Next on the timeline</p>
                  <h2 className="text-2xl font-extrabold tracking-[-0.03em]">What happens next</h2>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/events/${slug}/participant/schedule`}>
                    Full schedule <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
              {schedule.length > 0 ? (
                <ol className="mt-4 space-y-2">
                  {schedule.map((item) => (
                    <li key={item.id} className="surface-card flex items-start gap-4 p-4">
                      <div className="min-w-20 text-xs font-extrabold text-[var(--event-violet-strong)]">
                        {item.time_label ?? (item.starts_at ? formatTime(item.starts_at, event.timezone) : "TBC")}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold">{item.title}</p>
                        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                          {formatDate(item.day_date)}
                          {item.location ? ` · ${item.location}` : ""}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-4 rounded-2xl border border-dashed border-[var(--border-strong)] bg-white/60 p-5 text-sm text-[var(--muted-foreground)]">
                  The official schedule has not been published yet.
                </p>
              )}
            </section>
          </div>

          <aside className="space-y-5">
            <section className="surface-card p-5">
              <div className="flex items-center gap-2">
                <Users aria-hidden="true" className="h-4 w-4 text-[var(--event-violet-strong)]" />
                <h2 className="text-sm font-extrabold">Your team</h2>
              </div>
              {team ? (
                <div className="mt-4">
                  <p className="text-lg font-extrabold">{team.name}</p>
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                    {team.code} · {members.length}/{event.max_team_size} members
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {members.map((member) => (
                      <Badge key={member.user_id} variant={member.role === "leader" ? "violet" : "neutral"}>
                        {member.role === "leader" ? "Leader" : "Member"}
                      </Badge>
                    ))}
                  </div>
                  {room ? (
                    <div className="mt-4 flex items-start gap-2 rounded-xl bg-[var(--surface-muted)] p-3 text-xs">
                      <MapPin aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--primary)]" />
                      <div>
                        <p className="font-bold">{room.name}</p>
                        <p className="text-[var(--muted-foreground)]">{room.location ?? "Location to be confirmed"}</p>
                      </div>
                    </div>
                  ) : null}
                  <Button asChild variant="secondary" size="sm" className="mt-4 w-full">
                    <Link href={`/events/${slug}/participant/team`}>Open team workspace</Link>
                  </Button>
                </div>
              ) : (
                <div className="mt-4">
                  <p className="text-sm text-[var(--muted-foreground)]">
                    You are not on a team yet. Create one as leader or accept an invitation.
                  </p>
                  <Button asChild size="sm" className="mt-4 w-full">
                    <Link href={`/events/${slug}/participant/team`}>Team workspace</Link>
                  </Button>
                </div>
              )}
            </section>

            <section className="surface-card p-5">
              <div className="flex items-center gap-2">
                <ScrollText aria-hidden="true" className="h-4 w-4 text-[var(--event-violet-strong)]" />
                <h2 className="text-sm font-extrabold">Challenge</h2>
              </div>
              <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                {challenge?.is_published
                  ? "The official challenge is published. Read it carefully before the event."
                  : "Challenge not published yet. The official problem statement has not been supplied, so no placeholder content is shown."}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Badge variant={challenge?.is_published ? "success" : "warning"}>
                  {challenge?.is_published ? "Published" : "Unpublished"}
                </Badge>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/events/${slug}/participant/challenge`}>Open challenge</Link>
                </Button>
              </div>
            </section>

            <section className="surface-card p-5">
              <p className="eyebrow mb-3">Registration</p>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <ClipboardList aria-hidden="true" className="h-4 w-4 text-[var(--muted-foreground)]" />
                  <dt className="text-[var(--muted-foreground)]">Status</dt>
                  <dd className="ml-auto font-bold">{registration?.status ?? "Not registered"}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <Clock3 aria-hidden="true" className="h-4 w-4 text-[var(--muted-foreground)]" />
                  <dt className="text-[var(--muted-foreground)]">Grade / year</dt>
                  <dd className="ml-auto font-bold">{registration?.grade_year ?? "—"}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays aria-hidden="true" className="h-4 w-4 text-[var(--muted-foreground)]" />
                  <dt className="text-[var(--muted-foreground)]">Event dates</dt>
                  <dd className="ml-auto font-bold">{formatDate(event.starts_on)} – {formatDate(event.ends_on)}</dd>
                </div>
              </dl>
            </section>

            {announcements.length > 0 ? (
              <section className="surface-card p-5">
                <div className="flex items-center gap-2">
                  <Megaphone aria-hidden="true" className="h-4 w-4 text-[var(--gatik-orange)]" />
                  <h2 className="text-sm font-extrabold">Announcements</h2>
                </div>
                <div className="mt-3 space-y-3">
                  {announcements.map((announcement) => (
                    <article key={announcement.id} className="border-t border-[var(--border)] pt-3 first:border-0 first:pt-0">
                      <p className="text-sm font-bold">{announcement.title}</p>
                      <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-[var(--muted-foreground)]">{announcement.body}</p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      </main>
    </>
  );
}
