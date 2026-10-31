"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/events/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { issuesFrom, roomStatusSchema, unresolvedCheckInSchema, verifiedCheckInSchema } from "@/lib/validation/operations";
import type { ActionState } from "@/lib/types";

function failure(message: string, fieldErrors?: Record<string, string[]>): ActionState {
  return { status: "error", message, fieldErrors };
}

export async function recordVerifiedCheckInAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = verifiedCheckInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Invalid check-in request.", issuesFrom(parsed.error));
  const { slug, event_id, room_id, registration_id } = parsed.data;
  await requireRole(slug, "volunteer");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("record_check_in", {
    p_event_id: event_id,
    p_room_id: room_id,
    p_registration_id: registration_id,
    p_status: "verified",
    p_subject: {},
    p_notes: null,
  });
  if (error) return failure(error.message);

  const result = Array.isArray(data) ? data[0] : data;
  revalidatePath(`/events/${slug}/volunteer/rooms/${room_id}`);
  revalidatePath(`/events/${slug}/volunteer`);
  return {
    status: "success",
    message: result?.was_duplicate
      ? "This participant was already verified. No duplicate attendance record was created."
      : "Check-in verified and audited.",
  };
}

export async function recordUnresolvedCheckInAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = unresolvedCheckInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Check the attempt details.", issuesFrom(parsed.error));
  const { slug, event_id, room_id, status, name, email, phone, notes } = parsed.data;
  await requireRole(slug, "volunteer");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("record_check_in", {
    p_event_id: event_id,
    p_room_id: room_id,
    p_registration_id: null,
    p_status: status,
    p_subject: { name, email: email || null, phone: phone || null },
    p_notes: notes || null,
  });
  if (error) return failure(error.message);

  revalidatePath(`/events/${slug}/volunteer/rooms/${room_id}`);
  return { status: "success", message: "Attempt recorded as unresolved. It is not counted as attendance." };
}

export async function updateRoomStatusAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = roomStatusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Choose a valid room status.", issuesFrom(parsed.error));
  const { slug, room_id, status, status_note } = parsed.data;
  await requireRole(slug, "volunteer");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_room_status", {
    p_room_id: room_id,
    p_status: status,
    p_note: status_note || null,
  });
  if (error) return failure(error.message);

  revalidatePath(`/events/${slug}/volunteer/rooms/${room_id}`);
  revalidatePath(`/events/${slug}/volunteer`);
  revalidatePath(`/events/${slug}/coordinator`);
  return { status: "success", message: "Room status updated and audited." };
}
