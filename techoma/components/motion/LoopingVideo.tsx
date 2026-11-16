"use client";

import { useEffect, useRef, useState } from "react";

type LoopingVideoProps = {
  src: string;
  poster?: string;
  ariaLabel?: string;
  /** Seconds dissolved between the end of one pass and the start of the next. */
  crossfadeSeconds?: number;
};

/**
 * Two stacked copies of the same clip, crossfading into each other just
 * before either one reaches its end. Masks the browser's native <video
 * loop> restart (a hard cut, sometimes a black-frame flash) behind a soft
 * dissolve instead.
 */
export function LoopingVideo({ src, poster, ariaLabel, crossfadeSeconds = 0.45 }: LoopingVideoProps) {
  const refA = useRef<HTMLVideoElement>(null);
  const refB = useRef<HTMLVideoElement>(null);
  const [frontIsA, setFrontIsA] = useState(true);
  const switchingRef = useRef(false);

  useEffect(() => {
    const a = refA.current;
    const b = refB.current;
    if (!a || !b) return;

    b.pause();
    b.currentTime = 0;

    function armSwap(active: HTMLVideoElement, standby: HTMLVideoElement, activeIsA: boolean) {
      function onTimeUpdate() {
        if (switchingRef.current) return;
        if (!active.duration || Number.isNaN(active.duration)) return;
        if (active.currentTime < active.duration - crossfadeSeconds) return;

        switchingRef.current = true;
        standby.currentTime = 0;
        standby.play().catch(() => {});
        setFrontIsA(!activeIsA);

        window.setTimeout(() => {
          active.pause();
          active.currentTime = 0;
          switchingRef.current = false;
        }, crossfadeSeconds * 1000 + 80);
      }
      active.addEventListener("timeupdate", onTimeUpdate);
      return () => active.removeEventListener("timeupdate", onTimeUpdate);
    }

    // Both videos watch their own clock; whichever is currently in front
    // arms the swap to the other, so the pair just keeps ping-ponging.
    const cleanupA = armSwap(a, b, true);
    const cleanupB = armSwap(b, a, false);
    return () => {
      cleanupA();
      cleanupB();
    };
  }, [crossfadeSeconds]);

  return (
    <div
      aria-hidden={!ariaLabel}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      className="absolute inset-0"
    >
      <video
        ref={refA}
        src={src}
        poster={poster}
        autoPlay
        muted
        playsInline
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: frontIsA ? 1 : 0, transition: `opacity ${crossfadeSeconds}s linear` }}
      />
      <video
        ref={refB}
        src={src}
        muted
        playsInline
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: frontIsA ? 0 : 1, transition: `opacity ${crossfadeSeconds}s linear` }}
      />
    </div>
  );
}
