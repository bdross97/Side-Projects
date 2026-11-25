// The one place that decides whether a show is upcoming or past.
// Every page and component goes through getEventState. Don't duplicate it.

import type { EventItem } from "@/content/types";
import { addDays, isRealDate } from "./dates";

export const TIME_ZONE = "America/Denver";

/** upcoming: listed on /shows. past: moved to /past-shows, in full color. */
export type EventState = "upcoming" | "past";

const denverFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

/** Wall-clock date ("YYYY-MM-DD") and time ("HH:MM:SS") in Salt Lake City. */
export function denverNow(now: Date): { date: string; time: string } {
  const parts = Object.fromEntries(denverFormat.formatToParts(now).map((p) => [p.type, p.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}:${parts.second}`,
  };
}

/** Shows run late, so a show counts as past only after 06:00 the next morning. */
const CUTOFF = "06:00:00";

export function getEventState(event: Pick<EventItem, "date">, now: Date): EventState {
  // Placeholder dates ("DATE_HERE") are always treated as past.
  if (!isRealDate(event.date)) return "past";

  const denver = denverNow(now);
  const morningAfter = addDays(event.date, 1);
  const isPast = denver.date > morningAfter || (denver.date === morningAfter && denver.time > CUTOFF);
  return isPast ? "past" : "upcoming";
}

const byDateAsc = (a: EventItem, b: EventItem) => a.date.localeCompare(b.date);
const byDateDesc = (a: EventItem, b: EventItem) => b.date.localeCompare(a.date);

/** /shows and the home teaser: upcoming shows, soonest first. */
export function getUpcoming(events: EventItem[], now: Date) {
  return events.filter((e) => getEventState(e, now) === "upcoming").sort(byDateAsc);
}

/** /past-shows: every passed show, newest first, grouped by year. Undated last. */
export function getPastShowsByYear(events: EventItem[], now: Date) {
  const past = events.filter((e) => getEventState(e, now) === "past");
  const dated = past.filter((e) => isRealDate(e.date)).sort(byDateDesc);
  const undated = past.filter((e) => !isRealDate(e.date));

  const groups: { year: string; events: EventItem[] }[] = [];
  for (const e of dated) {
    const year = e.date.slice(0, 4);
    const last = groups[groups.length - 1];
    if (last && last.year === year) last.events.push(e);
    else groups.push({ year, events: [e] });
  }
  if (undated.length) groups.push({ year: "", events: undated });
  return groups;
}
