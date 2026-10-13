"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DecodeText } from "@/components/motion/DecodeText";
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

  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <DecodeText eyebrow="CONTACT" as="h1" className="mb-12 text-4xl md:text-5xl">
        Book The TECHOMA
      </DecodeText>

      <div id="form" className="scroll-mt-24">
        {site.bookingOpen ? (
          <>
            {/* Keyed on the query string so arriving from a new estimate resets the form. */}
            <BookingForm
              key={searchParams.toString()}
              defaultEventType={defaultEventType}
              estimate={estimate}
            />
            <p className="mt-6 font-sans text-xs uppercase tracking-[0.2em] text-neutral-500">
              {pricing.bookingFootnote}
            </p>
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
                className="text-white underline underline-offset-4 hover:text-sandstone"
              >
                {site.social.email}
              </a>
            </p>
          </div>
        )}
      </div>

      <div className="mt-12 flex flex-col gap-2 border-t border-neutral-800 pt-8 font-sans text-sm uppercase tracking-[0.2em] text-neutral-500">
        <a href={`mailto:${site.social.email}`} className="hover:text-sandstone">
          {site.social.email}
        </a>
        <a href={site.social.instagram} className="hover:text-sandstone">
          Instagram
        </a>
        <p className="normal-case tracking-normal text-neutral-600">
          Looking to DJ a set instead?{" "}
          <Link href="/play" className="text-white underline underline-offset-4 hover:text-sandstone">
            Play The TECHOMA
          </Link>
        </p>
      </div>
    </div>
  );
}
