// DJs who've played The TECHOMA. Shown on /roster, newest lineup order.

export type RosterDJ = {
  id: string;
  name: string;
  instagramHandle: string;
  instagramUrl: string;
  photoSrc: string;
};

export const roster: RosterDJ[] = [
  {
    id: "yinzey",
    name: "Yinzey",
    instagramHandle: "@soyinzey",
    instagramUrl: "https://www.instagram.com/soyinzey/",
    photoSrc: "/images/roster/yinzey-bw.jpg",
  },
  {
    id: "kush",
    name: "Kush",
    instagramHandle: "@djkush8",
    instagramUrl: "https://www.instagram.com/djkush8/",
    photoSrc: "/images/roster/kush-bw.jpg",
  },
  {
    id: "spindoc",
    name: "SpinDoc",
    instagramHandle: "@djspindoc75",
    instagramUrl: "https://www.instagram.com/djspindoc75/",
    photoSrc: "/images/roster/spindoc-bw.jpg",
  },
  {
    id: "meridian",
    name: "Meridian",
    instagramHandle: "@meridian.ut",
    instagramUrl: "https://www.instagram.com/meridian.ut/",
    photoSrc: "/images/roster/meridian-bw.jpg",
  },
  {
    id: "ell",
    name: "Ell",
    instagramHandle: "@ell.wav_",
    instagramUrl: "https://www.instagram.com/ell.wav_/",
    photoSrc: "/images/roster/ell-bw.jpg",
  },
];
