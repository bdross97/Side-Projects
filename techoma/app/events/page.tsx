import type { Metadata } from "next";
import { DecodeText } from "@/components/motion/DecodeText";
import { EventCard } from "@/components/ui/EventCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { MicroLabel } from "@/components/ui/MicroLabel";
import { events } from "@/content/events";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Events",
  description: "Upcoming and past stops for The TECHOMA.",
};

export default function EventsPage() {
  const today = new Date(new Date().toDateString());
  const upcoming = events
    .filter((e) => new Date(`${e.date}T00:00:00`) >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const past = events
    .filter((e) => new Date(`${e.date}T00:00:00`) < today)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="mx-auto max-w-5xl px-6 py-24">
      <DecodeText eyebrow="LOG" as="h1" className="mb-16 text-4xl md:text-5xl">
        Events
      </DecodeText>

      {events.length === 0 ? (
        <EmptyState message={site.emptyStateMessage} />
      ) : (
        <>
          <section className="mb-20">
            <MicroLabel className="mb-6 block">Upcoming</MicroLabel>
            {upcoming.length > 0 ? (
              <div className="flex flex-col">
                {upcoming.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <EmptyState message={site.emptyStateMessage} />
            )}
          </section>

          {past.length > 0 && (
            <section>
              <MicroLabel className="mb-6 block">Past</MicroLabel>
              <div className="flex flex-col">
                {past.map((event) => (
                  <EventCard key={event.id} event={event} past />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
