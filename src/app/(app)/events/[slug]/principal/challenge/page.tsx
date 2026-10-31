import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText, LockKeyhole, ScrollText } from "lucide-react";
import { requireRole } from "@/lib/events/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { EventChallenge } from "@/lib/types";
import { PageHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Challenge" };

export default async function PrincipalChallengePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { event } = await requireRole(slug, "principal");
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("event_challenges")
    .select("*")
    .eq("event_id", event.id)
    .maybeSingle();
  const challenge = data as EventChallenge | null;
  const sections = challenge?.sections ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Principal workspace"
        title="Challenge editor"
        description="Store the official challenge content. Participants only see it once you publish."
        action={
          challenge ? (
            <Badge variant={challenge.is_published ? "success" : "warning"}>{challenge.is_published ? `Published v${challenge.version}` : "Draft"}</Badge>
          ) : undefined
        }
      />
      <main id="main-content" className="page-wrap py-8 sm:py-10">
        <Link
          href={`/events/${slug}/principal`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" /> Back to overview
        </Link>

        {!challenge ? (
          <section className="mt-6 surface-card p-6 sm:p-8">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--surface-lavender)] text-[var(--event-violet-strong)]">
              <ScrollText aria-hidden="true" className="h-6 w-6" />
            </span>
            <h2 className="mt-5 text-2xl font-extrabold tracking-[-0.025em]">No challenge yet</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--muted-foreground)]">
              The official problem statement has not been supplied for this event. Create a draft below; it stays
              unpublished until you choose to publish it.
            </p>
          </section>
        ) : (
          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_18rem]">
            <article className="surface-card p-6 sm:p-8">
              {!challenge.is_published ? (
                <div className="mb-6 rounded-xl border border-[var(--border-strong)]/50 bg-[var(--surface-peach)]/50 p-4 text-[var(--gatik-orange-ink)]">
                  <p className="text-sm font-bold">Unpublished draft</p>
                  <p className="mt-1 text-[0.68rem]">Participants cannot see this content until you publish it.</p>
                </div>
              ) : null}
              {challenge.summary ? (
                <p className="prose-editorial border-l-2 border-[var(--event-violet)] pl-4 font-medium text-[var(--foreground)]">{challenge.summary}</p>
              ) : null}
              <div className="prose-editorial mt-7">
                {sections.length === 0 ? (
                  <p className="text-sm text-[var(--muted-foreground)]">No sections have been supplied yet.</p>
                ) : (
                  sections.map((section) => (
                    <section key={section.id} id={section.id} className="scroll-mt-24 mb-6">
                      <h2 className="text-lg font-extrabold tracking-[-0.01em]">{section.heading}</h2>
                      <p className="mt-2 whitespace-pre-line text-[var(--muted-foreground)]">{section.body}</p>
                    </section>
                  ))
                )}
              </div>
            </article>
            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
                <div className="flex items-center gap-2">
                  <FileText aria-hidden="true" className="h-4 w-4 text-[var(--event-violet-strong)]" />
                  <p className="text-xs font-bold">Version {challenge.version}</p>
                </div>
                <p className="mt-1 text-[0.68rem] text-[var(--muted-foreground)]">Published content is versioned so edits are traceable.</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
                <p className="eyebrow mb-3">Publish state</p>
                <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
                  When published, participants see the exact text supplied here. No placeholder content is ever shown.
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
                <div className="flex items-center gap-2">
                  <LockKeyhole aria-hidden="true" className="h-4 w-4 text-[var(--warning)]" />
                  <h2 className="text-sm font-extrabold">Why not publish yet</h2>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-[var(--muted-foreground)]">
                  Missing official content is an external dependency, not a design gap. Keep the challenge unpublished
                  until the verified problem statement exists.
                </p>
              </div>
            </aside>
          </div>
        )}
      </main>
    </>
  );
}
