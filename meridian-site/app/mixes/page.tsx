import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { LiteYouTube } from "@/components/LiteYouTube";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { mixes } from "@/content/mixes";
import { site } from "@/content/site";

export const metadata: Metadata = { title: site.mixes.title };

export default function MixesPage() {
  const featured = mixes.find((m) => m.featured) ?? mixes[0];
  const rest = mixes.filter((m) => m !== featured);
  return (
    <Container className="py-16">
      <SectionHeading as="h1" className="mb-10">
        {site.mixes.title}
      </SectionHeading>
      {featured && (
        <Reveal>
          <LiteYouTube mix={featured} eager />
        </Reveal>
      )}
      <div className="mt-12 grid gap-x-6 gap-y-10 md:grid-cols-3">
        {rest.map((mix, i) => (
          <Reveal key={mix.youtubeId} delay={i * 0.1}>
            <LiteYouTube mix={mix} />
          </Reveal>
        ))}
      </div>
      <div className="mt-16 text-center">
        <a
          href={site.mixes.allMixesHref}
          target="_blank"
          rel="noopener noreferrer"
          className="line-sweep font-display text-2xl font-light text-accent sm:text-3xl"
        >
          {site.mixes.allMixesLabel}
        </a>
      </div>
    </Container>
  );
}
