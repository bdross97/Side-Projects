import type { RosterDJ } from "@/content/roster";

/**
 * Mirrors the DJ showcase videos' look: a black-and-white photo that fades
 * to black at the bottom (.roster-photo-mask), with the name revealed on
 * hover + letter-spacing settle the videos use for the artist name. The
 * mask lives on its own inner wrapper around just the photo — it must not
 * share a box with the name span, or the gradient fades the text itself
 * instead of just the photo underneath it. The difference here is that
 * reveal is hover-gated instead of playing once — the handle below stays
 * visible at all times. The whole card is one link, so the photo and the
 * handle both open Instagram.
 */
export function RosterCard({ dj }: { dj: RosterDJ }) {
  return (
    <a
      href={dj.instagramUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
      aria-label={`${dj.name} on Instagram`}
    >
      <div
        className="relative w-full overflow-hidden border border-neutral-800 bg-black"
        style={{ aspectRatio: "4/5" }}
      >
        <div className="roster-photo-mask absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dj.photoSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            style={{ objectPosition: "50% 30%" }}
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 flex justify-center pb-10">
          <span
            className="font-display text-3xl uppercase tracking-[0.4em] text-white opacity-0
              transition-all duration-700 ease-out
              group-hover:tracking-[0.02em] group-hover:opacity-100 md:text-4xl"
          >
            {dj.name}
          </span>
        </div>
      </div>

      <div className="mt-3 text-center font-sans text-xs uppercase tracking-[0.3em] text-neutral-400 transition-colors group-hover:text-sandstone">
        {dj.instagramHandle}
      </div>
    </a>
  );
}
