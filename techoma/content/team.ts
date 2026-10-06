// Edit this list to add, remove, or update team profiles.
// Bio, contact, and social placeholders are written in SCREAMING_SNAKE_CASE_HERE
// so they're easy to find and replace.

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string;
  photoSrc?: string;
  email: string;
  instagram: string;
};

export const team: TeamMember[] = [
  {
    id: "meridian",
    name: "Meridian",
    role: "Owner",
    bio: "BIO_HERE",
    email: "MERIDIAN_EMAIL_HERE",
    instagram: "MERIDIAN_INSTAGRAM_URL_HERE",
  },
  {
    id: "mccall-tingey",
    name: "McCall Tingey",
    role: "Owner",
    bio: "BIO_HERE",
    email: "MCCALL_EMAIL_HERE",
    instagram: "MCCALL_INSTAGRAM_URL_HERE",
  },
];
