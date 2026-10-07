// Edit this list to add gallery media.
// type: "image" or "video". Leave src empty to show a MediaSlot placeholder.

export type GalleryItem = {
  id: string;
  type: "image" | "video";
  src?: string;
  alt: string;
  aspect?: "square" | "portrait" | "landscape";
};

export const gallery: GalleryItem[] = [
  { id: "g01", type: "image", alt: "GALLERY_ALT_HERE", aspect: "landscape" },
  { id: "g02", type: "image", src: "/images/gallery-front.jpg", alt: "The TECHOMA, front view", aspect: "portrait" },
  { id: "g03", type: "video", alt: "GALLERY_ALT_HERE", aspect: "portrait" },
  { id: "g04", type: "image", alt: "GALLERY_ALT_HERE", aspect: "square" },
  { id: "g05", type: "image", alt: "GALLERY_ALT_HERE", aspect: "landscape" },
  { id: "g06", type: "video", alt: "GALLERY_ALT_HERE", aspect: "square" },
  { id: "g07", type: "image", src: "/images/gallery-vertical.jpg", alt: "The TECHOMA, vertical view", aspect: "portrait" },
  { id: "g08", type: "image", alt: "GALLERY_ALT_HERE", aspect: "landscape" },
  { id: "g09", type: "image", alt: "GALLERY_ALT_HERE", aspect: "square" },
];
