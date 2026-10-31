import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, MailCheck, ShieldAlert, Users } from "lucide-react";
import { requireViewer } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDate, isPast } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InvitationActions } from "@/components/invitations/invitation-actions";

export const metadata: Metadata = { title: "Team invitation" };

type InvitationDetails = {
  invitation_id: string;
  team_id: string;
  team_name: string;
  event_id: string;
  event_title: string;
  invitee_email: string;
  status: string;
  expires_at: string;
};

export default async function InvitationTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  await requireViewer(`/invitations/${token}`);
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("get_invitation_by_token", { p_token: token });
  const invitation = (Array.isArray(data) ? data[0] : data) as InvitationDetails | undefined;

  if (!invitation) {
    return (
      <main id="main-content" className="page-wrap py-12">
        <div className="narrow-wrap">
          <div className="surface-card p-6 sm:p-8">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--surface-peach)] text-[var(--gatik-orange-ink)]">
              <ShieldAlert aria-hidden="true" className="h-6 w-6" />
            </span>
            <h1 className="mt-5 text-2xl font-extrabold tracking-[-0.03em]">Invitation not available</h1>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
              This link is invalid, has expired, or belongs to a different account. Sign in with the account
              that received the invitation, or ask the team leader for a new one.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild><Link href="/invitations">Your invitations</Link></Button>
              <Button asChild variant="secondary"><Link href="/events">Browse events</Link></Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const expired = isPast(invitation.expires_at);
  const pending = invitation.status === "pending" && !expired;

  return (
    <main id="main-content" className="page-wrap py-12">
      <div className="narrow-wrap">
        <div className="surface-card overflow-hidden">
          <div className="relative bg-[var(--primary)] p-6 text-white sm:p-8">
            <div aria-hidden="true" className="route-mark absolute inset-0 opacity-60" />
            <div className="relative">
              <p className="text-[0.62rem] font-extrabold uppercase tracking-[0.18em] text-white/50">Gatik Events invitation</p>
              <h1 className="mt-3 font-display text-4xl leading-none sm:text-5xl">{invitation.team_name}</h1>
              <p className="mt-3 text-sm text-white/65">{invitation.event_title}</p>
              <div className="mt-5">
                <Badge variant={pending ? "lime" : "warning"}>{pending ? "Awaiting your response" : invitation.status}</Badge>
              </div>
            </div>
          </div>
          <div className="p-6 sm:p-8">
            <div className="space-y-3 text-sm text-[var(--muted-foreground)]">
              <p className="flex items-center gap-2">
                <Users aria-hidden="true" className="h-4 w-4 text-[var(--event-violet-strong)]" />
                Joining uses your existing participant registration. A confirmed registration is required.
              </p>
              <p className="flex items-center gap-2">
                <MailCheck aria-hidden="true" className="h-4 w-4 text-[var(--event-violet-strong)]" />
                This invitation is bound to <strong className="text-[var(--foreground)]">{invitation.invitee_email}</strong>.
              </p>
              <p className="flex items-center gap-2">
                <CalendarDays aria-hidden="true" className="h-4 w-4 text-[var(--event-violet-strong)]" />
                {expired ? "This invitation expired" : "Respond by"} {formatDate(invitation.expires_at)}.
              </p>
            </div>

            <div className="mt-6 border-t border-[var(--border)] pt-5">
              {pending ? (
                <InvitationActions invitationId={invitation.invitation_id} token={token} />
              ) : (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--muted-foreground)]">
                  This invitation can no longer be accepted. Ask the team leader to issue a new invitation.
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild variant="ghost" size="sm"><Link href="/invitations">All invitations</Link></Button>
              <Button asChild variant="ghost" size="sm"><Link href="/events">Events</Link></Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
