import Link from "next/link";
import { Wordmark } from "@/components/motion/Wordmark";
import { HeroVideo } from "@/components/motion/HeroVideo";
import { Scanlines } from "@/components/motion/Scanlines";
import { Marquee } from "@/components/motion/Marquee";
import { Waveform } from "@/components/motion/Waveform";
import { DecodeText } from "@/components/motion/DecodeText";
import { CTALink } from "@/components/ui/CTALink";
import { MicroLabel } from "@/components/ui/MicroLabel";
import { UseCaseBlock } from "@/components/ui/UseCaseBlock";
import { EventCard } from "@/components/ui/EventCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SpotifyPlayer } from "@/components/ui/SpotifyPlayer";
import { site } from "@/content/site";
import { events } from "@/content/events";

export default function Home() {
  const upcoming = events
    .filter((e) => new Date(`${e.date}T00:00:00`) >= new Date(new Date().toDateString()))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  return (
    <>
      <section className="relative flex min-h-[88vh] flex-col items-center justify-center overflow-hidden px-6 text-center">
        <HeroVideo src="/videos/hero-loop.mp4" poster="/images/hero-loop-poster.jpg" />
        <Scanlines />

        <div className="absolute left-6 top-6">
          <MicroLabel>{site.heroSignalLabel}</MicroLabel>
        </div>

        {/* Needs its own stacking context (relative z-10): HeroVideo's overlay
            and Scanlines are position:absolute, which paints them above any
            plain, non-positioned sibling regardless of DOM order. Without
            this, only the wordmark's animated letters (which get a
            transform from Framer Motion, incidentally creating their own
            stacking context) show through — the tagline and CTA don't. */}
        <div className="relative z-10 flex flex-col items-center">
          <Wordmark size="hero" showThe className="text-white" />

          <p className="mt-8 font-sans text-sm uppercase tracking-[0.3em] text-neutral-400 md:text-base">
            {site.tagline}
          </p>

          <div className="mt-10">
            <CTALink href="/the-rig" variant="solid">
              See The Rig
            </CTALink>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h2 className="font-display text-3xl uppercase text-white md:text-4xl">
          {site.missionHeading}
        </h2>
        <p className="mt-6 font-sans text-base leading-relaxed text-neutral-300 md:text-lg">
          {site.mission}
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <DecodeText eyebrow="002" className="mb-12 text-3xl md:text-5xl">
          Territory
        </DecodeText>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {site.useCases.map((useCase) => (
            <UseCaseBlock
              key={useCase.slug}
              index={useCase.index}
              label={useCase.label}
              summary={useCase.summary}
              image={useCase.image}
            />
          ))}
        </div>
        <div className="mt-10">
          <Link
            href="/pricing"
            className="font-sans text-xs uppercase tracking-[0.3em] text-neutral-400 underline underline-offset-4 transition-colors hover:text-sandstone"
          >
            See pricing
          </Link>
        </div>
      </section>

      <Marquee text={site.marquee} className="my-4" />

      <section className="mx-auto max-w-5xl px-6 py-16">
        <DecodeText eyebrow="003" className="mb-12 text-3xl md:text-5xl">
          Next Stop
        </DecodeText>

        {upcoming.length > 0 ? (
          <div className="flex flex-col">
            {upcoming.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <EmptyState message={site.emptyStateMessage} />
        )}

        <div className="mt-10 flex justify-center">
          <CTALink href="/events">All Events</CTALink>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6">
        <Waveform />
      </div>

      <SpotifyPlayer playlistUrl={site.spotifyPlaylistUrl} />

      <section className="mx-auto max-w-2xl px-6 py-24 text-center">
        <MicroLabel className="mb-4 block">Follow</MicroLabel>
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-8">
          <Link
            href={site.social.instagram}
            className="font-display text-3xl uppercase text-white transition-colors hover:text-sandstone md:text-4xl"
          >
            Instagram
          </Link>
          <Link
            href={site.social.youtube}
            className="font-display text-3xl uppercase text-white transition-colors hover:text-sandstone md:text-4xl"
          >
            YouTube
          </Link>
        </div>
      </section>
    </>
  );
}
