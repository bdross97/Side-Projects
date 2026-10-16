// Edit this list to add, remove, or update events.
// Leave the array empty to show the "no stops on the map yet" empty state.
// location: use "Location TBA" when the location isn't set yet.

export type Event = {
  id: string;
  date: string; // ISO format, e.g. "2026-07-18"
  title: string;
  location: string;
  time?: string; // e.g. "8:00 PM – 1:00 AM"
  lineup: string[];
  ticketUrl?: string;
  /** Link to an Instagram post for this event — shown as a small icon in the list. */
  instagramUrl?: string;
  flyerSrc?: string;
};

export const events: Event[] = [
  {
    id: "001",
    date: "2026-10-30",
    title: "The TECHOMA at Drift Lounge Alleyway",
    location: "Drift Lounge Alleyway, Salt Lake City",
    time: "8:00 PM – 1:00 AM",
    lineup: ["Kush", "Yinzey", "Spindoc", "Meridian", "Ell"],
    instagramUrl: "https://www.instagram.com/p/DeezCTEm5B1/",
    flyerSrc: "/images/event-drift-lounge-flyer.jpg",
  },
];
