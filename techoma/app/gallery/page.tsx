import type { Metadata } from "next";
import { DecodeText } from "@/components/motion/DecodeText";
import { GalleryGrid } from "@/components/ui/GalleryGrid";
import { gallery } from "@/content/gallery";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photos and clips from The TECHOMA.",
};

export default function GalleryPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-24">
      <DecodeText eyebrow="ARCHIVE" as="h1" className="mb-16 text-4xl md:text-5xl">
        Gallery
      </DecodeText>

      <GalleryGrid items={gallery} />
    </div>
  );
}
