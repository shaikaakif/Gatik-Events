import type { Metadata } from "next";
import Link from "next/link";
import { Gauge, Settings } from "lucide-react";
import { requireRole } from "@/lib/events/guards";
import { formatTime, toDateTimeInput } from "@/lib/utils";
import type { EventSettings } from "@/components/principal/settings-forms";
import { EventSettingsForm } from "@/components/principal/settings-forms";
import { LifecycleForm } from "@/components/principal/settings-forms";
import { PageHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Event settings" };

export default async function PrincipalSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { event } = await requireRole(slug, "principal");

  const timezone = event.timezone;
  const registrationOpensInput = event.registration_opens_at ? toDateTimeInput(event.registration_opens_at, timezone) : "";
  const registrationClosesInput = event.registration_closes_at ? toDateTimeInput(event.registration_closes_at, timezone) : "";

  return (
    <>
      <PageHeader
        eyebrow="Principal workspace"
        title="Event settings & lifecycle"
        description="Configure the event. Lifecycle status changes are validated and audited."
        action={<Badge variant="navy">{eventStatusLabel(event.status)}</Badge>}
      />
      <main id="main-content" className="page-wrap py-8 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_34rem]">
          <section className="surface-card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow mb-2">Event configuration</p>
                <h2 className="text-xl font-extrabold tracking-[-0.02em]">Settings</h2>
              </div>
              <Button asChild variant="ghost" size="sm"><Link href={`/events/${slug}`}>Back to overview</Link></Button>
            </div>
            <EventSettingsForm slug={slug} event={event as EventSettings} registrationOpensInput={registrationOpensInput} registrationClosesInput={registrationClosesInput} />
          </section>

          <aside className="space-y-4">
            <section className="surface-card p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <Settings aria-hidden="true" className="h-4 w-4 text-[var(--event-violet-strong)]" />
                <h2 className="text-sm font-extrabold">Lifecycle</h2>
              </div>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                Move the event through its lifecycle. Invalid transitions are rejected by the database and audited.
              </p>
              <LifecycleForm slug={slug} eventId={event.id} currentStatus={event.status} nextStatuses={[]} />
              <p className="mt-4 text-[0.68rem] text-[var(--muted-foreground)]">
                Current local time context: all dates are stored in {timezone}. Registration windows are validated server-side.
              </p>
            </section>

            <section className="surface-card p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <Gauge aria-hidden="true" className="h-4 w-4 text-[var(--event-violet-strong)]" />
                <h2 className="text-sm font-extrabold">Phase</h2>
              </div>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[var(--muted-foreground)]">Dates</dt>
                  <dd className="font-semibold">{event.starts_on} – {event.ends_on}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[var(--muted-foreground)]">Timezone</dt>
                  <dd className="font-semibold">{timezone}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[var(--muted-foreground)]">Registration</dt>
                  <dd className="font-semibold">
                    {formatTime(event.registration_opens_at ?? event.starts_on, timezone)} –
                    {formatTime(event.registration_closes_at ?? event.ends_on, timezone)}
                  </dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>
      </main>
    </>
  );
}

function eventStatusLabel(status: string) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
