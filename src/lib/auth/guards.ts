import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { getPublicSupabaseConfig } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/auth/session";
import { safeNextPath } from "@/lib/utils";
import type { EventRole, Membership, Profile } from "@/lib/types";

export type Viewer = {
  id: string;
  email: string | null;
  profile: Profile | null;
};

export type ViewerEvent = {
  event_id: string;
  role: EventRole;
  status: string;
};

export const getViewer = cache(async (): Promise<Viewer | null> => {
  if (!getPublicSupabaseConfig()) return null;
  const account = await getCurrentAccount();
  if (!account) return null;
  const supabase = await createSupabaseServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, phone, avatar_url")
    .eq("id", account.id)
    .maybeSingle();

  return {
    id: account.id,
    email: account.email,
    profile: profile ?? null,
  };
});

export async function requireViewer(nextPath: string) {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(safeNextPath(nextPath))}`);
  return viewer;
}

export async function getViewerMemberships(): Promise<ViewerEvent[]> {
  const viewer = await getViewer();
  if (!viewer) return [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("event_memberships")
    .select("event_id, role, status")
    .eq("user_id", viewer.id)
    .eq("status", "active");
  return (data ?? []) as ViewerEvent[];
}

export async function getMembershipRoles(eventId: string) {
  const viewer = await getViewer();
  if (!viewer) return [] as EventRole[];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("event_memberships")
    .select("role")
    .eq("event_id", eventId)
    .eq("user_id", viewer.id)
    .eq("status", "active");
  return ((data ?? []) as Membership[]).map((row) => row.role);
}

export async function requireEventRole(eventSlug: string, allowedRoles: EventRole[]) {
  const viewer = await requireViewer(`/events/${eventSlug}`);
  const supabase = await createSupabaseServerClient();
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("slug", eventSlug)
    .maybeSingle();

  if (!event) redirect("/events");
  const roles = await getMembershipRoles(event.id);
  if (!roles.some((role) => allowedRoles.includes(role))) {
    redirect(`/events/${eventSlug}?denied=1`);
  }
  return { viewer, event, roles };
}
