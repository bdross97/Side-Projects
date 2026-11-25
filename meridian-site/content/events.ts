// Every show, upcoming and past. Order doesn't matter, pages sort by date.
// A show moves from /shows to /past-shows on its own, see lib/eventState.ts.
// Values marked FROM_POSTER_CONFIRM were read off the poster and need a check.

import { formatEventDate } from "@/lib/dates";
import type { EventItem, Poster } from "./types";

// name: file in public/media/posters without ".jpg" (needs a matching
// "-thumb.jpg"). width/height: pixel size of the full poster file.
// credit: true if meridian designed the flyer (adds a credit line under it).
function poster(name: string, title: string, date: string, width: number, height: number, credit = false): Poster {
  return {
    src: `/media/posters/${name}.jpg`,
    thumb: `/media/posters/${name}-thumb.jpg`,
    width,
    height,
    alt: `poster for ${title}, ${formatEventDate(date)}`,
    credit,
  };
}

export const events: EventItem[] = [
  // upcoming
  {
    id: "varley-2026-11-27",
    title: "miracle at varley",
    venue: "varley",
    city: "salt lake city",
    date: "2026-11-27",
    timeLabel: "10pm to 1am",
    poster: poster("poster-varley-nov-27", "miracle at varley", "2026-11-27", 1200, 1500),
  },
  {
    id: "varley-2026-12-19",
    title: "miracle at varley",
    venue: "varley",
    city: "salt lake city",
    date: "2026-12-19",
    timeLabel: "10pm to 1am",
    poster: poster("poster-varley-dec-19", "miracle at varley", "2026-12-19", 1200, 1500),
  },
  {
    id: "mother-2027-01-08",
    title: "meridian @ mother",
    venue: "mother cafe & bar", // FROM_POSTER_CONFIRM
    city: "salt lake city",
    date: "2027-01-08",
    timeLabel: "9pm to 1am", // FROM_POSTER_CONFIRM
    with: "kush",
    withLabel: "support by",
    poster: poster("poster-mother-jan-2027", "meridian @ mother", "2027-01-08", 1080, 1440, true),
  },

  {
    id: "apres-2026-12-12",
    title: "apres at the airstream",
    venue: "canyons",
    city: "park city",
    date: "2026-12-12",
    timeLabel: "2pm to 5pm",
    link: "https://mountaintownmusic.org/show/apres-at-the-airstream-13/",
    // placeholder flyer (canyons village logo, 350x350) until there's a real one
    poster: poster("poster-apres-airstream", "apres at the airstream", "2026-12-12", 350, 350),
  },
  {
    id: "apres-2027-01-30",
    title: "apres at the airstream",
    venue: "canyons",
    city: "park city",
    date: "2027-01-30",
    timeLabel: "2pm to 5pm",
    link: "https://mountaintownmusic.org/show/apres-at-the-airstream-13/",
    // placeholder flyer (canyons village logo, 350x350) until there's a real one
    poster: poster("poster-apres-airstream", "apres at the airstream", "2027-01-30", 350, 350),
  },
  {
    id: "apres-2027-03-20",
    title: "apres at the airstream",
    venue: "canyons",
    city: "park city",
    date: "2027-03-20",
    timeLabel: "12pm to 3pm",
    link: "https://mountaintownmusic.org/show/apres-at-the-airstream-13/",
    // placeholder flyer (canyons village logo, 350x350) until there's a real one
    poster: poster("poster-apres-airstream", "apres at the airstream", "2027-03-20", 350, 350),
  },

  // past
  {
    id: "mother-2026-11-05",
    title: "house of mother",
    venue: "mother cafe & bar", // FROM_POSTER_CONFIRM
    city: "salt lake city",
    date: "2026-11-05",
    timeLabel: "9pm to 1am",
    // POSTER_CONFIRM: assigned by the date printed on it (11.05.26).
    poster: poster("poster-hom-darkened", "house of mother", "2026-11-05", 1080, 1440, true),
  },
  {
    // id renamed from its date placeholder to match the poster date
    id: "mother-2026-11-13",
    title: "house of mother",
    venue: "mother cafe & bar", // FROM_POSTER_CONFIRM
    city: "salt lake city",
    date: "2026-11-13", // FROM_POSTER_CONFIRM (poster reads 11.13.26)
    timeLabel: "9pm to 1am", // FROM_POSTER_CONFIRM
    with: "spindoc", // FROM_POSTER_CONFIRM ("spindoc + meridian")
    // POSTER_CONFIRM: the other of the two mother posters, dated 11.13.26.
    poster: poster("poster-mother-spindoc", "house of mother", "2026-11-13", 1080, 1440, true),
  },
  {
    // id renamed from its date placeholder to match the poster date
    id: "techoma-2026-10-30",
    title: "techoma", // kept as given; the poster reads "the techoma x drift"
    venue: "the alley at drift lounge", // FROM_POSTER_CONFIRM
    city: "salt lake city", // FROM_POSTER_CONFIRM ("slc ut")
    date: "2026-10-30", // FROM_POSTER_CONFIRM (poster reads 10.30.26)
    timeLabel: "8pm to 1am", // FROM_POSTER_CONFIRM (meridian's slot on the poster: 11pm to 12am)
    with: "yinzey, kush, spindoc, ell", // FROM_POSTER_CONFIRM
    poster: poster("poster-techoma-drift", "techoma", "2026-10-30", 1200, 1600, true),
  },
  {
    id: "blend-2026-11-08",
    title: "the blend", // with the blend collective, at a utah coffee collective event
    venue: "utah coffee collective", // the host; the poster doesn't name a venue
    city: "CITY_HERE",
    date: "2026-11-08",
    with: "kush, bootlegg",
    poster: poster("poster-the-blend", "the blend", "2026-11-08", 1206, 1592),
  },
  {
    id: "lane8-afterparty-2026-09-18",
    title: "official lane 8 afterparty",
    venue: "unspoken",
    city: "ogden",
    date: "2026-09-18",
    with: "justin cornwall, ell",
    poster: poster("poster-lane8-afterparty", "official lane 8 afterparty", "2026-09-18", 900, 1600),
  },
];
