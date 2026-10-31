import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Mail, Ticket, Users } from "lucide-react";
import { requireViewer } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDate, isPast } from "@/lib/utils";
import { PageHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InvitationActions } from "@/components/invitations/invitation-actions";

export const metadata: Metadata = { title: "Team invitations" };

type InvitationRow = {
  id: string;
  team_id: string;
  event_id: string;
  invitee_email: string;
  status: string;
  expires_at: string;
  created_at: string;
};
type TeamRow = { id: string; name: string; code: string; status: string };
type EventRow = { id: string; slug: string; title: string };

export default async function InvitationsPage() {
  await requireViewer("/invitations");
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("team_invitations_safe")
    .select("id, team_id, event_id, invitee_email, status, expires_at, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  const invitations = (data ?? []) as InvitationRow[];

  const teamIds = Array.from(new Set(invitations.map((row) => row.team_id)));
  const eventIds = Array.from(new Set(invitations.map((row) => row.event_id)));
  const [{ data: teamRows }, { data: eventRows }] = await Promise.all([
    teamIds.length ? supabase.from("teams").select("id, name, code, status").in("id", teamIds) : Promise.resolve({ data: [] }),
    eventIds.length ? supabase.from("events").select("id, slug, title").in("id", eventIds) : Promise.resolve({ data: [] }),
  ]);
  const teams = new Map(((teamRows ?? []) as TeamRow[]).map((team) => [team.id, team]));
  const events = new Map(((eventRows ?? []) as EventRow[]).map((event) => [event.id, event]));

  return (
    <>
      <PageHeader
        eyebrow="Your account"
        title="Team invitations"
        description="Invitations are bound to your account. Accept one to join a team; no token or code needs to be copied."
        action={<Badge variant={invitations.length ? "violet" : "neutral"}>{invitations.length} pending</Badge>}
      />
      <main id="main-content" className="page-wrap py-8 sm:py-10">
        {invitations.length === 0 ? (
          <EmptyState
            icon={<Ticket className="h-5 w-5" />}
            title="No pending invitations"
            description="When a team leader invites your account, the invitation appears here. If email is configured, you will also receive a message with a single-use link."
            action={<Button asChild variant="secondary"><Link href="/events">Browse events</Link></Button>}
          />
        ) : (
          <ul className="space-y-4">
            {invitations.map((invitation) => {
              const team = teams.get(invitation.team_id);
              const event = events.get(invitation.event_id);
              const expired = isPast(invitation.expires_at);
              return (
                <li key={invitation.id} className="surface-card p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="eyebrow mb-2">{event?.title ?? "Event invitation"}</p>
                      <h2 className="text-xl font-extrabold tracking-[-0.02em]">
                        {team?.name ?? "Team invitation"}
                      </h2>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[var(--muted-foreground)]">
                        <span className="inline-flex items-center gap-1.5"><Users aria-hidden="true" className="h-3.5 w-3.5" /> {team?.code ?? "Team"}</span>
                        <span className="inline-flex items-center gap-1.5"><Mail aria-hidden="true" className="h-3.5 w-3.5" /> {invitation.invitee_email}</span>
                        <span className="inline-flex items-center gap-1.5"><CalendarDays aria-hidden="true" className="h-3.5 w-3.5" /> Expires {formatDate(invitation.expires_at)}</span>
                      </div>
                    </div>
                    <Badge variant={expired ? "warning" : "violet"}>{expired ? "Expired — action will fail" : "Pending"}</Badge>
                  </div>
                  <div className="mt-5 border-t border-[var(--border)] pt-4">
                    {event ? (
                      <Link href={`/events/${event.slug}`} className="mb-3 inline-flex text-xs font-bold text-[var(--primary-accent)] hover:underline">
                        Open event introduction
                      </Link>
                    ) : null}
                    <InvitationActions invitationId={invitation.id} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
