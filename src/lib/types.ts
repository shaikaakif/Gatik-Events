export type EventRole = "participant" | "volunteer" | "coordinator" | "principal";

export const ROLE_LABELS: Record<EventRole, string> = {
  participant: "Participant",
  volunteer: "Volunteer",
  coordinator: "Activity Coordinator",
  principal: "Principal",
};

export const ROLE_DESCRIPTIONS: Record<EventRole, string> = {
  participant: "Register, build your team, read the challenge, and follow the schedule.",
  volunteer: "Run your assigned room, verify participants, and record attendance.",
  coordinator: "Oversee authorized rooms and follow a team through to its participants.",
  principal: "Own the event: configuration, people, schedule, and operational oversight.",
};

export type Profile = {
  id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
};

export type EventSummary = {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string | null;
  poster_url: string | null;
  venue_name: string;
  venue_address: string | null;
  timezone: string;
  starts_on: string;
  ends_on: string;
  status: string;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  min_team_size: number;
  max_team_size: number;
  max_teams: number | null;
  capacity: number | null;
};

export type Membership = {
  role: EventRole;
  status: string;
};

export type ScheduleItem = {
  id: string;
  day_date: string;
  starts_at: string | null;
  ends_at: string | null;
  time_label: string | null;
  title: string;
  description: string | null;
  location: string | null;
  kind: "activity" | "break" | "ceremony" | "logistics" | "note";
  sequence: number;
  is_published: boolean;
};

export type Registration = {
  id: string;
  event_id: string;
  user_id: string;
  school_id: string;
  status: string;
  grade_year: string;
  roll_number: string | null;
  registered_at: string;
};

export type Team = {
  id: string;
  event_id: string;
  school_id: string;
  name: string;
  code: string;
  description: string | null;
  leader_user_id: string;
  status: string;
};

export type TeamMember = {
  team_id: string;
  user_id: string;
  role: "leader" | "member";
  joined_at: string;
  profile: Pick<Profile, "full_name" | "avatar_url"> | null;
};

export type Room = {
  id: string;
  event_id: string;
  name: string;
  code: string;
  location: string | null;
  team_capacity: number;
  status: "setup" | "active" | "full" | "closed" | "issue";
  status_note: string | null;
  sort_order: number;
};

export type ChallengeSection = {
  id: string;
  heading: string;
  body: string;
};

export type EventChallenge = {
  id: string;
  event_id: string;
  title: string;
  summary: string | null;
  sections: ChallengeSection[];
  is_published: boolean;
  version: number;
  updated_at: string;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  audience: string;
  is_pinned: boolean;
  published_at: string;
};

export type ActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const EMPTY_ACTION_STATE: ActionState = { status: "idle" };
