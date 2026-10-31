"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireViewer } from "@/lib/auth/guards";
import { getEventBySlug } from "@/lib/events/guards";
import { errorsFrom, registrationSchema } from "@/lib/validation/teams";
import type { ActionState } from "@/lib/types";

export async function registerForEventAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registrationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: errorsFrom(parsed.error) };
  }
  const { slug, event_id, school_id, grade_year, roll_number } = parsed.data;
  await requireViewer(`/events/${slug}/participant/register`);
  const event = await getEventBySlug(slug);
  if (!event || event.id !== event_id) {
    return { status: "error", message: "That event could not be found." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("register_for_event", {
    p_event_id: event_id,
    p_school_id: school_id,
    p_grade_year: grade_year,
    p_roll_number: roll_number || null,
    p_responses: {},
  });
  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath(`/events/${slug}`);
  revalidatePath(`/events/${slug}/participant`);
  revalidatePath("/events");
  redirect(`/events/${slug}/participant?registered=1`);
}
