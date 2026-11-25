import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { SectionHeading } from "@/components/SectionHeading";
import { ShowsList } from "@/components/ShowsList";
import { site } from "@/content/site";

export const metadata: Metadata = { title: site.shows.title };

export default function ShowsPage() {
  return (
    <Container className="py-16">
      <SectionHeading as="h1">{site.shows.title}</SectionHeading>
      <p className="mb-10 mt-1 text-lg text-ink/70">{site.shows.subtitle}</p>
      <ShowsList />
    </Container>
  );
}
