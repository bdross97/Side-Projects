"use client";

import { useState } from "react";
import { events } from "@/content/events";
import { site } from "@/content/site";
import { getPastShowsByYear } from "@/lib/eventState";
import { useNow } from "@/lib/useNow";
import { EventCard } from "./EventCard";
import { Lightbox, type LightboxItem } from "./Lightbox";
import { SectionHeading } from "./SectionHeading";

export function PastShowsList() {
  const groups = getPastShowsByYear(events, useNow());
  const [open, setOpen] = useState<number | null>(null);

  const withPosters = groups.flatMap((g) => g.events).filter((e) => e.poster);
  const posters: LightboxItem[] = withPosters.map((e) => e.poster!);

  if (!groups.length) return <p className="text-ink/80">{site.pastShows.empty}</p>;

  return (
    <>
      <div className="space-y-16">
        {groups.map((group) => (
          <section key={group.year || "undated"} aria-label={group.year || undefined}>
            {group.year && (
              <SectionHeading className="mb-6">{group.year}</SectionHeading>
            )}
            <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {group.events.map((e) => (
                <EventCard
                  key={e.id}
                  event={e}
                  onOpenPoster={e.poster ? () => setOpen(withPosters.indexOf(e)) : undefined}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
      <Lightbox items={posters} index={open} onClose={() => setOpen(null)} onIndexChange={setOpen} />
    </>
  );
}
