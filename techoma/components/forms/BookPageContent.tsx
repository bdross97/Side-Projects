"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DecodeText } from "@/components/motion/DecodeText";
import { MicroLabel } from "@/components/ui/MicroLabel";
import { BookingForm } from "./BookingForm";
import { site } from "@/content/site";

export function BookPageContent() {
  const searchParams = useSearchParams();
  const presetType = searchParams.get("type");
  const defaultEventType = site.eventTypes.includes(presetType as (typeof site.eventTypes)[number])
    ? (presetType as string)
    : undefined;

  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <DecodeText eyebrow="CONTACT" as="h1" className="mb-12 text-4xl md:text-5xl">
        Book The TECHOMA
      </DecodeText>

      <div id="form" className="scroll-mt-24">
        <BookingForm key={defaultEventType ?? "none"} defaultEventType={defaultEventType} />
      </div>

      <div className="mt-12 flex flex-col gap-2 border-t border-neutral-800 pt-8 font-sans text-sm uppercase tracking-[0.2em] text-neutral-500">
        <a href={`mailto:${site.social.email}`} className="hover:text-white">
          {site.social.email}
        </a>
        <a href={site.social.instagram} className="hover:text-white">
          Instagram
        </a>
      </div>

      <section className="mt-24 border-t border-neutral-800 pt-16">
        <MicroLabel className="mb-4 block">For DJs</MicroLabel>
        <h2 className="font-display text-2xl uppercase text-white md:text-3xl">
          Play The TECHOMA
        </h2>
        <p className="mt-4 max-w-xl font-sans text-sm leading-relaxed text-neutral-400">
          Guest sets are open. Use the form above with Event Type set to Guest DJ.
        </p>
        <Link
          href="/book?type=Guest%20DJ#form"
          className="mt-6 inline-flex items-center justify-center border border-neutral-600 px-6 py-3 font-sans text-xs uppercase tracking-[0.3em] text-white transition-colors hover:border-white hover:bg-white hover:text-black"
        >
          Apply To Play
        </Link>
      </section>
    </div>
  );
}
