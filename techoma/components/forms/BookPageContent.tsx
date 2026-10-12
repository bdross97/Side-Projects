"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DecodeText } from "@/components/motion/DecodeText";
import { MicroLabel } from "@/components/ui/MicroLabel";
import { BookingForm } from "./BookingForm";
import { site } from "@/content/site";
import { pricing } from "@/content/pricing";
import { selectionFromParams } from "@/lib/estimate";

export function BookPageContent() {
  const searchParams = useSearchParams();
  const presetType = searchParams.get("type");
  const defaultEventType = site.eventTypes.includes(presetType as (typeof site.eventTypes)[number])
    ? (presetType as string)
    : undefined;
  const estimate = selectionFromParams(searchParams);

  // Guest DJ applications stay open even while general booking is paused.
  const isDjApply = defaultEventType === "Guest DJ";
  const showForm = isDjApply || site.bookingOpen;

  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <DecodeText
        eyebrow={isDjApply ? "DJ" : "CONTACT"}
        as="h1"
        className="mb-12 text-4xl md:text-5xl"
      >
        {isDjApply ? "Play The TECHOMA" : "Book The TECHOMA"}
      </DecodeText>

      <div id="form" className="scroll-mt-24">
        {showForm ? (
          <>
            {/* Keyed on the query string so arriving from a new estimate resets the form. */}
            <BookingForm
              key={searchParams.toString()}
              defaultEventType={defaultEventType}
              estimate={estimate}
              mode={isDjApply ? "dj" : "booking"}
            />
            {site.bookingOpen && !isDjApply && (
              <p className="mt-6 font-sans text-xs uppercase tracking-[0.2em] text-neutral-500">
                {pricing.bookingFootnote}
              </p>
            )}
          </>
        ) : (
          <div className="border border-neutral-800 p-8 text-center">
            <p className="font-sans text-sm uppercase tracking-[0.25em] text-white">
              {site.bookingPendingMessage}
            </p>
            <p className="mt-2 font-sans text-sm text-neutral-500">
              {site.bookingPendingSubtitle}
            </p>
            <p className="mt-3 font-sans text-sm text-neutral-500">
              <a
                href={`mailto:${site.social.email}`}
                className="text-white underline underline-offset-4"
              >
                {site.social.email}
              </a>
            </p>
          </div>
        )}
      </div>

      <div className="mt-12 flex flex-col gap-2 border-t border-neutral-800 pt-8 font-sans text-sm uppercase tracking-[0.2em] text-neutral-500">
        <a href={`mailto:${site.social.email}`} className="hover:text-white">
          {site.social.email}
        </a>
        <a href={site.social.instagram} className="hover:text-white">
          Instagram
        </a>
      </div>

      {!isDjApply && (
        <section className="mt-24 border-t border-neutral-800 pt-16">
          <MicroLabel className="mb-4 block">For DJs</MicroLabel>
          <h2 className="font-display text-2xl uppercase text-white md:text-3xl">
            Play The TECHOMA
          </h2>
          <p className="mt-4 max-w-xl font-sans text-sm leading-relaxed text-neutral-400">
            Guest sets are open. Apply below and the crew will follow up.
          </p>
          <Link
            href="/book?type=Guest%20DJ#form"
            className="mt-6 inline-flex items-center justify-center border border-neutral-600 px-6 py-3 font-sans text-xs uppercase tracking-[0.3em] text-white transition-colors hover:border-white hover:bg-white hover:text-black"
          >
            Apply To Play
          </Link>
        </section>
      )}
    </div>
  );
}
