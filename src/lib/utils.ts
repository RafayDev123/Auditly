import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(input: string | Date | null | undefined) {
  if (!input) return "—";
  const date = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatRelativeTime(input: string | Date | null | undefined) {
  if (!input) return "—";
  const date = typeof input === "string" ? new Date(input) : input;
  const diff = date.getTime() - Date.now();
  const mins = Math.round(diff / 60000);
  if (Math.abs(mins) < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (Math.abs(hrs) < 24) return `${hrs}h`;
  const days = Math.round(hrs / 24);
  return `${days}d`;
}

export function scoreStatus(score: number) {
  if (score >= 90) return "healthy";
  if (score >= 75) return "good";
  if (score >= 50) return "needs-improvement";
  return "critical";
}
