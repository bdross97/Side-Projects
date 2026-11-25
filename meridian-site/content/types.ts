export type Treatment = "none" | "inverted";

export type ImageItem = {
  kind: "image";
  src: string;
  /** smaller copy for grids; falls back to src */
  thumb?: string;
  width: number;
  height: number;
  alt: string;
  /** CSS object-position, set from where the subject actually sits */
  focal: string;
  treatment?: Treatment;
  /** gallery only: false keeps it out of the home photo strip */
  strip?: boolean;
};

export type VideoItem = {
  kind: "video";
  /** leave undefined until the file exists; MediaSlot shows a placeholder */
  src?: string;
  poster?: string;
  width: number;
  height: number;
  alt: string;
  focal: string;
  treatment?: Treatment;
  /** shown inside the placeholder box while src is missing */
  label: string;
};

export type MediaItem = ImageItem | VideoItem;

export type Poster = {
  src: string;
  thumb: string;
  width: number;
  height: number;
  alt: string;
  /** true: meridian designed this flyer; shows the credit line under it */
  credit?: boolean;
};

export type EventItem = {
  id: string;
  title: string;
  venue?: string;
  city: string;
  date: string; // "YYYY-MM-DD" (America/Denver) or "DATE_HERE"
  timeLabel?: string; // display only, e.g. "10pm" or "9pm to 1am"
  with?: string; // co-billed acts, render only if present
  withLabel?: string; // word(s) before `with`, default "with" (e.g. "support by")
  role?: string; // optional, e.g. "afterparty", render only if present
  link?: string; // render a button only if present
  poster?: Poster;
};

export type Mix = {
  youtubeId: string;
  url: string;
  title: string;
  featured?: boolean;
};
