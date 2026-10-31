import { z } from "zod";

export const registrationSchema = z.object({
  event_id: z.string().uuid(),
  slug: z.string().min(1),
  school_id: z.string().uuid("Select a school."),
  grade_year: z.string().trim().min(1, "Enter your grade or year.").max(40),
  roll_number: z.string().trim().max(40).optional(),
});

export const teamCreateSchema = z.object({
  event_id: z.string().uuid(),
  slug: z.string().min(1),
  name: z.string().trim().min(2, "Team name needs at least 2 characters.").max(60),
  school_id: z.string().uuid("Select a school."),
  description: z.string().trim().max(500, "Keep the description under 500 characters.").optional(),
});

export const teamInviteSchema = z.object({
  team_id: z.string().uuid(),
  email: z.string().trim().email("Enter a valid email."),
});

export const invitationActionSchema = z.object({
  invitation_id: z.string().uuid(),
  token: z.string().optional(),
});

export const teamMemberActionSchema = z.object({
  team_id: z.string().uuid(),
  user_id: z.string().uuid(),
  slug: z.string().min(1),
});

export const teamDetailsSchema = z.object({
  team_id: z.string().uuid(),
  slug: z.string().min(1),
  name: z.string().trim().min(2).max(60),
  school_id: z.string().uuid(),
  description: z.string().trim().max(500).optional(),
});

export function errorsFrom(error: z.ZodError) {
  return z.flattenError(error).fieldErrors as Record<string, string[]>;
}
