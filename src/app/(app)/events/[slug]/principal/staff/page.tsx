import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, UserRound, Users } from "lucide-react";
import { requireRole } from "@/lib/events/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/card";

export const metadata: Metadata = { title: "Staff" };

export default async function PrincipalStaffPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { event } = await requireRole(slug, "principal");
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("event_memberships")
    .select("user_id, role, granted_at")
    .eq("event_id", event.id)
    .eq("status", "active")
    .order("role")
    .order("granted_at");
  const memberships = (data ?? []) as Array<{ user_id: string; role: string; granted_at: string }>;
  const userIds = memberships.map((m) => m.user_id);
  const [{ data: profiles }] = await Promise.all([
    userIds.length ? supabase.from("app_users").select("id, full_name, email").in("id", userIds) : Promise.resolve({ data: [] }),
  ]);
  const profileById = new Map(((profiles ?? []) as Array<{ id: string; full_name: string | null; email: string | null }>).map((p) => [p.id, p]));

  const principals = memberships.filter((m) => m.role === "principal").length;
  const coordinators = memberships.filter((m) => m.role === "coordinator").length;
  const volunteers = memberships.filter((m) => m.role === "volunteer").length;

  return (
    <>
      <PageHeader
        eyebrow="Principal workspace"
        title="Staff"
        description={`Event-scoped staff for ${event.title}. Roles are granted by email and never shared.`}
        action={<Badge variant="violet">{memberships.length} staff members</Badge>}
      />
      <main id="main-content" className="page-wrap py-8 sm:py-10">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="surface-card p-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">Principals</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.04em]">{principals}</h2>
          </div>
          <div className="surface-card p-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">Coordinators</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.04em]">{coordinators}</h2>
          </div>
          <div className="surface-card p-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">Volunteers</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.04em]">{volunteers}</h2>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="eyebrow mb-2">Staff roster</p>
              <h2 className="text-xl font-extrabold tracking-[-0.02em]">Granted roles</h2>
            </div>
            <Button asChild variant="secondary" size="sm">
              <Link href={`/events/${slug}/principal/staff/grant`}>Grant role <Users aria-hidden="true" className="h-3.5 w-3.5 ml-1" /></Link>
            </Button>
          </div>
          {memberships.length === 0 ? (
            <EmptyState
              className="mt-4"
              icon={<ShieldCheck className="h-5 w-5" />}
              title="No staff assigned yet"
              description="Grant roles by email from the staff page. Each role is event-scoped and audited."
            />
          ) : (
            <div className="mt-4 divide-y divide-[var(--border)]">
              {memberships.map((membership) => {
                const profile = profileById.get(membership.user_id);
                return (
                  <div key={membership.user_id} className="flex items-center justify-between gap-4 py-4">
                    <div className="flex items-center gap-3">
                      <UserRound className="h-5 w-5 text-[var(--muted-foreground)]" />
                      <div>
                        <p className="text-sm font-bold">{profile?.full_name ?? "Unnamed profile"}</p>
                        <p className="text-[0.68rem] text-[var(--muted-foreground)]">{profile?.email ?? "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="violet">{membership.role}</Badge>
                      <span className="text-[0.68rem] text-[var(--muted-foreground)]">since {new Date(membership.granted_at).toLocaleDateString("en-IN")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <p className="mt-8 max-w-2xl text-xs leading-relaxed text-[var(--muted-foreground)]">
          Staff roles are event-scoped only. Granting a role creates a membership; it does not grant cross-event
          permissions. Role changes are recorded in the audit trail.
        </p>
      </main>
    </>
  );
}
