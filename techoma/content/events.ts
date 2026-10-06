// Edit this list to add, remove, or update events.
// Leave the array empty to show the "no stops on the map yet" empty state.
// location: use "Location TBA" when the location isn't set yet.

export type Event = {
  id: string;
  date: string; // ISO format, e.g. "2026-07-18"
  title: string;
  location: string;
  lineup: string[];
  ticketUrl?: string;
  flyerSrc?: string;
};

export const events: Event[] = [
  // {
  //   id: "001",
  //   date: "2026-07-18",
  //   title: "EVENT_TITLE_HERE",
  //   location: "Location TBA",
  //   lineup: ["DJ_NAME_HERE"],
  //   ticketUrl: "TICKET_URL_HERE",
  //   flyerSrc: undefined,
  // },
];
