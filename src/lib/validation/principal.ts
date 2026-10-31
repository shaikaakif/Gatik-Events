import { z } from "zod";

export const EVENT_CATEGORIES = [
  "hackathon",
  "annual_day",
  "sports",
  "exhibition",
  "cultural",
  "workshop",
  "competition",
  "club",
  "other",
] as const;

export const EVENT_STATUSES = [
  "draft",
  "published",
  "registration_open",
  "registration_closed",
  "in_progress",
  "completed",
  "archived",
] as const;

export const STAFF_ROLES = ["volunteer", "coordinator", "principal"] as const;
export const ANNOUNCEMENT_AUDIENCES = ["all", "participants", "volunteers", "coordinators", "principals"] as const;
export const SCHEDULE_KINDS = ["activity", "break", "ceremony", "logistics", "note"] as const;

const uuid = z.string().uuid("Choose a valid record.");
const slug = z.string().trim().min(1).max(120);
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date.");
const optionalText = (max: number, message?: string) =>
  z.string().trim().max(max, message ?? `Keep this under ${max} characters.`).optional();
const optionalPositiveInt = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.coerce.number().int().positive().optional(),
);
const checkbox = z.preprocess(
  (value) => value === "on" || value === "true" || value === true,
  z.boolean(),
);

const eventFields = {
  title: z.string().trim().min(3, "Enter an event title.").max(160),
  category: z.enum(EVENT_CATEGORIES),
  description: optionalText(4000),
  venue_name: z.string().trim().min(2, "Enter a venue.").max(200),
  venue_address: optionalText(300),
  timezone: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .refine((value) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: value });
        return true;
      } catch {
        return false;
      }
    }, "Use a valid IANA timezone, such as Asia/Kolkata."),
  starts_on: dateOnly,
  ends_on: dateOnly,
  registration_opens_at: optionalText(32),
  registration_closes_at: optionalText(32),
  min_team_size: z.coerce.number().int().min(1).max(20),
  max_team_size: z.coerce.number().int().min(1).max(20),
  max_teams: optionalPositiveInt,
  capacity: optionalPositiveInt,
};

type EventWindowValues = {
  starts_on: string;
  ends_on: string;
  registration_opens_at?: string;
  registration_closes_at?: string;
  min_team_size: number;
  max_team_size: number;
};

function refineEventWindow(data: EventWindowValues, ctx: z.RefinementCtx) {
  if (data.ends_on < data.starts_on) {
    ctx.addIssue({ code: "custom", path: ["ends_on"], message: "The end date must be on or after the start date." });
  }
  if (data.max_team_size < data.min_team_size) {
    ctx.addIssue({
      code: "custom",
      path: ["max_team_size"],
      message: "Maximum team size must be at least the minimum.",
    });
  }
  if (
    data.registration_opens_at &&
    data.registration_closes_at &&
    data.registration_closes_at < data.registration_opens_at
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["registration_closes_at"],
      message: "Registration cannot close before it opens.",
    });
  }
}

export const eventSettingsSchema = z
  .object({
    slug,
    event_id: uuid,
    ...eventFields,
  })
  .superRefine(refineEventWindow);

export const eventStatusSchema = z.object({
  slug,
  event_id: uuid,
  next_status: z.enum(EVENT_STATUSES),
});

export const createEventSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .min(3, "Use at least 3 characters.")
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only."),
    ...eventFields,
  })
  .superRefine(refineEventWindow);

export const roomSchema = z.object({
  slug,
  event_id: uuid,
  name: z.string().trim().min(1, "Enter a room name.").max(80),
  code: z.string().trim().min(1, "Enter a short room code.").max(20),
  location: optionalText(120),
  team_capacity: z.coerce.number().int().min(1, "Capacity must be at least one team.").max(20),
  sort_order: z.coerce.number().int().min(0).max(999),
});

export const roomUpdateSchema = roomSchema.extend({ room_id: uuid });

export const teamRoomSchema = z.object({
  slug,
  event_id: uuid,
  team_id: uuid,
  room_id: uuid,
});

export const existingSchoolSchema = z.object({
  slug,
  event_id: uuid,
  school_id: uuid,
});

export const newSchoolSchema = z.object({
  slug,
  event_id: uuid,
  name: z.string().trim().min(2, "Enter the school name.").max(160),
  city: optionalText(120),
  state: optionalText(80),
});

export const grantRoleSchema = z.object({
  slug,
  event_id: uuid,
  email: z.string().trim().email("Enter a valid email.").max(254),
  role: z.enum(STAFF_ROLES),
});

export const revokeRoleSchema = z.object({
  slug,
  event_id: uuid,
  user_id: uuid,
  role: z.enum(STAFF_ROLES),
});

export const volunteerAssignmentSchema = z.object({
  slug,
  event_id: uuid,
  room_id: uuid,
  user_id: uuid,
});

export const coordinatorAssignmentSchema = z.object({
  slug,
  event_id: uuid,
  user_id: uuid,
  room_id: z.preprocess((value) => (value === "" ? null : value), z.string().uuid().nullable()),
});

const scheduleFields = {
  slug,
  event_id: uuid,
  day_date: dateOnly,
  time_label: optionalText(80),
  title: z.string().trim().min(1, "Enter a title.").max(180),
  description: optionalText(2000),
  location: optionalText(120),
  kind: z.enum(SCHEDULE_KINDS),
  sequence: z.coerce.number().int().min(0).max(999),
  is_published: checkbox,
};

export const scheduleItemSchema = z.object(scheduleFields);
export const scheduleItemUpdateSchema = z.object({ ...scheduleFields, item_id: uuid });
export const scheduleItemActionSchema = z.object({ slug, event_id: uuid, item_id: uuid });
export const schedulePublishSchema = scheduleItemActionSchema.extend({ is_published: checkbox });

export const announcementSchema = z.object({
  slug,
  event_id: uuid,
  title: z.string().trim().min(3, "Enter an announcement title.").max(140),
  body: z.string().trim().min(1, "Write the announcement.").max(4000),
  audience: z.enum(ANNOUNCEMENT_AUDIENCES),
  is_pinned: checkbox,
});

export const announcementActionSchema = z.object({ slug, event_id: uuid, announcement_id: uuid });
export const announcementPinSchema = announcementActionSchema.extend({ is_pinned: checkbox });

const challengeSectionSchema = z.object({
  id: z.string().trim().min(1).max(64),
  heading: z.string().trim().min(2, "Section headings need at least 2 characters.").max(140),
  body: z.string().trim().min(1, "A section needs body text.").max(8000),
});

const sectionsJson = z.string().transform((value, ctx) => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    ctx.addIssue({ code: "custom", message: "Sections could not be read. Reload and try again." });
    return z.NEVER;
  }
  const result = z.array(challengeSectionSchema).max(24).safeParse(parsed);
  if (!result.success) {
    ctx.addIssue({ code: "custom", message: "Check every challenge section." });
    return z.NEVER;
  }
  return result.data;
});

export const challengeSchema = z.object({
  slug,
  event_id: uuid,
  title: z.string().trim().min(2, "Enter a challenge title.").max(180),
  summary: optionalText(2000),
  sections: sectionsJson,
  publish: checkbox,
});

export function principalErrors(error: z.ZodError) {
  return z.flattenError(error).fieldErrors as Record<string, string[]>;
}
