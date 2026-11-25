import { Container } from "@/components/Container";
import { Marquee } from "@/components/Marquee";
import { MediaSlot } from "@/components/MediaSlot";
import { MeridianLine } from "@/components/MeridianLine";
import { PhotoStrip } from "@/components/PhotoStrip";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { SocialLinks } from "@/components/SocialLinks";
import { UpcomingTeaser } from "@/components/UpcomingTeaser";
import { Wordmark } from "@/components/Wordmark";
import { site } from "@/content/site";

// The hero photo fades out into the sky background from 60% down.
const FADE_OUT = "[mask-image:linear-gradient(to_bottom,#000_60%,transparent_100%)]";

export default function Home() {
  const { hero, home } = site;
  return (
    <>
      <section className="relative isolate -mt-14 flex h-svh min-h-[34rem] items-start justify-center overflow-hidden">
        <div aria-hidden="true" className={`absolute inset-0 -z-10 ${FADE_OUT}`}>
          <div className="drift-soft h-full w-full">
            <MediaSlot item={hero.image} eager className="h-full w-full" />
            {hero.video.src && <MediaSlot item={hero.video} className="absolute inset-0 h-full w-full" />}
          </div>
        </div>
        {/* soft shade behind the wordmark and under the header; the rest stays bright */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 55% 22% at 50% 42%, rgb(43 34 48 / 0.38), rgb(43 34 48 / 0) 100%), linear-gradient(to bottom, rgb(43 34 48 / 0.15), rgb(43 34 48 / 0) 25%)",
          }}
        />
        <h1 className="mt-[42svh] w-[min(88vw,44rem)] -translate-y-1/2">
          <Wordmark tone="light" intro />
        </h1>
      </section>

      {/* its own section below the photo, with breathing room for the fade */}
      <Container className="pb-20 pt-16 sm:pt-24">
        <Reveal>
          <SectionHeading large className="mb-10 text-center">
            {home.upcomingHeading}
          </SectionHeading>
          <UpcomingTeaser />
        </Reveal>
      </Container>

      <section aria-label={home.genres.join(", ")} className="py-8">
        <Marquee seconds={40} className="border-y border-ink/15 py-3">
          {home.genres.map((g) => (
            <span key={g} className="flex items-center whitespace-nowrap font-display text-lg font-light sm:text-2xl">
              {g}
              <span aria-hidden="true" className="mx-5 inline-block h-px w-8 bg-accent sm:mx-8 sm:w-12" />
            </span>
          ))}
        </Marquee>
      </section>

      <section className="py-16">
        <Container>
          <Reveal className="mb-8">
            <SectionHeading>{home.stripHeading}</SectionHeading>
            <p className="mt-2 text-sm text-ink/70">{home.stripNote}</p>
          </Reveal>
        </Container>
        <PhotoStrip />
      </section>

      {home.loop && (
        <>
          <MeridianLine />
          <Container className="py-20">
            <Reveal>
              <MediaSlot item={home.loop} className="mx-auto h-auto w-full max-w-3xl" />
            </Reveal>
          </Container>
        </>
      )}

      <MeridianLine />
      <Container className="py-24">
        <Reveal className="flex flex-col items-center">
          <SectionHeading large className="mb-10 text-center">
            {home.followHeading}
          </SectionHeading>
          <SocialLinks size="lg" className="justify-center" />
        </Reveal>
      </Container>
    </>
  );
}
