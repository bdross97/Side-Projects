// Edit this list to add, remove, or update team profiles.
// Bio, contact, and social placeholders are written in SCREAMING_SNAKE_CASE_HERE
// so they're easy to find and replace.

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string;
  photoSrc?: string;
  instagram: string;
};

export const team: TeamMember[] = [
  {
    id: "meridian",
    name: "Meridian",
    role: "Owner",
    bio: "Meridian is a house and melodic techno artist built around driving, high energy grooves layered with melodic sounds and atmospheres. His name draws from thresholds, the lines where things meet in nature, carried through in sound as motion rather than mood. He is one of the co-owners and co-creators of The TECHOMA, and loves building the local scene and making connections through music.",
    instagram: "https://www.instagram.com/meridian.ut",
  },
  {
    id: "mccall-tingey",
    name: "McCall Tingey",
    role: "Owner",
    bio: "BIO_HERE",
    instagram: "MCCALL_INSTAGRAM_URL_HERE",
  },
];
