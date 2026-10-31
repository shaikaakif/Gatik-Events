"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/events/guards";
import { requireViewer } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { localDateTimeToUtc } from "@/lib/utils";
import {
  announcementActionSchema,
  announcementPinSchema,
  announcementSchema,
  challengeSchema,
  coordinatorAssignmentSchema,
  createEventSchema,
  eventSettingsSchema,
  eventStatusSchema,
  existingSchoolSchema,
  grantRoleSchema,
  newSchoolSchema,
  principalErrors,
  revokeRoleSchema,
  roomSchema,
  roomUpdateSchema,
  scheduleItemActionSchema,
  scheduleItemSchema,
  scheduleItemUpdateSchema,
  schedulePublishSchema,
  teamRoomSchema,
  volunteerAssignmentSchema,
} from "@/lib/validation/principal";
import type { ActionState } from "@/lib/types";

function failure(message: string, fieldErrors?: Record<string, string[]>): ActionState {
  return { status: "error", message, fieldErrors };
}

function success(message: string): ActionState {
  return { status: "success", message };
}

function revalidateEvent(slug: string) {
  revalidatePath(`/events/${slug}`, "layout");
  revalidatePath("/events");
}

export async function updateEventSettingsAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = eventSettingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Check the highlighted settings.", principalErrors(parsed.error));
  const { slug, event_id, ...settings } = parsed.data;
  const { event } = await requireRole(slug, "principal");
  if (event.id !== event_id) return failure("That event could not be confirmed.");

  const opensAt = settings.registration_opens_at
    ? localDateTimeToUtc(settings.registration_opens_at, settings.timezone)
    : null;
  const closesAt = settings.registration_closes_at
    ? localDateTimeToUtc(settings.registration_closes_at, settings.timezone)
    : null;
  if (settings.registration_opens_at && !opensAt) return failure("Registration opening time is invalid.");
  if (settings.registration_closes_at && !closesAt) return failure("Registration closing time is invalid.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("events")
    .update({
      title: settings.title,
      category: settings.category,
      description: settings.description || null,
      venue_name: settings.venue_name,
      venue_address: settings.venue_address || null,
      timezone: settings.timezone,
      starts_on: settings.starts_on,
      ends_on: settings.ends_on,
      registration_opens_at: opensAt,
      registration_closes_at: closesAt,
      min_team_size: settings.min_team_size,
      max_team_size: settings.max_team_size,
      max_teams: settings.max_teams ?? null,
      capacity: settings.capacity ?? null,
    })
    .eq("id", event.id);
  if (error) return failure(error.message);

  revalidateEvent(slug);
  return success("Event settings saved. The change is recorded in the audit trail.");
}

export async function updateEventStatusAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = eventStatusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Choose a valid next status.", principalErrors(parsed.error));
  const { slug, event_id, next_status } = parsed.data;
  const { event } = await requireRole(slug, "principal");
  if (event.id !== event_id) return failure("That event could not be confirmed.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_event_status", {
    p_event_id: event.id,
    p_next_status: next_status,
  });
  if (error) return failure(error.message);

  revalidateEvent(slug);
  revalidatePath(`/events/${slug}/principal/settings`);
  return success("Event lifecycle updated. The transition is audited.");
}

export async function createRoomAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = roomSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Check the room details.", principalErrors(parsed.error));
  const { slug, event_id, ...room } = parsed.data;
  const { event } = await requireRole(slug, "principal");
  if (event.id !== event_id) return failure("That event could not be confirmed.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("rooms").insert({
    event_id: event.id,
    name: room.name,
    code: room.code,
    location: room.location || null,
    team_capacity: room.team_capacity,
    sort_order: room.sort_order,
  });
  if (error) return failure(error.message);

  revalidateEvent(slug);
  return success("Room created.");
}

export async function updateRoomAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = roomUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Check the room details.", principalErrors(parsed.error));
  const { slug, event_id, room_id, ...room } = parsed.data;
  const { event } = await requireRole(slug, "principal");
  if (event.id !== event_id) return failure("That event could not be confirmed.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("rooms")
    .update({
      name: room.name,
      code: room.code,
      location: room.location || null,
      team_capacity: room.team_capacity,
      sort_order: room.sort_order,
    })
    .eq("id", room_id)
    .eq("event_id", event.id);
  if (error) return failure(error.message);

  revalidateEvent(slug);
  return success("Room updated.");
}

export async function addExistingSchoolAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = existingSchoolSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Choose a school to add.", principalErrors(parsed.error));
  const { slug, event_id, school_id } = parsed.data;
  const { event } = await requireRole(slug, "principal");
  if (event.id !== event_id) return failure("That event could not be confirmed.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("add_event_school", {
    p_event_id: event.id,
    p_school_id: school_id,
    p_name: null,
    p_city: null,
    p_state: null,
  });
  if (error) return failure(error.message);

  revalidateEvent(slug);
  return success("School added to this event.");
}

