import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { Float } from "@/components/Float";
import { MediaSlot } from "@/components/MediaSlot";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { site } from "@/content/site";

export const metadata: Metadata = { title: site.bio.title };

// Where each flower sits on the portrait, its size, and scroll drift.
// Phone offsets stay small so nothing pokes past the screen edge.
const SPOTS = {
  "top-left": { place: "-left-3 -top-6 sm:-left-12 sm:-top-12", size: "w-20 sm:w-36", drift: 24 },
  "top-right": { place: "-right-3 -top-10 sm:-right-20 sm:-top-20", size: "w-24 sm:w-44", drift: 40 },
  left: { place: "-left-4 top-1/2 sm:-left-8", size: "w-16 sm:w-28", drift: 18 },
  "bottom-right": { place: "-right-3 -bottom-10 sm:-right-20 sm:-bottom-28", size: "w-24 sm:w-48", drift: 32 },
} as const;

export default function BioPage() {
  const { bio } = site;
  return (
    <div className="overflow-x-clip">
      <Container className="py-16">
        <Reveal>
          <SectionHeading as="h1" className="mb-20">
            {bio.title}
          </SectionHeading>
        </Reveal>
        <div className="grid gap-20 pb-16 md:grid-cols-12 md:items-center md:gap-12">
          <div className="relative md:col-span-6 lg:col-span-5 lg:col-start-2">
            <Reveal>
              <MediaSlot item={bio.portrait} eager className="h-auto w-full" />
            </Reveal>
            {bio.collage.map(({ spot, image }) => {
              const s = SPOTS[spot];
              return (
                <div key={spot} className={`absolute z-10 ${s.place} ${s.size} ${spot === "left" ? "-translate-y-1/2" : ""}`}>
                  <Float distance={s.drift}>
                    <Reveal delay={0.2}>
                      <div className="shadow-lg shadow-ink/25">
                        <MediaSlot item={image} useThumb className="aspect-[4/5] h-auto w-full" />
                      </div>
                    </Reveal>
                  </Float>
                </div>
              );
            })}
          </div>
          <div className="md:col-span-6 md:pl-16 lg:col-span-5 lg:pl-24">
            <Reveal>
              <div className="space-y-5 text-lg leading-relaxed sm:text-xl">
                {bio.text.map((p) => (
                  <p key={p.slice(0, 24)}>{p}</p>
                ))}
              </div>
              {bio.influences.length > 0 && (
                <p className="mt-8 text-sm text-ink/70">
                  {bio.influencesLabel}: {bio.influences.join(", ")}
                </p>
              )}
            </Reveal>
          </div>
        </div>
      </Container>
    </div>
  );
}
