import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { PastShowsList } from "@/components/PastShowsList";
import { SectionHeading } from "@/components/SectionHeading";
import { site } from "@/content/site";

export const metadata: Metadata = { title: site.pastShows.title };

export default function PastShowsPage() {
  return (
    <Container className="py-16">
      <SectionHeading as="h1" className="mb-10">
        {site.pastShows.title}
      </SectionHeading>
      <PastShowsList />
    </Container>
  );
}
