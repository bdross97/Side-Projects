"use client";

import { useReducedMotion } from "./useReducedMotion";

type HeroVideoProps = {
  src: string;
  poster: string;
};

/**
 * Full-bleed looping background video for the home hero, with a dark
 * overlay for text legibility. Falls back to the static poster frame
 * under prefers-reduced-motion instead of autoplaying.
 */
export function HeroVideo({ src, poster }: HeroVideoProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      {reducedMotion ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt="" className="h-full w-full object-cover" />
      ) : (
        <video
          src={src}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-black/55" />
    </div>
  );
}
