import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { requireRole } from "@/lib/events/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/card";

export const metadata: Metadata = { title: "Audit" };

type AuditRow = { id: number; action: string; entity_type: string; entity_id: string | null; metadata: Record<string, unknown>; created_at: string; actor_user_id: string | null };
type ProfileRow = { id: string; full_name: string | null };

export default async function PrincipalAuditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { event } = await requireRole(slug, "principal");
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("event_id", event.id)
    .order("created_at", { ascending: false })
    .limit(50);
  const logs = (data ?? []) as AuditRow[];
  const actorIds = Array.from(new Set(logs.map((l) => l.actor_user_id).filter(Boolean)));
  const [{ data: profiles }] = await Promise.all([
    actorIds.length ? supabase.from("profiles").select("id, full_name").in("id", actorIds) : Promise.resolve({ data: [] }),
  ]);
  const actorById = new Map(((profiles ?? []) as ProfileRow[]).map((p) => [p.id, p]));

  return (
    <>
      <PageHeader
        eyebrow="Principal workspace"
        title="Audit trail"
        description="Sensitive changes for this event are recorded here. Principals only."
        action={<Badge variant="navy">{logs.length} entries</Badge>}
      />
      <main id="main-content" className="page-wrap py-8 sm:py-10">
        <Link
          href={`/events/${slug}/principal`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" /> Back to overview
        </Link>

        {logs.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon={<ClipboardList className="h-5 w-5" />}
            title="No audit entries yet"
            description="Audit entries appear when staff roles, check-ins, rooms, schedule items, or announcements change."
          />
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[0.65rem] font-extrabold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
                  <th className="py-3 pr-3">When</th>
                  <th className="py-3 pr-3">Actor</th>
                  <th className="py-3 pr-3">Action</th>
                  <th className="py-3 pr-3">Entity</th>
                  <th className="py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {logs.map((log) => {
                  const actor = actorById.get(log.actor_user_id ?? "");
                  return (
                    <tr key={log.id} className="align-top">
                      <td className="py-3 pr-3 text-[0.68rem] text-[var(--muted-foreground)]">{formatDateTime(log.created_at)}</td>
                      <td className="py-3 pr-3">
                        <p className="text-sm font-semibold">{actor?.full_name ?? "System"}</p>
                      </td>
                      <td className="py-3 pr-3 text-[0.68rem] font-bold">{log.action.replaceAll(".", " ").replaceAll("_", " ")}</td>
                      <td className="py-3 pr-3 text-[0.68rem] text-[var(--muted-foreground)]">{log.entity_type}</td>
                      <td className="py-3 text-right text-[0.68rem] text-[var(--muted-foreground)] truncate max-w-48" title={JSON.stringify(log.metadata)}>
                        {JSON.stringify(log.metadata)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-8 max-w-2xl text-xs leading-relaxed text-[var(--muted-foreground)]">
          Only principals can view the audit trail. Entries cover role grants/revocations, check-ins, room assignments,
          schedule changes, announcements, and challenge publishes.
        </p>
      </main>
    </>
  );
}
