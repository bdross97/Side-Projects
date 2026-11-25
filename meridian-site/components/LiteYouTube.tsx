"use client";

import { useState } from "react";
import { site } from "@/content/site";
import type { Mix } from "@/content/types";

/**
 * Poster image and a play button. The YouTube iframe only loads on click,
 * so the page doesn't pull in five players up front.
 */
export function LiteYouTube({ mix, eager = false }: { mix: Mix; eager?: boolean }) {
  const [playing, setPlaying] = useState(false);

  return (
    <figure>
      <div className="relative aspect-video w-full overflow-hidden bg-ink/5">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${mix.youtubeId}?autoplay=1&rel=0`}
            title={mix.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`${site.mixes.playLabel}: ${mix.title}`}
            className="group absolute inset-0 h-full w-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://i.ytimg.com/vi/${mix.youtubeId}/hqdefault.jpg`}
              alt=""
              width={480}
              height={360}
              loading={eager ? "eager" : "lazy"}
              decoding="async"
              className="h-full w-full object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-canvas/30">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-ink bg-canvas/60 group-hover:border-accent">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="ml-1 h-5 w-5 fill-ink group-hover:fill-accent">
                  <path d="M6 4l14 8-14 8z" />
                </svg>
              </span>
            </span>
          </button>
        )}
      </div>
      <figcaption className="mt-3 text-sm">{mix.title}</figcaption>
    </figure>
  );
}
