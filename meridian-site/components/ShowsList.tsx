"use client";

import { useState } from "react";
import { events } from "@/content/events";
import { site } from "@/content/site";
import { getUpcoming } from "@/lib/eventState";
import { useNow } from "@/lib/useNow";
import { EventCard } from "./EventCard";
import { Lightbox, type LightboxItem } from "./Lightbox";

/** Upcoming shows only. Once a show passes it moves to /past-shows. */
export function ShowsList() {
  const upcoming = getUpcoming(events, useNow());
  const [open, setOpen] = useState<number | null>(null);

  const withPosters = upcoming.filter((e) => e.poster);
  const posters: LightboxItem[] = withPosters.map((e) => e.poster!);

  if (!upcoming.length) return <p className="text-ink/80">{site.shows.upcomingEmpty}</p>;

  return (
    <>
      <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {upcoming.map((e) => (
          <EventCard key={e.id} event={e} onOpenPoster={e.poster ? () => setOpen(withPosters.indexOf(e)) : undefined} />
        ))}
      </div>
      <Lightbox items={posters} index={open} onClose={() => setOpen(null)} onIndexChange={setOpen} />
    </>
  );
}
