const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** True for a real "YYYY-MM-DD" date, false for "DATE_HERE" or anything else. */
export function isRealDate(date: string): boolean {
  return ISO_DATE.test(date);
}

/** "2026-11-27" -> "fri, nov 27, 2026". Pure string math, no timezone shifts. */
export function formatEventDate(date: string): string {
  if (!isRealDate(date)) return "";
  const [y, m, d] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${WEEKDAYS[weekday]}, ${MONTHS[m - 1]} ${d}, ${y}`;
}

/** "2026-11-27" + 1 -> "2026-11-28". Calendar math in UTC, so no DST effects. */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** "2026-11-27" -> { weekday: "fri", month: "nov", day: "27" } for date blocks. */
export function dateParts(date: string): { weekday: string; month: string; day: string } | null {
  if (!isRealDate(date)) return null;
  const [y, m, d] = date.split("-").map(Number);
  return { weekday: WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()], month: MONTHS[m - 1], day: String(d) };
}
