import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ChevronRight, DoorOpen, MapPin } from "lucide-react";
import { requireRole } from "@/lib/events/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sentenceCase } from "@/lib/utils";
import type { Room } from "@/lib/types";
import { PageHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreateRoomForm } from "@/components/principal/room-forms";
import { EditRoomForm } from "@/components/principal/room-forms";

export const metadata: Metadata = { title: "Rooms" };

export default async function PrincipalRoomsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { event } = await requireRole(slug, "principal");
  const supabase = await createSupabaseServerClient();

  const [{ data: roomRows }, { data: assignmentRows }] = await Promise.all([
    supabase.from("rooms").select("*").eq("event_id", event.id).order("sort_order"),
    supabase.from("room_assignments").select("team_id, room_id").eq("event_id", event.id),
  ]);
  const rooms = (roomRows ?? []) as Room[];
  const assignments = (assignmentRows ?? []) as Array<{ team_id: string; room_id: string }>;
  const teamCountByRoom = new Map<string, number>();
  for (const a of assignments) {
    teamCountByRoom.set(a.room_id, (teamCountByRoom.get(a.room_id) ?? 0) + 1);
  }
  const maxSort = rooms.reduce((max, r) => Math.max(max, r.sort_order), 0);

  return (
    <>
      <PageHeader
        eyebrow="Principal workspace"
        title="Rooms"
        description={`Operating rooms for ${event.title}. Create rooms, then assign teams from the team drill-down.`}
        action={<Badge variant="navy">{rooms.length} room{rooms.length === 1 ? "" : "s"}</Badge>}
      />
      <main id="main-content" className="page-wrap py-8 sm:py-10">
        <Link
          href={`/events/${slug}/principal`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" /> Back to overview
        </Link>

        <div className="mt-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <p className="eyebrow mb-2">Room list</p>
            <h2 className="text-xl font-extrabold tracking-[-0.02em]">Create or edit rooms</h2>
          </div>
          <CreateRoomForm slug={slug} eventId={event.id} nextSortOrder={maxSort + 1} />
        </div>

        {rooms.length === 0 ? (
          <p className="mt-6 text-sm text-[var(--muted-foreground)]">No rooms created yet. Use the form above to add your first room.</p>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rooms.map((room) => {
              const used = teamCountByRoom.get(room.id) ?? 0;
              return (
                <article key={room.id} className="surface-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eaf0f8] text-[var(--primary)]">
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
                  <div className="mt-4 grid gap-2 border-t border-[var(--border)] pt-4 text-xs">
                    <div>
                      <p className="font-extrabold text-[var(--foreground)]">{used}</p>
                      <p className="text-[var(--muted-foreground)]">teams assigned</p>
                    </div>
                    <div>
                      <p className="font-extrabold text-[var(--foreground)]">{room.team_capacity}</p>
                      <p className="text-[var(--muted-foreground)]">capacity</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <EditRoomForm slug={slug} eventId={event.id} room={room} />
                    <Button asChild variant="secondary" size="sm" className="shrink-0">
                      <Link href={`/events/${slug}/principal/rooms/${room.id}`}>Assign teams <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" /></Link>
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
