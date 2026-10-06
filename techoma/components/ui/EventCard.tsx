import type { Event } from "@/content/events";
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
        <h3 className="font-display text-xl uppercase text-white md:text-2xl">{event.title}</h3>
        <p className="font-sans text-sm text-neutral-400">{event.location}</p>
        {event.lineup.length > 0 && (
          <p className="font-sans text-xs uppercase tracking-[0.2em] text-neutral-500">
            {event.lineup.join(" · ")}
          </p>
        )}
        {event.ticketUrl && !past && (
          <a
            href={event.ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block font-sans text-xs uppercase tracking-[0.3em] text-white underline underline-offset-4 hover:text-neutral-400"
          >
            Tickets
          </a>
        )}
      </div>

      <MediaSlot
        src={event.flyerSrc}
        alt={`${event.title} flyer`}
        label="FLYER · 4:5"
        aspect="4/5"
      />
    </article>
  );
}
