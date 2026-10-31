import "server-only";

import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMembershipRoles, requireViewer } from "@/lib/auth/guards";
import type { EventRole } from "@/lib/types";

export const getEventBySlug = cache(async (slug: string) => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("events").select("*").eq("slug", slug).maybeSingle();
  return data;
});

export async function requireEventMember(eventSlug: string) {
  const viewer = await requireViewer(`/events/${eventSlug}`);
  const event = await getEventBySlug(eventSlug);
  if (!event) notFound();
  const roles = await getMembershipRoles(event.id);
  if (roles.length === 0) redirect(`/events/${eventSlug}?denied=1`);
  return { viewer, event, roles };
}

export async function requireRole(eventSlug: string, role: EventRole) {
  const context = await requireEventMember(eventSlug);
  if (!context.roles.includes(role)) redirect(`/events/${eventSlug}?denied=1`);
  return { ...context, activeRole: role };
}

export async function requireAnyRole(eventSlug: string, allowed: EventRole[]) {
  const context = await requireEventMember(eventSlug);
  const activeRole = allowed.find((role) => context.roles.includes(role));
  if (!activeRole) redirect(`/events/${eventSlug}?denied=1`);
  return { ...context, activeRole };
}
