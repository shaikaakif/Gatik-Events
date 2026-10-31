import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { requireRole } from "@/lib/events/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { Registration } from "@/lib/types";
import { PageHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/card";

export const metadata: Metadata = { title: "Participants" };

export default async function PrincipalParticipantsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { event } = await requireRole(slug, "principal");
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("event_registrations")
    .select("id, user_id, school_id, status, grade_year, roll_number, registered_at")
    .eq("event_id", event.id)
    .eq("status", "confirmed")
    .order("registered_at", { ascending: false });
  const registrations = (data ?? []) as unknown as Registration[];

  const userIds = registrations.map((r) => r.user_id);
  const schoolIds = Array.from(new Set(registrations.map((r) => r.school_id)));
  const [{ data: profiles }, { data: schools }] = await Promise.all([
    userIds.length ? supabase.from("app_users").select("id, full_name, email").in("id", userIds) : Promise.resolve({ data: [] }),
    schoolIds.length ? supabase.from("schools").select("id, name, city").in("id", schoolIds).order("name") : Promise.resolve({ data: [] }),
  ]);
  const profileById = new Map(((profiles ?? []) as Array<{ id: string; full_name: string; email: string }>).map((p) => [p.id, p]));
  const schoolById = new Map(((schools ?? []) as Array<{ id: string; name: string; city: string | null }>).map((s) => [s.id, s]));

  return (
    <>
      <PageHeader
        eyebrow="Principal workspace"
        title="Participants"
        description={`Confirmed registrations for ${event.title}.` }
        action={<Badge variant="navy">{registrations.length} registered</Badge>}
      />
      <main id="main-content" className="page-wrap py-8 sm:py-10">
        <Link
          href={`/events/${slug}/principal`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" /> Back to overview
        </Link>

        {registrations.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon={<GraduationCap className="h-5 w-5" />}
            title="No participants yet"
            description="Participants appear here after they complete event registration. Registration requires an open registration window."
          />
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[0.65rem] font-extrabold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
                  <th className="py-3 pr-3">Participant</th>
                  <th className="py-3 pr-3">School</th>
                  <th className="py-3 pr-3">Grade / year</th>
                  <th className="py-3 pr-3">Roll number</th>
                  <th className="py-3 text-right">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {registrations.map((reg) => {
                  const profile = profileById.get(reg.user_id);
                  const school = schoolById.get(reg.school_id);
                  return (
                    <tr key={reg.id} className="align-top">
                      <td className="py-3 pr-3">
                        <p className="font-bold">{profile?.full_name ?? "Participant"}</p>
                        <p className="text-[0.68rem] text-[var(--muted-foreground)]">{profile?.email ?? "—"}</p>
                      </td>
                      <td className="py-3 pr-3 text-[0.68rem] text-[var(--muted-foreground)]">{school?.name ?? "—"}</td>
                      <td className="py-3 pr-3 font-semibold">{reg.grade_year}</td>
                      <td className="py-3 pr-3 text-[0.68rem] text-[var(--muted-foreground)]">{reg.roll_number ?? "—"}</td>
                      <td className="py-3 text-right text-[0.68rem] text-[var(--muted-foreground)]">{formatDate(reg.registered_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-8 max-w-2xl text-xs leading-relaxed text-[var(--muted-foreground)]">
          Each registration creates one participant membership for this event only. School assignments are set at registration time.
        </p>
      </main>
    </>
  );
}