export async function createSchoolAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = newSchoolSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Check the school details.", principalErrors(parsed.error));
  const { slug, event_id, name, city, state } = parsed.data;
  const { event } = await requireRole(slug, "principal");
  if (event.id !== event_id) return failure("That event could not be confirmed.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("add_event_school", {
    p_event_id: event.id,
    p_school_id: null,
    p_name: name,
    p_city: city || null,
    p_state: state || null,
  });
  if (error) return failure(error.message);

  revalidateEvent(slug);
  return success("School created and added to this event.");
}

export async function assignTeamToRoomAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = teamRoomSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Choose a valid team and room.", principalErrors(parsed.error));
  const { slug, event_id, team_id, room_id } = parsed.data;
  const { event } = await requireRole(slug, "principal");
  if (event.id !== event_id) return failure("That event could not be confirmed.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("assign_team_to_room", {
    p_event_id: event.id,
    p_team_id: team_id,
    p_room_id: room_id,
  });
  if (error) return failure(error.message);

  revalidateEvent(slug);
  return success("Team room assignment saved.");
}

export async function grantRoleAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = grantRoleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Check the staff details.", principalErrors(parsed.error));
  const { slug, event_id, email, role } = parsed.data;
  const { event } = await requireRole(slug, "principal");
  if (event.id !== event_id) return failure("That event could not be confirmed.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("assign_event_role", {
    p_event_id: event.id,
    p_email: email,
    p_role: role,
  });
  if (error) return failure(error.message);

  revalidateEvent(slug);
  return success(`${role.replaceAll("_", " ")} role granted to ${email}.`);
}

export async function revokeRoleAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = revokeRoleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Choose a valid role to revoke.", principalErrors(parsed.error));
  const { slug, event_id, user_id, role } = parsed.data;
  const { event } = await requireRole(slug, "principal");
  if (event.id !== event_id) return failure("That event could not be confirmed.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("revoke_event_role", {
    p_event_id: event.id,
    p_user_id: user_id,
    p_role: role,
  });
  if (error) return failure(error.message);

  revalidateEvent(slug);
  return success(`${role.replaceAll("_", " ")} role revoked.`);
}

export async function assignVolunteerAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = volunteerAssignmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Choose a volunteer and room.", principalErrors(parsed.error));
  const { slug, event_id, room_id, user_id } = parsed.data;
  const { event } = await requireRole(slug, "principal");
  if (event.id !== event_id) return failure("That event could not be confirmed.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("assign_volunteer", {
    p_event_id: event.id,
    p_room_id: room_id,
    p_user_id: user_id,
  });
  if (error) return failure(error.message);

  revalidateEvent(slug);
  return success("Volunteer room assignment saved.");
}

export async function assignCoordinatorAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = coordinatorAssignmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Choose a coordinator and scope.", principalErrors(parsed.error));
  const { slug, event_id, user_id, room_id } = parsed.data;
  const { event } = await requireRole(slug, "principal");
  if (event.id !== event_id) return failure("That event could not be confirmed.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("assign_coordinator", {
    p_event_id: event.id,
    p_user_id: user_id,
    p_room_id: room_id,
  });
  if (error) return failure(error.message);

  revalidateEvent(slug);
  return success(room_id ? "Coordinator room scope added." : "Coordinator granted all-room scope.");
}

export async function createScheduleItemAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = scheduleItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Check the schedule item.", principalErrors(parsed.error));
  const { slug, event_id, ...item } = parsed.data;
  const { viewer, event } = await requireRole(slug, "principal");
  if (event.id !== event_id) return failure("That event could not be confirmed.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("schedule_items").insert({
    event_id: event.id,
    day_date: item.day_date,
    time_label: item.time_label || null,
    title: item.title,
    description: item.description || null,
    location: item.location || null,
    kind: item.kind,
    sequence: item.sequence,
    is_published: item.is_published,
    created_by: viewer.id,
  });
  if (error) return failure(error.message);

  revalidateEvent(slug);
  return success(item.is_published ? "Schedule item created and published." : "Schedule item saved as unpublished.");
}

export async function updateScheduleItemAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = scheduleItemUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Check the schedule item.", principalErrors(parsed.error));
  const { slug, event_id, item_id, ...item } = parsed.data;
  const { event } = await requireRole(slug, "principal");
  if (event.id !== event_id) return failure("That event could not be confirmed.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("schedule_items")
    .update({
      day_date: item.day_date,
      time_label: item.time_label || null,
      title: item.title,
      description: item.description || null,
      location: item.location || null,
      kind: item.kind,
      sequence: item.sequence,
      is_published: item.is_published,
    })
    .eq("id", item_id)
    .eq("event_id", event.id);
  if (error) return failure(error.message);

  revalidateEvent(slug);
  return success("Schedule item updated.");
}

