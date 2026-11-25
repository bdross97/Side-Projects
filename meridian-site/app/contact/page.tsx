import type { Metadata } from "next";
import { BookingForm } from "@/components/BookingForm";
import { Container } from "@/components/Container";
import { MediaSlot } from "@/components/MediaSlot";
import { Parallax } from "@/components/Parallax";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { site } from "@/content/site";

export const metadata: Metadata = { title: site.contact.title };

export default function ContactPage() {
  const { contact } = site;
  return (
    <Container className="py-16">
      <SectionHeading as="h1" className="mb-10">
        {contact.title}
      </SectionHeading>
      <div className="grid gap-12 md:grid-cols-12 md:gap-16">
        <div className="md:col-span-7">
          <p className="text-sm text-ink/80">{contact.bookingLabel}</p>
          <a href={`mailto:${site.email}`} className="mt-1 inline-block text-lg text-accent hover:underline">
            {site.email}
          </a>
          <div className="mt-12">
            <BookingForm />
          </div>
        </div>
        <Reveal className="md:col-span-5">
          <Parallax distance={40} className="aspect-[2501/2837]">
            <MediaSlot item={contact.portrait} useThumb className="h-full w-full" />
          </Parallax>
        </Reveal>
      </div>
    </Container>
  );
}
