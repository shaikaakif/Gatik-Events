"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/events/guards";
import { requireViewer } from "@/lib/auth/guards";
import {
  errorsFrom,
  invitationActionSchema,
  teamCreateSchema,
  teamDetailsSchema,
  teamInviteSchema,
  teamMemberActionSchema,
} from "@/lib/validation/teams";
import type { ActionState } from "@/lib/types";
import { getAppUrl } from "@/lib/env";
import { sendTeamInvitationEmail } from "@/lib/email/resend";

function failure(message: string, fieldErrors?: Record<string, string[]>): ActionState {
  return { status: "error", message, fieldErrors };
}

export async function createTeamAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = teamCreateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Check the highlighted fields.", errorsFrom(parsed.error));
  const { slug, event_id, school_id, name, description } = parsed.data;
  await requireRole(slug, "participant");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("create_team", {
    p_event_id: event_id,
    p_name: name,
    p_school_id: school_id,
    p_description: description || null,
  });
  if (error) return failure(error.message);

  revalidatePath(`/events/${slug}/participant/team`);
  revalidatePath(`/events/${slug}/participant`);
  revalidatePath("/events");
  redirect(`/events/${slug}/participant/team?created=1`);
}

export async function inviteTeamMemberAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = teamInviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Check the email address.", errorsFrom(parsed.error));
  const slug = String(formData.get("slug") ?? "");
  const { viewer } = await requireRole(slug, "participant");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("invite_team_member", {
    p_team_id: parsed.data.team_id,
    p_email: parsed.data.email,
  });
  if (error) return failure(error.message);

  const invitation = Array.isArray(data) ? data[0] : data;
  if (!invitation?.raw_token) {
    return { status: "success", message: "Invitation created. It will appear in the invitee’s account." };
  }

  const [teamResult, eventResult] = await Promise.all([
    supabase.from("teams").select("name, event_id").eq("id", parsed.data.team_id).maybeSingle(),
    supabase.from("events").select("title").eq("slug", slug).maybeSingle(),
  ]);

  const emailResult = await sendTeamInvitationEmail({
    to: invitation.invitee_email,
    teamName: teamResult.data?.name ?? "your team",
    eventTitle: eventResult.data?.title ?? "Gatik Events",
    inviterName: viewer.profile?.full_name ?? "Your team leader",
    inviteUrl: `${getAppUrl()}/invitations/${invitation.raw_token}`,
  });

  revalidatePath(`/events/${slug}/participant/team`);
  revalidatePath("/invitations");
  return {
    status: "success",
    message: emailResult.sent
      ? "Invitation sent. It is also visible in the invitee’s account."
      : "Invitation created. Email is not configured, so the invitee can accept it in their account.",
  };
}

export async function acceptInvitationAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = invitationActionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Invalid invitation.", errorsFrom(parsed.error));
  await requireViewer("/invitations");
  const supabase = await createSupabaseServerClient();
  const { data: teamId, error } = await supabase.rpc("accept_team_invitation", {
    p_invitation_id: parsed.data.invitation_id,
    p_token: parsed.data.token || null,
  });
  if (error) return failure(error.message);

  const { data: team } = await supabase.from("teams").select("event_id").eq("id", teamId).maybeSingle();
  const { data: event } = team
    ? await supabase.from("events").select("slug").eq("id", team.event_id).maybeSingle()
    : { data: null };
  revalidatePath("/events");
  revalidatePath("/invitations");
  redirect(event?.slug ? `/events/${event.slug}/participant/team?joined=1` : "/events");
}

export async function declineInvitationAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = invitationActionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Invalid invitation.");
  await requireViewer("/invitations");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("decline_team_invitation", { p_invitation_id: parsed.data.invitation_id });
  if (error) return failure(error.message);
  revalidatePath("/invitations");
  revalidatePath("/events");
  return { status: "success", message: "Invitation declined." };
}

export async function revokeInvitationAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = invitationActionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Invalid invitation.");
  const slug = String(formData.get("slug") ?? "");
  await requireRole(slug, "participant");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("revoke_team_invitation", { p_invitation_id: parsed.data.invitation_id });
  if (error) return failure(error.message);
  revalidatePath(`/events/${slug}/participant/team`);
  return { status: "success", message: "Invitation revoked." };
}

export async function removeTeamMemberAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = teamMemberActionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Invalid team action.");
  const { slug, team_id, user_id } = parsed.data;
  await requireRole(slug, "participant");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("remove_team_member", { p_team_id: team_id, p_user_id: user_id });
  if (error) return failure(error.message);
  revalidatePath(`/events/${slug}/participant/team`);
  return { status: "success", message: "Member removed." };
}

export async function leaveTeamAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = teamMemberActionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Invalid team action.");
  const { slug, team_id, user_id } = parsed.data;
  const { viewer } = await requireRole(slug, "participant");
  if (viewer.id !== user_id) return failure("You can only leave your own team.");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("leave_team", { p_team_id: team_id });
  if (error) return failure(error.message);
  revalidatePath(`/events/${slug}/participant/team`);
  revalidatePath(`/events/${slug}/participant`);
  redirect(`/events/${slug}/participant/team?left=1`);
}

export async function transferLeadershipAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = teamMemberActionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Invalid team action.");
  const { slug, team_id, user_id } = parsed.data;
  await requireRole(slug, "participant");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("transfer_team_leadership", {
    p_team_id: team_id,
    p_new_leader_user_id: user_id,
  });
  if (error) return failure(error.message);
  revalidatePath(`/events/${slug}/participant/team`);
  return { status: "success", message: "Leadership transferred." };
}

export async function updateTeamDetailsAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = teamDetailsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Check the highlighted fields.", errorsFrom(parsed.error));
  const { slug, team_id, name, description, school_id } = parsed.data;
  await requireRole(slug, "participant");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_team_details", {
    p_team_id: team_id,
    p_name: name,
    p_description: description || null,
    p_school_id: school_id,
  });
  if (error) return failure(error.message);
  revalidatePath(`/events/${slug}/participant/team`);
  return { status: "success", message: "Team details updated." };
}
