"use client";

import Link from "next/link";
import { events } from "@/content/events";
import { site } from "@/content/site";
import { dateParts } from "@/lib/dates";
import { getUpcoming } from "@/lib/eventState";
import { useNow } from "@/lib/useNow";

/** Home page: the next few shows, upcoming only. */
export function UpcomingTeaser() {
  const next = getUpcoming(events, useNow()).slice(0, site.home.teaserLimit);

  return (
    <div className="mx-auto max-w-4xl">
      {next.length ? (
        <ul className="space-y-3">
          {next.map((e) => {
            const d = dateParts(e.date);
            const place = [e.venue, e.city].filter(Boolean).join(", ");
            return (
              <li key={e.id}>
                <Link
                  href="/shows/"
                  className="group flex items-center gap-5 border border-white/60 bg-white/45 px-5 py-4 backdrop-blur-sm transition-colors hover:bg-white/70 sm:gap-8 sm:px-8 sm:py-5"
                >
                  {d && (
                    <span className="flex w-16 shrink-0 flex-col items-center leading-none sm:w-20">
                      <span className="text-base font-medium tracking-widest text-accent sm:text-lg">{d.month}</span>
                      <span className="mt-1 font-display text-5xl font-normal sm:text-6xl">{d.day}</span>
                      <span className="mt-1.5 text-sm text-ink/80">{d.weekday}</span>
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-xl font-medium sm:text-2xl">{e.title}</span>
                    {place && <span className="mt-1 block text-base text-ink/80 sm:text-lg">{place}</span>}
                    {e.timeLabel && (
                      <span className="mt-1 block text-base font-medium text-accent sm:hidden">{e.timeLabel}</span>
                    )}
                    {e.with && (
                      <span className="mt-1 block text-base text-ink/80">
                        {e.withLabel ?? site.shows.withLabel} {e.with}
                      </span>
                    )}
                  </span>
                  {e.timeLabel && (
                    <span className="hidden shrink-0 text-xl font-medium text-accent sm:block">{e.timeLabel}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-center text-ink/80">{site.home.upcomingEmpty}</p>
      )}
      <div className="mt-8 text-center">
        <Link href="/shows/" className="line-sweep text-accent">
          {site.home.allShowsLabel}
        </Link>
      </div>
    </div>
  );
}
