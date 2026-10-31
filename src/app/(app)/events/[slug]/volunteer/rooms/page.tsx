import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, DoorOpen, MapPin } from "lucide-react";
import { requireRole } from "@/lib/events/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sentenceCase } from "@/lib/utils";
import type { Room } from "@/lib/types";
import { PageHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "My rooms" };

export default async function VolunteerRoomsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { viewer, event } = await requireRole(slug, "volunteer");
  const supabase = await createSupabaseServerClient();
  const { data: assignments } = await supabase
    .from("volunteer_assignments")
    .select("room_id")
    .eq("event_id", event.id)
    .eq("user_id", viewer.id)
    .eq("status", "active");
  const roomIds = (assignments ?? []).map((row) => row.room_id as string);
  const { data: rooms } = roomIds.length
    ? await supabase.from("rooms").select("*").in("id", roomIds).order("sort_order")
    : { data: [] as Room[] };
  const roomList = (rooms ?? []) as Room[];

  return (
    <>
      <PageHeader
        eyebrow="Volunteer workspace"
        title="My rooms"
        description="Rooms assigned to your account for this event. Unassigned rooms are not exposed by the database."
        action={<Badge variant="navy">{roomList.length} active</Badge>}
      />
      <main id="main-content" className="page-wrap py-8 sm:py-10">
        {roomList.length === 0 ? (
          <EmptyState
            icon={<DoorOpen className="h-5 w-5" />}
            title="No active room assignment"
            description="Ask the event principal to assign you to an operating room. A room assignment is required before any check-in can be recorded."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {roomList.map((room) => (
              <article key={room.id} className="surface-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--surface-peach)] text-[var(--gatik-orange-ink)]">
                    <DoorOpen aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <Badge variant={room.status === "active" ? "success" : room.status === "issue" ? "danger" : "neutral"}>
                    {sentenceCase(room.status)}
                  </Badge>
                </div>
                <h2 className="mt-4 text-lg font-extrabold tracking-[-0.02em]">{room.name}</h2>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">{room.code}</p>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                  <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
                  {room.location ?? "Location to be confirmed"}
                </p>
                {room.status_note ? <p className="mt-2 text-xs text-[var(--muted-foreground)]">{room.status_note}</p> : null}
                <Button asChild size="sm" className="mt-5 w-full">
                  <Link href={`/events/${slug}/volunteer/rooms/${room.id}`}>
                    Open room console <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </article>
            ))}
          </div>
        )}
        <Button asChild variant="ghost" size="sm" className="mt-6">
          <Link href={`/events/${slug}/volunteer`}>Back to overview</Link>
        </Button>
      </main>
    </>
  );
}
