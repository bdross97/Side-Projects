import { describe, expect, it } from "vitest";
import { events } from "@/content/events";
import { denverNow, getEventState, getPastShowsByYear, getUpcoming } from "./eventState";

// Times are written in UTC so the tests don't depend on the machine's zone.
// Salt Lake City is UTC-7 (MST) in winter and UTC-6 (MDT) in summer.
const at = (iso: string) => new Date(iso);
const show = { date: "2026-11-27" };

describe("getEventState", () => {
  it("is upcoming before the show", () => {
    expect(getEventState(show, at("2026-11-20T19:00:00Z"))).toBe("upcoming");
  });

  it("is upcoming the evening of the show (10pm denver)", () => {
    expect(getEventState(show, at("2026-11-28T05:00:00Z"))).toBe("upcoming");
  });

  it("is still upcoming at 05:00 the next morning", () => {
    expect(getEventState(show, at("2026-11-28T12:00:00Z"))).toBe("upcoming");
  });

  it("is upcoming at exactly 06:00 and past one second later", () => {
    expect(getEventState(show, at("2026-11-28T13:00:00Z"))).toBe("upcoming");
    expect(getEventState(show, at("2026-11-28T13:00:01Z"))).toBe("past");
  });

  it("is past at 07:00 the next morning", () => {
    expect(getEventState(show, at("2026-11-28T14:00:00Z"))).toBe("past");
  });

  it("treats a placeholder date as past", () => {
    expect(getEventState({ date: "DATE_HERE" }, at("2020-01-01T00:00:00Z"))).toBe("past");
  });

  it("uses denver time across the fall daylight saving change (nov 1 2026)", () => {
    // Show on oct 31. Clocks fall back at 02:00 on nov 1, so 06:00 MST is 13:00Z.
    // A fixed MDT offset would wrongly call 12:30Z "06:30" and mark it past.
    const halloween = { date: "2026-10-31" };
    expect(denverNow(at("2026-11-01T12:30:00Z"))).toEqual({ date: "2026-11-01", time: "05:30:00" });
    expect(getEventState(halloween, at("2026-11-01T12:30:00Z"))).toBe("upcoming");
    expect(getEventState(halloween, at("2026-11-01T13:30:00Z"))).toBe("past");
  });

  it("uses denver time across the spring daylight saving change (mar 14 2027)", () => {
    // Clocks spring forward at 02:00 on mar 14, so 06:00 MDT is 12:00Z.
    const show = { date: "2027-03-13" };
    expect(getEventState(show, at("2027-03-14T11:30:00Z"))).toBe("upcoming");
    expect(getEventState(show, at("2027-03-14T12:30:00Z"))).toBe("past");
  });

  it("ignores the visitor's own time zone", () => {
    // 23:00 on nov 28 in denver is already nov 29 in UTC and later in asia.
    const late = at("2026-11-29T06:00:00Z");
    expect(denverNow(late).date).toBe("2026-11-28");
  });
});

describe("listings with the real event list", () => {
  it("on 2026-11-28: nov 27 leaves /shows and is first on /past-shows, in full", () => {
    const now = at("2026-11-28T19:00:00Z");
    expect(getUpcoming(events, now).map((e) => e.id)).toEqual([
      "sundays-best-2026-12-05",
      "apres-2026-12-12",
      "varley-2026-12-19",
      "mother-2027-01-08",
      "apres-2027-01-30",
      "apres-2027-03-20",
    ]);
    const past = getPastShowsByYear(events, now).flatMap((g) => g.events.map((e) => e.id));
    expect(past[0]).toBe("varley-2026-11-27");
  });

  it("on 2027-02-01: only march is upcoming, january shows on /past-shows", () => {
    const now = at("2027-02-01T19:00:00Z");
    expect(getUpcoming(events, now).map((e) => e.id)).toEqual(["apres-2027-03-20"]);
    const groups = getPastShowsByYear(events, now);
    expect(groups.map((g) => g.year)).toEqual(["2027", "2026"]);
    expect(groups[0].events.map((e) => e.id)).toEqual(["apres-2027-01-30", "mother-2027-01-08"]);
    expect(groups.flatMap((g) => g.events)).toHaveLength(events.length - 1);
  });
});
