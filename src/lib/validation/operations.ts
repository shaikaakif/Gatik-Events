import { z } from "zod";

export const verifiedCheckInSchema = z.object({
  slug: z.string().min(1),
  event_id: z.string().uuid(),
  room_id: z.string().uuid(),
  registration_id: z.string().uuid(),
});

export const unresolvedCheckInSchema = z.object({
  slug: z.string().min(1),
  event_id: z.string().uuid(),
  room_id: z.string().uuid(),
  status: z.enum(["unregistered", "ambiguous", "flagged"]),
  name: z.string().trim().min(2, "Record a name for this attempt.").max(120),
  email: z.string().trim().email("Enter a valid email or leave it blank.").max(254).optional().or(z.literal("")),
  phone: z.string().trim().max(24).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const roomStatusSchema = z.object({
  slug: z.string().min(1),
  room_id: z.string().uuid(),
  status: z.enum(["setup", "active", "full", "closed", "issue"]),
  status_note: z.string().trim().max(300).optional(),
});

export function issuesFrom(error: z.ZodError) {
  return z.flattenError(error).fieldErrors as Record<string, string[]>;
}
