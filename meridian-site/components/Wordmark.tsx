"use client";

import { useAnimate } from "framer-motion";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { site } from "@/content/site";
import { asset } from "@/lib/asset";
import { WORDMARK_SESSION_KEY } from "@/lib/wordmark";

const { brand } = site;

const HIDDEN = "inset(0% 100% 0% 0%)"; // nothing drawn yet
const SHOWN = "inset(0% 0% 0% 0%)"; // full line
const GONE = "inset(0% 0% 0% 100%)"; // line has left to the right
const INTRO_DURATION = 1.2;

// The art on the 1000x1000 layer canvas sits between rows 360 and 510.
// The layers keep their square canvas; this outer window crops the empty space.
const CROP_TOP = 360;
const CROP_HEIGHT = 150;

type Mode = "pending" | "animate" | "static";
const subscribe = () => () => {};
const readMode = (): Mode => (document.documentElement.dataset.wm === "static" ? "static" : "animate");
const serverMode = (): Mode => "pending";
const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type Props = {
  /** "light" (white) on photos, "dark" (black) on the sky background */
  tone?: "light" | "dark";
  /** draw the line in on the first visit of the session (hero only) */
  intro?: boolean;
  className?: string;
};

/**
 * The meridian wordmark. The name always stays put; only the line moves.
 * The line draws through the name left to right on the first visit (intro),
 * and sweeps through again whenever the pointer moves onto the wordmark.
 */
export function Wordmark({ tone = "dark", intro = false, className = "" }: Props) {
  const layers = brand.wordmarkLayers[tone];
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const busy = useRef(false);
  const mode = useSyncExternalStore(subscribe, readMode, serverMode);

  // First visit: draw the line in. Repeat visits and reduced motion skip
  // this; the head script already showed the line before first paint.
  useEffect(() => {
    if (!intro || mode !== "animate") return;
    try {
      sessionStorage.setItem(WORDMARK_SESSION_KEY, "1");
    } catch {
      // storage blocked: it will just play again next visit
    }
    busy.current = true;
    animate(".wm-line", { clipPath: [HIDDEN, SHOWN] }, { duration: INTRO_DURATION, ease: "easeInOut" }).then(() => {
      busy.current = false;
      // Later client-side visits to the home page start with the line drawn.
      document.documentElement.dataset.wm = "static";
    });
  }, [intro, mode, animate]);

  // Hover: the line leaves to the right, then draws back in from the left,
  // so it reads as passing through the name.
  const sweep = useCallback(async () => {
    if (busy.current || prefersReducedMotion()) return;
    busy.current = true;
    await animate(".wm-line", { clipPath: [SHOWN, GONE] }, { duration: 0.35, ease: "easeIn" });
    await animate(".wm-line", { clipPath: [HIDDEN, SHOWN] }, { duration: 0.8, ease: "easeOut" });
    busy.current = false;
  }, [animate]);

  return (
    <div
      ref={scope}
      onPointerEnter={sweep}
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio: `${brand.wordmarkCanvas} / ${CROP_HEIGHT}` }}
    >
      <div className="absolute inset-x-0" style={{ top: `${(-CROP_TOP / CROP_HEIGHT) * 100}%`, aspectRatio: "1 / 1" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset(layers.name)}
          alt={brand.wordmarkAlt}
          width={brand.wordmarkCanvas}
          height={brand.wordmarkCanvas}
          className="absolute inset-0 h-full w-full"
        />
        <div className="absolute inset-0" style={{ transform: `translateY(${brand.wordmarkLineOffsetY})` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset(layers.line)}
            alt=""
            width={brand.wordmarkCanvas}
            height={brand.wordmarkCanvas}
            className={`wm-line absolute inset-0 h-full w-full ${mode === "pending" ? "" : "wm-live"}`}
            style={intro && mode !== "static" ? { clipPath: HIDDEN } : undefined}
          />
        </div>
      </div>
    </div>
  );
}
