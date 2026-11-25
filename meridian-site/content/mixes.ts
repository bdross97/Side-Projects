// YouTube mixes, in display order. The featured one renders first and larger.
// The rest of the channel is behind the "all mixes on youtube" link.
// youtubeId is the part after youtu.be/ in the share link.
// Titles are shortened from the youtube video titles (checked 2026-11-24).

import type { Mix } from "./types";

export const mixes: Mix[] = [
  { youtubeId: "SNT7Kmhy1Fo", url: "https://youtu.be/SNT7Kmhy1Fo", title: "sunrise set, kodachrome basin", featured: true },
  { youtubeId: "0zLaxHP26Kg", url: "https://youtu.be/0zLaxHP26Kg", title: "midnight set" },
  { youtubeId: "EASGIN0uwOw", url: "https://youtu.be/EASGIN0uwOw", title: "summer storm set" },
  { youtubeId: "QhuoAt4reNI", url: "https://youtu.be/QhuoAt4reNI", title: "sunset sessions vol. 5" },
];
