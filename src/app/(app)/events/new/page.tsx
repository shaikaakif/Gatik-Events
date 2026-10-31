import type { Metadata } from "next";
import Link from "next/link";
import { Compass } from "lucide-react";
import { requireViewer } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/card";
import { SetupState } from "@/components/setup-notice";
import { isSupabaseConfigured } from "@/lib/env";
import { CreateEventForm } from "@/components/principal/settings-forms";

export const metadata: Metadata = { title: "Create event" };

export default async function CreateEventPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main id="main-content" className="page-wrap py-12">
        <PageHeader title="Create event" description="Event creation becomes available once the workspace is connected." />
        <div className="mt-8"><SetupState feature="Event creation" /></div>
      </main>
    );
  }

  const viewer = await requireViewer("/events/new");
  const supabase = await createSupabaseServerClient();
  const { data: principalship } = await supabase
    .from("event_memberships")
    .select("id")
    .eq("user_id", viewer.id)
    .eq("role", "principal")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  return (
    <>
      <PageHeader
        eyebrow="Principal workspace"
        title="Create event"
        description="Create a new draft event. You become its principal. Publish it when ready."
      />
      <main id="main-content" className="page-wrap py-8 sm:py-10">
        {!principalship ? (
          <EmptyState
            icon={<Compass className="h-5 w-5" />}
            title="Principal access required"
            description="Only an active event principal can create events. Contact an existing principal to grant you the role."
          />
        ) : (
          <section className="mt-6 surface-card p-6 sm:p-8 narrow-form">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow mb-2">New event</p>
                <h2 className="text-xl font-extrabold tracking-[-0.02em]">Create a draft event</h2>
              </div>
              <Button asChild variant="secondary" size="sm">
                <Link href="/events">Back to events</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-[var(--muted-foreground)]">
              Events start as drafts and are not visible in the directory until published. You can configure dates,
              registration windows, and team rules before publishing.
            </p>
            <div className="mt-7"><CreateEventForm /></div>
          </section>
        )}
      </main>
    </>
  );
}
