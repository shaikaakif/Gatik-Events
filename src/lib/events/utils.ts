import { DEFAULT_TIMEZONE } from "@/lib/env";

export type EventPhase = "upcoming" | "live" | "completed";

export function eventPhase(startsOn: string, endsOn: string, timezone = DEFAULT_TIMEZONE): EventPhase {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  if (today < startsOn) return "upcoming";
  if (today > endsOn) return "completed";
  return "live";
}

export function eventPhaseLabel(startsOn: string, endsOn: string, timezone = DEFAULT_TIMEZONE) {
  const phase = eventPhase(startsOn, endsOn, timezone);
  return phase === "live" ? "Live" : phase === "upcoming" ? "Upcoming" : "Completed";
}

export function eventDateRange(startsOn: string, endsOn: string, timezone = DEFAULT_TIMEZONE) {
  const start = new Date(`${startsOn}T12:00:00`);
  const end = new Date(`${endsOn}T12:00:00`);
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const startText = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: sameMonth ? undefined : "short",
    timeZone: timezone,
  }).format(start);
  const endText = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: timezone,
  }).format(end);
  return `${startText} – ${endText}`;
}

export function eventStatusLabel(status: string) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export const EVENT_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ["published", "registration_open", "archived"],
  published: ["registration_open", "registration_closed", "in_progress", "archived"],
  registration_open: ["registration_closed", "in_progress", "archived"],
  registration_closed: ["registration_open", "in_progress", "archived"],
  in_progress: ["completed", "archived"],
  completed: ["archived", "in_progress"],
  archived: [],
};

export function nextEventStatuses(status: string) {
  return EVENT_STATUS_TRANSITIONS[status] ?? [];
}

export function canRegister(status: string, opensAt: string | null, closesAt: string | null) {
  if (status !== "registration_open") return false;
  const now = Date.now();
  if (opensAt && now < new Date(opensAt).getTime()) return false;
  if (closesAt && now > new Date(closesAt).getTime()) return false;
  return true;
}
