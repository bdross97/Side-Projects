import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { GalleryGrid } from "@/components/GalleryGrid";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { events } from "@/content/events";
import { gallery } from "@/content/gallery";
import { site } from "@/content/site";

export const metadata: Metadata = { title: site.gallery.title };

// Flyers meridian designed, newest first, straight from the show list.
const flyers = events
  .filter((e) => e.poster?.credit)
  .sort((a, b) => b.date.localeCompare(a.date))
  .map((e) => e.poster!);

export default function GalleryPage() {
  return (
    <Container className="py-16">
      <SectionHeading as="h1" className="mb-10">
        {site.gallery.title}
      </SectionHeading>
      <GalleryGrid items={gallery} />

      {flyers.length > 0 && (
        <section className="mt-24">
          <Reveal className="mb-8">
            <SectionHeading>{site.gallery.flyersHeading}</SectionHeading>
            <p className="mt-2 text-sm text-ink/70">{site.gallery.flyersNote}</p>
          </Reveal>
          <GalleryGrid items={flyers} />
        </section>
      )}
    </Container>
  );
}
