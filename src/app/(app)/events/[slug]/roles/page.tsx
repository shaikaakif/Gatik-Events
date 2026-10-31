import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { requireViewer } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canRegister } from "@/lib/events/utils";
import type { EventRole, EventSummary, Registration } from "@/lib/types";
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/lib/types";

const roleNumbers: Record<EventRole, string> = {
  participant: "01",
  volunteer: "02",
  coordinator: "03",
  principal: "04",
};

export const metadata = { title: "Choose a role" };

export default async function RoleSelectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const viewer = await requireViewer(`/events/${slug}/roles`);
  const supabase = await createSupabaseServerClient();
  const { data: event } = await supabase.from("events").select("*").eq("slug", slug).maybeSingle();
  if (!event) notFound();
  const typedEvent = event as EventSummary;

  const [membershipsResult, registrationResult] = await Promise.all([
    supabase.from("event_memberships").select("role").eq("event_id", typedEvent.id).eq("user_id", viewer.id).eq("status", "active"),
    supabase.from("event_registrations").select("*").eq("event_id", typedEvent.id).eq("user_id", viewer.id).maybeSingle(),
  ]);
  const roles = ((membershipsResult.data ?? []) as { role: EventRole }[]).map((row) => row.role);
  const registration = registrationResult.data as Registration | null;
  const registrationOpen = canRegister(typedEvent.status, typedEvent.registration_opens_at, typedEvent.registration_closes_at);

  return (
    <main id="main-content" className="page-wrap py-10 sm:py-16">
      <Link href={`/events/${slug}`} className="inline-flex min-h-11 items-center gap-2 text-xs font-extrabold underline underline-offset-4">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Event introduction
      </Link>

      <header className="mt-8 border-b-2 border-[var(--ink)] pb-8">
        <p className="eyebrow">Authorized access · {typedEvent.title}</p>
        <h1 className="mt-4 max-w-4xl font-display text-6xl leading-[0.88] tracking-[-0.05em] sm:text-8xl">Choose your place in the event.</h1>
        <p className="mt-6 max-w-2xl text-sm font-semibold leading-relaxed text-[var(--muted-foreground)] sm:text-base">
          Only active roles assigned to your account are shown. Choosing a role never grants new authority.
        </p>
      </header>

      {roles.length > 0 ? (
        <ol className="mt-10 border-t-2 border-[var(--ink)]">
          {roles.map((role) => (
            <li key={role}>
              <Link href={`/events/${slug}/${role}`} className="group grid min-h-40 gap-5 border-b-2 border-[var(--ink)] py-7 transition-colors hover:bg-[var(--sage)] sm:grid-cols-[5rem_1fr_auto] sm:items-center sm:px-5">
                <span className="font-mono text-sm font-bold text-[var(--terracotta)]">{roleNumbers[role]}</span>
                <span>
                  <strong className="block font-display text-4xl font-normal leading-none sm:text-5xl">{ROLE_LABELS[role]}</strong>
                  <span className="mt-3 block max-w-2xl text-sm font-medium text-[var(--muted-foreground)]">{ROLE_DESCRIPTIONS[role]}</span>
                </span>
                <span className="grid h-12 w-12 place-items-center border-2 border-[var(--ink)] bg-[var(--coral)] shadow-[3px_3px_0_var(--ink)] transition-transform group-hover:translate-x-1" aria-hidden="true"><ArrowRight className="h-5 w-5" /></span>
              </Link>
            </li>
          ))}
        </ol>
      ) : registrationOpen && !registration ? (
        <section className="mt-10 border-2 border-[var(--ink)] bg-[var(--mustard)] p-7 shadow-[6px_6px_0_var(--ink)]">
          <p className="eyebrow text-[var(--ink)]">Participant registration available</p>
          <h2 className="mt-3 font-display text-4xl">Start with your registration.</h2>
          <p className="mt-3 max-w-xl text-sm font-semibold">Complete the event registration before creating or joining a team.</p>
          <Link href={`/events/${slug}/participant/register`} className="mt-6 inline-flex min-h-12 items-center gap-3 border-2 border-[var(--ink)] bg-[var(--paper)] px-5 text-sm font-extrabold shadow-[3px_3px_0_var(--ink)]">Register now <ArrowRight className="h-4 w-4" /></Link>
        </section>
      ) : (
        <section className="mt-10 border-2 border-dashed border-[var(--border-strong)] p-7">
          <h2 className="font-display text-4xl">No active workspace yet.</h2>
          <p className="mt-3 max-w-xl text-sm font-medium text-[var(--muted-foreground)]">Your account has no active event role. Contact an event principal if you believe this is incorrect.</p>
        </section>
      )}
    </main>
  );
}
