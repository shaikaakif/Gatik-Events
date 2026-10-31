import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardCheck, DoorOpen, Search, ShieldAlert, Users } from "lucide-react";
import { requireRole } from "@/lib/events/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDateTime, sentenceCase } from "@/lib/utils";
import type { Room } from "@/lib/types";
import { PageHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/card";
import {
  RoomStatusForm,
  UnresolvedCheckInForm,
  VerifiedCheckInButton,
} from "@/components/volunteer/room-console";

export const metadata: Metadata = { title: "Room console" };

type SearchRow = {
  registration_id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  team_id: string;
  team_name: string;
  team_code: string;
  school_name: string;
  grade_year: string;
  check_in_status: "verified" | "unregistered" | "ambiguous" | "duplicate" | "flagged" | null;
  checked_in_at: string | null;
};
type UnresolvedRow = {
  id: string;
  status: string;
  subject_name: string | null;
  notes: string | null;
  checked_in_at: string;
};

export default async function VolunteerRoomConsolePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; roomId: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { slug, roomId } = await params;
  const { q } = await searchParams;
  const { viewer, event } = await requireRole(slug, "volunteer");
  const supabase = await createSupabaseServerClient();

  const { data: assignment } = await supabase
    .from("volunteer_assignments")
    .select("id")
    .eq("event_id", event.id)
    .eq("room_id", roomId)
    .eq("user_id", viewer.id)
    .eq("status", "active")
    .maybeSingle();
  if (!assignment) notFound();

  const { data: roomData } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .eq("event_id", event.id)
    .maybeSingle();
  if (!roomData) notFound();
  const room = roomData as Room;

  const [{ data: searchData }, { data: unresolvedData }] = await Promise.all([
    supabase.rpc("search_room_participants", { p_room_id: roomId, p_query: q ?? "" }),
    supabase
      .from("check_ins")
      .select("id, status, subject_name, notes, checked_in_at")
      .eq("event_id", event.id)
      .eq("room_id", roomId)
      .in("status", ["unregistered", "ambiguous", "flagged"])
      .order("checked_in_at", { ascending: false })
      .limit(5),
  ]);
  const participants = (searchData ?? []) as SearchRow[];
  const unresolved = (unresolvedData ?? []) as UnresolvedRow[];
  const verifiedCount = participants.filter((row) => row.check_in_status === "verified").length;

  return (
    <>
      <PageHeader
        eyebrow={`Volunteer · ${room.code}`}
        title={room.name}
        description={`${room.location ?? "Location to be confirmed"} · Room status ${sentenceCase(room.status)}`}
        action={
          <Badge variant={room.status === "active" ? "success" : room.status === "issue" ? "danger" : "neutral"}>
            {sentenceCase(room.status)}
          </Badge>
        }
      />
      <main id="main-content" className="page-wrap py-8 sm:py-10">
        <Link href={`/events/${slug}/volunteer`} className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" /> Volunteer overview
        </Link>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <section className="surface-card p-5 sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="eyebrow mb-2">Participant verification</p>
                  <h2 className="text-xl font-extrabold tracking-[-0.02em]">Room roster</h2>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    Search by name, email, team, code, or roll number. Only participants assigned to this room are returned.
                  </p>
                </div>
                <Badge variant="lime">{verifiedCount} verified</Badge>
              </div>

              <form className="relative mt-5" role="search">
                <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <Input name="q" defaultValue={q ?? ""} placeholder="Search this room’s participants" aria-label="Search participants" className="pl-10" />
                <Button type="submit" size="sm" variant="secondary" className="absolute right-1.5 top-1/2 -translate-y-1/2">Search</Button>
              </form>

              {participants.length === 0 ? (
                <EmptyState
                  className="mt-5"
                  icon={<Users className="h-5 w-5" />}
                  title={q ? "No matching participant" : "No assigned teams yet"}
                  description={
                    q
                      ? "No participant in this room matches that search. Do not create a verified registration for an unlisted person; record an unresolved attempt below instead."
                      : "Teams are not yet assigned to this room. Check back after the principal publishes room assignments."
                  }
                />
              ) : (
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-[0.65rem] font-extrabold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
                        <th className="py-2 pr-3">Participant</th>
                        <th className="py-2 pr-3">Team</th>
                        <th className="py-2 pr-3">School</th>
                        <th className="py-2 pr-3">Attendance</th>
                        <th className="py-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {participants.map((participant) => (
                        <tr key={participant.registration_id} className="align-top">
                          <td className="py-3 pr-3">
                            <p className="font-bold">{participant.full_name}</p>
                            <p className="text-xs text-[var(--muted-foreground)]">{participant.email}</p>
                            <p className="text-[0.68rem] text-[var(--muted-foreground)]">Grade {participant.grade_year}</p>
                          </td>
                          <td className="py-3 pr-3">
                            <p className="font-semibold">{participant.team_name}</p>
                            <p className="text-[0.68rem] text-[var(--muted-foreground)]">{participant.team_code}</p>
                          </td>
                          <td className="py-3 pr-3 text-xs text-[var(--muted-foreground)]">{participant.school_name}</td>
                          <td className="py-3 pr-3">
                            {participant.check_in_status === "verified" ? (
                              <div>
                                <Badge variant="success">Verified</Badge>
                                {participant.checked_in_at ? <p className="mt-1 text-[0.65rem] text-[var(--muted-foreground)]">{formatDateTime(participant.checked_in_at)}</p> : null}
                              </div>
                            ) : (
                              <Badge variant="warning">Not verified</Badge>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            <VerifiedCheckInButton
                              slug={slug}
                              eventId={event.id}
                              roomId={room.id}
                              registrationId={participant.registration_id}
                              alreadyVerified={participant.check_in_status === "verified"}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <UnresolvedCheckInForm slug={slug} eventId={event.id} roomId={room.id} />

            <section className="surface-card p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <ShieldAlert aria-hidden="true" className="h-4 w-4 text-[var(--warning)]" />
                <h2 className="text-sm font-extrabold">Recent unresolved attempts</h2>
              </div>
              {unresolved.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--muted-foreground)]">No unresolved attempts recorded in this room.</p>
              ) : (
                <ul className="mt-4 divide-y divide-[var(--border)]">
                  {unresolved.map((attempt) => (
                    <li key={attempt.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={attempt.status === "flagged" ? "danger" : "warning"}>{sentenceCase(attempt.status)}</Badge>
                        <span className="text-sm font-bold">{attempt.subject_name ?? "Name not recorded"}</span>
                        <span className="ml-auto text-[0.68rem] text-[var(--muted-foreground)]">{formatDateTime(attempt.checked_in_at)}</span>
                      </div>
                      {attempt.notes ? <p className="mt-1 text-xs text-[var(--muted-foreground)]">{attempt.notes}</p> : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <aside className="space-y-5">
            <section className="surface-card p-5">
              <div className="flex items-center gap-2">
                <DoorOpen aria-hidden="true" className="h-4 w-4 text-[var(--event-violet-strong)]" />
                <h2 className="text-sm font-extrabold">Room status</h2>
              </div>
              <p className="mt-2 text-xs text-[var(--muted-foreground)]">Report the operational state of your assigned room.</p>
              <div className="mt-4">
                <RoomStatusForm slug={slug} roomId={room.id} status={room.status} note={room.status_note} />
              </div>
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="flex items-center gap-2">
                <ClipboardCheck aria-hidden="true" className="h-4 w-4 text-[var(--event-violet-strong)]" />
                <h2 className="text-sm font-extrabold">Verification rules</h2>
              </div>
              <ul className="mt-3 space-y-2 text-xs leading-relaxed text-[var(--muted-foreground)]">
                <li>Only a confirmed registration assigned to this room can be verified.</li>
                <li>Duplicate verification returns the original record; it does not create a second attendance row.</li>
                <li>An unregistered or ambiguous person is recorded, never auto-registered.</li>
                <li>You cannot record check-ins for another volunteer&apos;s room.</li>
              </ul>
            </section>

            <Button asChild variant="ghost" size="sm" className="w-full">
              <Link href={`/events/${slug}/volunteer/rooms`}>Back to my rooms</Link>
            </Button>
          </aside>
        </div>
      </main>
    </>
  );
}
