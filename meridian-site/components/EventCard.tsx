import { site } from "@/content/site";
import type { EventItem } from "@/content/types";
import { asset } from "@/lib/asset";
import { formatEventDate } from "@/lib/dates";

type Props = {
  event: EventItem;
  onOpenPoster?: () => void;
};

export function EventCard({ event, onOpenPoster }: Props) {
  const date = formatEventDate(event.date);
  const place = [event.venue, event.city].filter(Boolean).join(", ");
  const when = [date, event.timeLabel].filter(Boolean).join(" · ");
  const { poster } = event;

  const thumb = poster && (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={asset(poster.thumb)}
      alt={poster.alt}
      width={poster.width}
      height={poster.height}
      loading="lazy"
      decoding="async"
      className="block h-auto w-full"
    />
  );

  return (
    <article className={`flex flex-col ${poster ? "" : "border border-ink/20 p-5"}`}>
      {poster && (
        <div className="mb-4">
          {onOpenPoster ? (
            <button
              type="button"
              onClick={onOpenPoster}
              aria-label={`${site.shows.posterLabel}: ${poster.alt}`}
              className="block w-full"
            >
              {thumb}
            </button>
          ) : (
            thumb
          )}
          {poster.credit && <p className="mt-2 text-xs text-ink/70">{site.shows.flyerCredit}</p>}
        </div>
      )}
      <h3 className="text-lg font-medium">{event.title}</h3>
      {event.role && <p className="text-sm">{event.role}</p>}
      {place && <p className="text-sm text-ink/80">{place}</p>}
      {when && <p className="text-sm text-ink/80">{when}</p>}
      {event.with && (
        <p className="text-sm text-ink/80">
          {event.withLabel ?? site.shows.withLabel} {event.with}
        </p>
      )}
      {event.link && (
        <a
          href={event.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 self-start border border-accent px-4 py-2 text-sm text-accent hover:bg-accent hover:text-canvas"
        >
          {site.shows.linkLabel}
        </a>
      )}
    </article>
  );
}
