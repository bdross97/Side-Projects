// Single source of truth for all site copy, links, and specs.
// Edit this file to update text anywhere on the site.

export const site = {
  name: "The TECHOMA",
  wordmark: "TECHOMA",
  tagline: "Four-wheel-drive guerrilla sound.",

  // Toyota paint code 4V6 ("Quicksand" sandstone/beige) — the truck's actual
  // color, used as the one deliberate accent, exclusively on the ConeMark motif.
  truckColor: "#C6B296",

  missionHeading: "No venue required.",

  mission:
    "The TECHOMA is a lifted 4x4 sound rig built to roam. It fits in a parking space, climbs to the trailhead, and slips down any alley.",

  // Top-left micro-label on the home hero.
  heroSignalLabel: "ROAMING",

  // Current status, shown in the footer as "STATUS: {status}".
  status: "ROAMING",

  // Shown wherever an events list has nothing to show.
  emptyStateMessage: "No stops on the map yet. Stay close.",

  // Shown after a successful booking form submission.
  bookingSuccess: {
    title: "Message received.",
    subtitle: "The TECHOMA will be in touch.",
  },

  description: [
    "The TECHOMA is a mobile sound rig built on a lifted 4x4 Tacoma. Two tops on the rack, an 18-inch sub on the ground, and decks on the tailgate. It sets up in minutes and packs down just as fast.",
    "It runs two ways. Off grid, an onboard battery system powers the full rig quietly with no generator. Where power is available, it plugs straight in and runs as long as the night does.",
    "It's built for range. Upgraded suspension and bigger tires take it down dirt roads, up canyon pull-offs, and out to open desert. Its compact frame lets it slide into a parking lot, a side street, or a gap between buildings and turn it into a dance floor.",
    "The TECHOMA hosts its own pop-up events and is available for block parties, outdoor gatherings, private bookings, and guest DJs.",
  ],

  nav: [
    { label: "Home", href: "/" },
    { label: "The Rig", href: "/the-rig" },
    { label: "Territory", href: "/reach" },
    { label: "Team", href: "/team" },
    { label: "Events", href: "/events" },
    { label: "Gallery", href: "/gallery" },
    { label: "Book", href: "/book" },
  ],

  social: {
    instagram: "https://www.instagram.com/the_techoma/",
    email: "info@thetechoma.com",
  },

  marquee:
    "MELODIC HOUSE · MELODIC TECHNO · TECH HOUSE · HOUSE · TECHNO · PROGRESSIVE · DEEP HOUSE · AFRO HOUSE · ORGANIC HOUSE · PEAK TIME TECHNO · BASS HOUSE · MINIMAL ·",

  useCases: [
    {
      slug: "remote-outdoor",
      label: "Off Road",
      index: "001",
      summary:
        "Dirt roads, trailheads, canyon pull-offs, and desert flats. If four wheels can get there, so can the sound.",
    },
    {
      slug: "urban-popups",
      label: "Street Level",
      index: "002",
      summary:
        "A parking stall, a back alley, an empty lot. Pull in, set up, and turn dead space into a dance floor.",
    },
    {
      slug: "private-events",
      label: "Private",
      index: "003",
      summary:
        "Backyards, afterparties, and any night that deserves more than a speaker on a table.",
    },
  ],

  specs: [
    { label: "Tops", value: "2x Thump12A, 12\" powered speakers" },
    { label: "Sub", value: "1x Sound Town METIS, 18\" powered subwoofer" },
    { label: "Decks", value: "SPEC_VALUE_HERE" },
    { label: "Power", value: "Onboard battery system, SPEC_VALUE_HERE" },
    { label: "Setup Time", value: "SPEC_VALUE_HERE" },
    {
      label: "Footprint",
      value: "~22 ft deployed (6-ft bed Tacoma + tailgate down + 18\" sub at the grille)",
    },
  ],

  eventTypes: [
    "Remote Outdoor",
    "Urban Pop-Up",
    "Private Event",
    "Guest DJ",
    "Other",
  ] as const,

  powerOptions: ["Yes", "No", "Not sure"] as const,

  formspreeId: process.env.NEXT_PUBLIC_FORMSPREE_ID ?? "",

  seo: {
    titleDefault: "The TECHOMA — Mobile Sound Rig, Salt Lake City",
    titleTemplate: "%s — The TECHOMA",
    descriptionDefault:
      "Four-wheel-drive guerrilla sound. A lifted 4x4 sound rig built to roam. Salt Lake City.",
    siteUrl: "SITE_URL_HERE",
    ogImage: "/og-image.png",
  },
} as const;

export type UseCase = (typeof site.useCases)[number];
export type EventType = (typeof site.eventTypes)[number];
export type PowerOption = (typeof site.powerOptions)[number];