export async function deleteScheduleItemAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = scheduleItemActionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("That schedule item could not be identified.", principalErrors(parsed.error));
  const { slug, event_id, item_id } = parsed.data;
  const { event } = await requireRole(slug, "principal");
  if (event.id !== event_id) return failure("That event could not be confirmed.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("schedule_items").delete().eq("id", item_id).eq("event_id", event.id);
  if (error) return failure(error.message);

  revalidateEvent(slug);
  return success("Schedule item deleted.");
}

export async function setSchedulePublishAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = schedulePublishSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("That schedule item could not be identified.", principalErrors(parsed.error));
  const { slug, event_id, item_id, is_published } = parsed.data;
  const { event } = await requireRole(slug, "principal");
  if (event.id !== event_id) return failure("That event could not be confirmed.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("schedule_items")
    .update({ is_published })
    .eq("id", item_id)
    .eq("event_id", event.id);
  if (error) return failure(error.message);

  revalidateEvent(slug);
  return success(is_published ? "Schedule item published." : "Schedule item unpublished.");
}

export async function createAnnouncementAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = announcementSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Check the announcement.", principalErrors(parsed.error));
  const { slug, event_id, ...announcement } = parsed.data;
  const { viewer, event } = await requireRole(slug, "principal");
  if (event.id !== event_id) return failure("That event could not be confirmed.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("event_announcements").insert({
    event_id: event.id,
    title: announcement.title,
    body: announcement.body,
    audience: announcement.audience,
    is_pinned: announcement.is_pinned,
    created_by: viewer.id,
  });
  if (error) return failure(error.message);

  revalidateEvent(slug);
  return success("Announcement published.");
}

export async function deleteAnnouncementAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = announcementActionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("That announcement could not be identified.", principalErrors(parsed.error));
  const { slug, event_id, announcement_id } = parsed.data;
  const { event } = await requireRole(slug, "principal");
  if (event.id !== event_id) return failure("That event could not be confirmed.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("event_announcements")
    .delete()
    .eq("id", announcement_id)
    .eq("event_id", event.id);
  if (error) return failure(error.message);

  revalidateEvent(slug);
  return success("Announcement deleted.");
}

export async function setAnnouncementPinAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = announcementPinSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("That announcement could not be identified.", principalErrors(parsed.error));
  const { slug, event_id, announcement_id, is_pinned } = parsed.data;
  const { event } = await requireRole(slug, "principal");
  if (event.id !== event_id) return failure("That event could not be confirmed.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("event_announcements")
    .update({ is_pinned })
    .eq("id", announcement_id)
    .eq("event_id", event.id);
  if (error) return failure(error.message);

  revalidateEvent(slug);
  return success(is_pinned ? "Announcement pinned." : "Announcement unpinned.");
}

export async function saveChallengeAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = challengeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Check the challenge content.", principalErrors(parsed.error));
  const { slug, event_id, title, summary, sections, publish } = parsed.data;
  const { event } = await requireRole(slug, "principal");
  if (event.id !== event_id) return failure("That event could not be confirmed.");
  if (publish && sections.length === 0) {
    return failure("Add at least one section before publishing the challenge.", {
      sections: ["A published challenge needs content."],
    });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_event_challenge", {
    p_event_id: event.id,
    p_title: title,
    p_summary: summary || null,
    p_sections: sections,
    p_publish: publish,
  });
  if (error) return failure(error.message);

  revalidateEvent(slug);
  return success(publish ? "Challenge published with the supplied content." : "Challenge saved as an unpublished draft.");
}

export async function createEventAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = createEventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Check the event details.", principalErrors(parsed.error));
  const data = parsed.data;
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
  if (!principalship) return failure("Only an active event principal can create an event.");

  const opensAt = data.registration_opens_at
    ? localDateTimeToUtc(data.registration_opens_at, data.timezone)
    : null;
  const closesAt = data.registration_closes_at
    ? localDateTimeToUtc(data.registration_closes_at, data.timezone)
    : null;
  if (data.registration_opens_at && !opensAt) return failure("Registration opening time is invalid.");
  if (data.registration_closes_at && !closesAt) return failure("Registration closing time is invalid.");

  const { error } = await supabase.rpc("create_event", {
    payload: {
      slug: data.slug,
      title: data.title,
      category: data.category,
      description: data.description || null,
      venue_name: data.venue_name,
      venue_address: data.venue_address || null,
      timezone: data.timezone,
      starts_on: data.starts_on,
      ends_on: data.ends_on,
      registration_opens_at: opensAt ?? "",
      registration_closes_at: closesAt ?? "",
      min_team_size: data.min_team_size,
      max_team_size: data.max_team_size,
      max_teams: data.max_teams ?? null,
      capacity: data.capacity ?? null,
    },
  });
  if (error) return failure(error.message);

  revalidatePath("/events");
  redirect(`/events/${data.slug}/principal`);
}
