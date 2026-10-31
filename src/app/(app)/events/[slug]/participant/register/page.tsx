import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, GraduationCap, Users } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/env";
import { requireViewer } from "@/lib/auth/guards";
import { getEventBySlug } from "@/lib/events/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canRegister, eventDateRange, eventStatusLabel } from "@/lib/events/utils";
import { PageHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { SetupState } from "@/components/setup-notice";
import { ParticipantRegistrationForm } from "@/components/participant/registration-form";

export const metadata: Metadata = { title: "Event registration" };

type SchoolRow = { id: string; name: string; city: string | null };

export default async function ParticipantRegisterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!isSupabaseConfigured()) {
    return (
      <main id="main-content" className="page-wrap py-12">
        <SetupState feature="Participant registration" />
      </main>
    );
  }

  const { slug } = await params;
  await requireViewer(`/events/${slug}/participant/register`);
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("event_registrations")
    .select("id")
    .eq("event_id", event.id)
    .maybeSingle();
  if (existing) redirect(`/events/${slug}/participant`);

  const registrationOpen = canRegister(event.status, event.registration_opens_at, event.registration_closes_at);
  const { data: eventSchools } = await supabase
    .from("event_schools")
    .select("school_id")
    .eq("event_id", event.id)
    .in("status", ["registered", "confirmed"]);
  const schoolIds = (eventSchools ?? []).map((row) => row.school_id as string);
  const { data: schoolRows } = schoolIds.length
    ? await supabase.from("schools").select("id, name, city").in("id", schoolIds).order("name")
    : { data: [] as SchoolRow[] };
  const schools = (schoolRows ?? []) as SchoolRow[];

  return (
    <>
      <PageHeader
        eyebrow="Participant registration"
        title="Claim your place."
        description="Registration creates your participant membership. You can then create a team or accept an invitation."
        action={<Badge variant={registrationOpen ? "success" : "warning"}>{registrationOpen ? "Open" : eventStatusLabel(event.status)}</Badge>}
      />
      <main id="main-content" className="page-wrap py-8 sm:py-10">
        <Link href={`/events/${slug}`} className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" /> Back to event
        </Link>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="surface-card p-5 sm:p-6">
            <h2 className="text-lg font-extrabold tracking-[-0.02em]">{event.title}</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {eventDateRange(event.starts_on, event.ends_on, event.timezone)} · {event.venue_name}
            </p>

            <div className="mt-5 space-y-4">
              {!registrationOpen ? (
                <Alert variant="warning" title="Registration is not open">
                  This event is currently <strong>{eventStatusLabel(event.status)}</strong>. Contact the event
                  principal if you believe you should be able to register.
                </Alert>
              ) : null}
              {registrationOpen && schools.length === 0 ? (
                <Alert variant="warning" title="No schools are registered yet">
                  The event principal must add your school to this event before participant registration
                  can open. No placeholder school will be created automatically.
                </Alert>
              ) : null}
              {registrationOpen && schools.length > 0 ? (
                <ParticipantRegistrationForm eventId={event.id} slug={slug} schools={schools} />
              ) : null}
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <p className="eyebrow mb-3">What registration does</p>
              <ul className="space-y-3 text-sm text-[var(--muted-foreground)]">
                <li className="flex gap-3">
                  <GraduationCap aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--event-violet-strong)]" />
                  Links your account to your school for this event only.
                </li>
                <li className="flex gap-3">
                  <Users aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--event-violet-strong)]" />
                  Creates your participant membership. It does not grant staff access.
                </li>
                <li className="flex gap-3">
                  <CalendarDays aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--event-violet-strong)]" />
                  Unlocks the event workspace, teams, challenge, and schedule.
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <p className="eyebrow mb-3">Team rules</p>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--muted-foreground)]">Team size</dt>
                  <dd className="font-bold">{event.min_team_size}–{event.max_team_size} participants</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--muted-foreground)]">Teams allowed</dt>
                  <dd className="font-bold">{event.max_teams ?? "No fixed cap"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--muted-foreground)]">Teams per participant</dt>
                  <dd className="font-bold">One</dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
