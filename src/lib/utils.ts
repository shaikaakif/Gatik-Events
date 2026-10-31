import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function formatDate(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" },
  timeZone = "Asia/Kolkata",
) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-IN", { ...options, timeZone }).format(date);
}

export function formatTime(value: string | Date, timeZone = "Asia/Kolkata") {
  return formatDate(value, { hour: "numeric", minute: "2-digit", hour12: true }, timeZone);
}

export function formatDateTime(value: string | Date, timeZone = "Asia/Kolkata") {
  return formatDate(
    value,
    { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true },
    timeZone,
  );
}

export function relativeTime(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

export function sentenceCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function safeNextPath(value: string | null | undefined, fallback = "/events") {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}

export function eventCodePrefix(slug: string) {
  const clean = slug.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return clean.slice(0, 3) || "GEV";
}

export function isMinorSafeText(value: string) {
  return value.replace(/[\u0000-\u001F\u007F]/g, "").trim();
}

export function isPast(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.getTime() < Date.now();
}

export function toDateTimeInput(value: string | null, timeZone: string) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

export function localDateTimeToUtc(value: string, timeZone: string) {
  if (!value) return null;
  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) return null;
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  if ([year, month, day, hour, minute].some((part) => !Number.isFinite(part))) return null;

  const target = Date.UTC(year, month - 1, day, hour, minute, 0);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  let estimate = target;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = formatter.formatToParts(new Date(estimate));
    const part = (type: string) => Number(parts.find((entry) => entry.type === type)?.value ?? 0);
    const represented = Date.UTC(part("year"), part("month") - 1, part("day"), part("hour"), part("minute"), part("second"));
    estimate += target - represented;
  }
  return new Date(estimate).toISOString();
}
