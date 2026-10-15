"use client";

import { useEffect, useState } from "react";
import type { Event } from "@/content/events";
import { site } from "@/content/site";
import { InstagramIcon } from "./InstagramIcon";
import { MediaSlot } from "./MediaSlot";

function formatDate(iso: string) {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export function EventCard({ event, past = false }: { event: Event; past?: boolean }) {
  const [flyerOpen, setFlyerOpen] = useState(false);

  useEffect(() => {
    if (!flyerOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setFlyerOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [flyerOpen]);

  return (
    <article
      className={`grid grid-cols-1 gap-6 border-t border-neutral-800 py-8 sm:grid-cols-[120px_1fr_140px] ${
        past ? "opacity-50" : ""
      }`}
    >
      <div className="font-sans text-xs uppercase tracking-[0.3em] text-neutral-500">
        {formatDate(event.date)}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="font-display text-xl uppercase text-white md:text-2xl">
          <a
            href={site.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-sandstone"
          >
            {event.title}
          </a>
        </h3>
        <p className="font-sans text-sm text-neutral-400">
          {event.location}
          {event.time && ` · ${event.time}`}
        </p>
        {event.lineup.length > 0 && (
          <p className="font-sans text-xs uppercase tracking-[0.2em] text-neutral-500">
            {event.lineup.join(" · ")}
          </p>
        )}
        {(event.ticketUrl || event.instagramUrl) && (
          <div className="mt-1 flex items-center gap-5">
            {event.ticketUrl && !past && (
              <a
                href={event.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block font-sans text-xs uppercase tracking-[0.3em] text-white underline underline-offset-4 hover:text-sandstone"
              >
                Tickets
              </a>
            )}
            {event.instagramUrl && (
              <a
                href={event.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${event.title} on Instagram`}
                className="text-neutral-400 transition-colors hover:text-sandstone"
              >
                <InstagramIcon className="h-5 w-5" />
              </a>
            )}
          </div>
        )}
      </div>

      {event.flyerSrc ? (
        <button
          type="button"
          onClick={() => setFlyerOpen(true)}
          aria-label={`Expand ${event.title} flyer`}
          className="block w-full text-left transition-opacity hover:opacity-80"
        >
          <MediaSlot
            src={event.flyerSrc}
            alt={`${event.title} flyer`}
            label="FLYER · 4:5"
            aspect="4/5"
          />
        </button>
      ) : (
        <MediaSlot
          src={event.flyerSrc}
          alt={`${event.title} flyer`}
          label="FLYER · 4:5"
          aspect="4/5"
        />
      )}

      {flyerOpen && event.flyerSrc && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${event.title} flyer`}
          onClick={() => setFlyerOpen(false)}
        >
          <button
            type="button"
            onClick={() => setFlyerOpen(false)}
            className="absolute right-6 top-6 font-sans text-xs uppercase tracking-[0.3em] text-neutral-400 hover:text-sandstone focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            aria-label="Close"
          >
            Close
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.flyerSrc}
            alt={`${event.title} flyer`}
            className="max-h-[85vh] max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </article>
  );
}
