import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Megaphone, Pin, ScrollText } from "lucide-react";
import { requireRole } from "@/lib/events/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Announcement } from "@/lib/types";
import { PageHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/card";

export const metadata: Metadata = { title: "Announcements" };

export default async function PrincipalAnnouncementsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { event } = await requireRole(slug, "principal");
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("event_announcements")
    .select("*")
    .eq("event_id", event.id)
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false });
  const announcements = (data ?? []) as Announcement[];

  return (
    <>
      <PageHeader
        eyebrow="Principal workspace"
        title="Announcements"
        description={`Broadcast to participants and staff for ${event.title}.`}
        action={<Badge variant="navy">{announcements.length}</Badge>}
      />
      <main id="main-content" className="page-wrap py-8 sm:py-10">
        <Link
          href={`/events/${slug}/principal`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" /> Back to overview
        </Link>

        {announcements.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon={<Megaphone className="h-5 w-5" />}
            title="No announcements yet"
            description="Create announcements to reach participants and staff across the event."
          />
        ) : (
          <div className="mt-6 space-y-4">
            {announcements.map((announcement) => (
              <article key={announcement.id} className="surface-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={announcement.audience === "all" ? "violet" : "neutral"} className="text-[0.62rem] uppercase tracking-[0.1em]">
                        {announcement.audience}
                      </Badge>
                      {announcement.is_pinned ? <Pin aria-hidden="true" className="h-3 w-3 text-[var(--warning)]" /> : null}
                    </div>
                    <h3 className="mt-1 text-lg font-extrabold tracking-[-0.01em]">{announcement.title}</h3>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">{announcement.body}</p>
                <p className="mt-4 flex items-center gap-2 text-[0.68rem] text-[var(--muted-foreground)]">
                  <ScrollText aria-hidden="true" className="h-3.5 w-3.5" />
                  Published {new Date(announcement.published_at).toLocaleDateString("en-IN", { timeZone: event.timezone })}
                </p>
              </article>
            ))}
          </div>
        )}
        <p className="mt-8 max-w-2xl text-xs leading-relaxed text-[var(--muted-foreground)]">
          Announcements are visible based on their audience setting. Pin important announcements to keep them at the top.
        </p>
      </main>
    </>
  );
}
