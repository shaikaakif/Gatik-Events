import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, DoorOpen, MapPin } from "lucide-react";
import { requireRole } from "@/lib/events/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sentenceCase } from "@/lib/utils";
import type { Room } from "@/lib/types";
import { PageHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/card";

export const metadata: Metadata = { title: "Coordinator rooms" };

export default async function CoordinatorRoomsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { viewer, event } = await requireRole(slug, "coordinator");
  const supabase = await createSupabaseServerClient();
  const { data: assignments } = await supabase
    .from("coordinator_assignments")
    .select("room_id")
    .eq("event_id", event.id)
    .eq("user_id", viewer.id)
    .eq("status", "active");
  const allRooms = (assignments ?? []).some((row) => row.room_id === null);
  const roomIds = (assignments ?? [])
    .map((row) => row.room_id as string | null)
    .filter((id): id is string => Boolean(id));
  const { data: rooms } = allRooms
    ? await supabase.from("rooms").select("*").eq("event_id", event.id).order("sort_order")
    : roomIds.length
      ? await supabase.from("rooms").select("*").in("id", roomIds).order("sort_order")
      : { data: [] as Room[] };
  const roomList = (rooms ?? []) as Room[];

  return (
    <>
      <PageHeader
        eyebrow="Coordinator workspace"
        title="Rooms"
        description="Only rooms inside your active scope appear here. Open a room to inspect its teams, schools, and participants."
        action={<Badge variant="violet">{allRooms ? "All rooms" : `${roomList.length} scoped`}</Badge>}
      />
      <main id="main-content" className="page-wrap py-8 sm:py-10">
        {roomList.length === 0 ? (
          <EmptyState
            icon={<DoorOpen className="h-5 w-5" />}
            title="No rooms in scope"
            description="The event principal must assign you to one or more rooms, or grant all-room scope."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {roomList.map((room) => (
              <article key={room.id} className="surface-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eaf0f8] text-[var(--primary)]">
                    <DoorOpen aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <Badge variant={room.status === "active" ? "success" : room.status === "issue" ? "danger" : "neutral"}>{sentenceCase(room.status)}</Badge>
                </div>
                <h2 className="mt-4 text-lg font-extrabold tracking-[-0.02em]">{room.name}</h2>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">{room.code}</p>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                  <MapPin aria-hidden="true" className="h-3.5 w-3.5" /> {room.location ?? "Location to be confirmed"}
                </p>
                <Button asChild size="sm" className="mt-5 w-full">
                  <Link href={`/events/${slug}/coordinator/rooms/${room.id}`}>Inspect room <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></Link>
                </Button>
              </article>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
