import type { Metadata } from "next";
import { DecodeText } from "@/components/motion/DecodeText";
import { DjApplicationForm } from "@/components/forms/DjApplicationForm";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Play The TECHOMA",
  description:
    "Apply to play a guest set with The TECHOMA. Share your socials, genres, and a sample mix.",
};

export default function PlayPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <DecodeText eyebrow="DJ" as="h1" className="mb-6 text-4xl md:text-5xl">
        Play The TECHOMA
      </DecodeText>
      <p className="mb-12 max-w-xl font-sans text-sm leading-relaxed text-neutral-400">
        {site.playIntro}
      </p>

      <div id="form" className="scroll-mt-24">
        <DjApplicationForm />
      </div>

      <div className="mt-12 flex flex-col gap-2 border-t border-neutral-800 pt-8 font-sans text-sm uppercase tracking-[0.2em] text-neutral-500">
        <a href={`mailto:${site.social.email}`} className="hover:text-white">
          {site.social.email}
        </a>
        <a href={site.social.instagram} className="hover:text-white">
          Instagram
        </a>
      </div>
    </div>
  );
}
