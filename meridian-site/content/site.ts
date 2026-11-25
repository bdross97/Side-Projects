// single source of truth for all site copy.
// Every word, link, and label on the site comes from here (or the other
// files in /content). Edit once, it updates everywhere.

import type { ImageItem, VideoItem } from "./types";

export const site = {
  name: "meridian",
  // Used for absolute social-share URLs. Replace with the real domain.
  url: "https://SITE_URL_HERE.example",
  description: "house and melodic techno. salt lake city.",
  tagline: "house and melodic techno. salt lake city.",
  email: "djmeridianut@gmail.com",

  // Formspree form id (the part after formspree.io/f/). While this still
  // contains "_HERE" the form shows a "not connected yet" note and a mailto.
  formspreeId: "FORMSPREE_ID_HERE",

  nav: [
    { label: "home", href: "/" },
    { label: "bio", href: "/bio/" },
    { label: "mixes", href: "/mixes/" },
    { label: "shows", href: "/shows/" },
    { label: "past shows", href: "/past-shows/" },
    { label: "gallery", href: "/gallery/" },
    { label: "contact", href: "/contact/" },
  ],

  social: [
    { label: "instagram", icon: "instagram", href: "https://www.instagram.com/meridian.ut/" },
    { label: "youtube", icon: "youtube", href: "https://youtube.com/@meridianmusicyt" },
    { label: "soundcloud", icon: "soundcloud", href: "https://soundcloud.com/meridian-546776170" },
  ],

  brand: {
    // Favicon. The header and footer use the dark layers below.
    logoStatic: "/brand/logo-black.svg",
    // Wordmark layers, all 1000x1000 on the same canvas. The name stays put
    // and only the line animates. "light" sits on photos (hero), "dark" on
    // the sky background (header, footer). The -black files are the white
    // layers with their color set to black; same pixels, same alpha.
    wordmarkLayers: {
      light: { name: "/brand/name-no-line.png", line: "/brand/line.png" },
      dark: { name: "/brand/name-no-line-black.png", line: "/brand/line-black.png" },
    },
    wordmarkCanvas: 1000,
    // On the shared canvas the line sits on the baseline of the name. The
    // static logo has it through the middle of the letters. Measured from
    // logo-white.png: the line sits 49% down the x-height, which is 40px
    // above where line.png draws it on the 1000px canvas. Set to "0%" to use
    // the layers exactly as exported.
    wordmarkLineOffsetY: "-4%",
    wordmarkAlt: "meridian",
  },

  hero: {
    image: {
      kind: "image",
      src: "/media/photos/photo-03.jpg",
      width: 2687,
      height: 4032,
      alt: "pink and white spotted lilies in bloom among green leaves and closed buds",
      focal: "50% 58%",
    } satisfies ImageItem,
    // Optional looping video. When src is set it plays muted over the image,
    // which stays as the poster frame.
    video: {
      kind: "video",
      src: undefined,
      poster: "/media/photos/photo-03.jpg",
      width: 1920,
      height: 1080,
      alt: "",
      focal: "50% 50%",
      treatment: "none",
      label: "HERO_LOOP_HERE",
    } satisfies VideoItem,
  },

  home: {
    upcomingHeading: "upcoming",
    upcomingEmpty: "nothing announced yet.",
    allShowsLabel: "all shows",
    teaserLimit: 3,
    // Rolling banner below the upcoming shows.
    genres: [
      "melodic house",
      "progressive house",
      "melodic techno",
      "deep house",
      "organic house",
      "afro house",
      "tech house",
      "bass house",
    ] as string[],
    stripHeading: "through the lens",
    stripNote: "captured by meridian.",
    followHeading: "follow",
    // Nature loop slot. Renders a placeholder box until src is set.
    // Set to null to remove the slot entirely.
    loop: {
      kind: "video",
      src: undefined,
      poster: undefined,
      width: 1920,
      height: 1080,
      alt: "",
      focal: "50% 50%",
      treatment: "none",
      label: "NATURE_LOOP_HERE",
    } as VideoItem | null,
  },

  bio: {
    title: "bio",
    // One string per paragraph.
    text: [
      "brayden ross, known as meridian, is a music producer and dj based in salt lake city, working in melodic house and melodic techno.",
      "a meridian is a dividing line. his sound, vision and artistry live on the one between music and nature: driving grooves under wide, melodic atmospheres, outdoor sets on film, and the photography and flyer design behind everything you see here.",
    ] as string[],
    // Optional, may be removed. Delete these entries (or set to []) to hide the line.
    influences: ["colorize", "anjunadeep", "this never happened"] as string[],
    influencesLabel: "influences",
    portrait: {
      kind: "image",
      src: "/media/portraits/portrait-01.jpg",
      thumb: "/media/portraits/portrait-01-sm.jpg",
      width: 2585,
      height: 3754,
      alt: "meridian with arms crossed in a grey t-shirt, floral tattoo sleeve, looking off to the side in front of green leaves",
      focal: "45% 35%",
    } satisfies ImageItem,
    // Small flower photos scattered over the edges of the portrait.
    // spot: which edge or corner of the portrait each one overlaps.
    collage: [
      {
        spot: "top-left",
        image: {
          kind: "image",
          src: "/media/photos/photo-02.jpg",
          thumb: "/media/photos/photo-02-sm.jpg",
          width: 4032,
          height: 2687,
          alt: "a soft focus close-up of pink spotted lily petals",
          focal: "55% 50%",
        },
      },
      {
        spot: "top-right",
        image: {
          kind: "image",
          src: "/media/photos/photo-09.jpg",
          thumb: "/media/photos/photo-09-sm.jpg",
          width: 2268,
          height: 4032,
          alt: "a monarch butterfly on orange flowers in a planter, with the sun behind",
          focal: "50% 30%",
        },
      },
      {
        spot: "left",
        image: {
          kind: "image",
          src: "/media/photos/photo-01.jpg",
          thumb: "/media/photos/photo-01-sm.jpg",
          width: 3213,
          height: 5712,
          alt: "a yellow hibiscus flower with a red center",
          focal: "50% 45%",
        },
      },
      {
        spot: "bottom-right",
        image: {
          kind: "image",
          src: "/media/photos/photo-11.jpg",
          thumb: "/media/photos/photo-11-sm.jpg",
          width: 2687,
          height: 4032,
          alt: "pink roses in bloom among green leaves",
          focal: "50% 40%",
        },
      },
    ] satisfies { spot: "top-left" | "top-right" | "left" | "bottom-right"; image: ImageItem }[],
  },

  mixes: {
    title: "mixes",
    allMixesLabel: "all mixes on youtube",
    allMixesHref: "https://youtube.com/@meridianmusicyt",
    playLabel: "play",
  },

  shows: {
    title: "shows",
    subtitle: "upcoming",
    upcomingEmpty: "nothing announced yet.",
    linkLabel: "info",
    // Shown under posters marked credit: true in content/events.ts.
    flyerCredit: "flyer designed by meridian",
    withLabel: "with",
    posterLabel: "view poster",
  },

  pastShows: {
    title: "past shows",
    empty: "nothing here yet.",
  },

  gallery: {
    title: "gallery",
    flyersHeading: "flyers",
    flyersNote: "designed by meridian.",
    openLabel: "open photo",
  },

  contact: {
    title: "contact",
    bookingLabel: "booking",
    portrait: {
      kind: "image",
      src: "/media/portraits/portrait-02.jpg",
      thumb: "/media/portraits/portrait-02-sm.jpg",
      width: 2501,
      height: 2837,
      alt: "meridian in sunglasses leaning on a wooden rail, hands clasped, in front of green leaves",
      focal: "60% 40%",
    } satisfies ImageItem,
    form: {
      name: "name",
      email: "email",
      venue: "venue or event",
      date: "date",
      message: "message",
      submit: "send",
      sending: "sending",
      sent: "sent. thanks.",
      error: "that didn't go through. email instead:",
      notConnected: "the form isn't connected yet. email instead:",
      honeypot: "leave this empty",
    },
  },

  ui: {
    menu: "menu",
    close: "close",
    previous: "previous",
    next: "next",
    skipToContent: "skip to content",
    notFound: "nothing here.",
    backHome: "home",
    copyright: "meridian",
  },
} as const;

export type Site = typeof site;
