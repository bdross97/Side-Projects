"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import cityData from "@/content/maps/city-lines.json";
import trailData from "@/content/maps/trail-lines.json";
import { ConeMark } from "./ConeMark";
import { useReducedMotion } from "./useReducedMotion";
import { site } from "@/content/site";

type MapData = { viewBox: string; paths: string[] };
type MapState = "city" | "trail";
type Ping = { id: number; x: number; y: number };

function MapLayer({ data, active }: { data: MapData; active: boolean }) {
  return (
    <motion.svg
      viewBox={data.viewBox}
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      initial={false}
      animate={{ opacity: active ? 1 : 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      aria-hidden
    >
      {data.paths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="white"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </motion.svg>
  );
}

/**
 * Subtle sitewide backdrop: gray line art of downtown SLC streets, glitching
 * periodically into the Wasatch foothill trail/canyon network. On each
 * switch, a truck-colored ping briefly marks a random spot, as if showing
 * where The TECHOMA is right now.
 */
export function MapBackground() {
  const reducedMotion = useReducedMotion();
  const [state, setState] = useState<MapState>("city");
  const [glitching, setGlitching] = useState(false);
  const pingIdRef = useRef(0);
  // Deterministic null initial state (no Math.random during SSR/first render,
  // same reasoning as useScramble) — the first real ping is placed client-side
  // in the effect below.
  const [ping, setPing] = useState<Ping | null>(null);

  useEffect(() => {
    if (reducedMotion) return;

    // Place the first ping shortly after mount, client-side only.
    setPing({
      id: ++pingIdRef.current,
      x: 20 + Math.random() * 60,
      y: 20 + Math.random() * 60,
    });

    let flipTimeout: ReturnType<typeof setTimeout>;
    let glitchOffTimeout: ReturnType<typeof setTimeout>;

    const schedule = () => {
      const delay = 9000 + Math.random() * 6000;
      flipTimeout = setTimeout(() => {
        if (document.hidden) {
          schedule();
          return;
        }
        setGlitching(true);
        glitchOffTimeout = setTimeout(() => {
          setGlitching(false);
          setState((s) => (s === "city" ? "trail" : "city"));

          // Replaces the previous ping — it stays locked on this spot,
          // radar-style, until the next map switch moves it.
          setPing({
            id: ++pingIdRef.current,
            x: 20 + Math.random() * 60,
            y: 20 + Math.random() * 60,
          });
        }, 220);
        schedule();
      }, delay);
    };
    schedule();

    return () => {
      clearTimeout(flipTimeout);
      clearTimeout(glitchOffTimeout);
    };
  }, [reducedMotion]);

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-[0.11]"
      >
        <MapLayer data={cityData as MapData} active={state === "city"} />
        <MapLayer data={trailData as MapData} active={state === "trail"} />

        {glitching && !reducedMotion && (
          <>
            <div
              className="absolute inset-0 bg-white/10"
              style={{ clipPath: "inset(38% 0 42% 0)", transform: "translateX(8px)" }}
            />
            <div
              className="absolute inset-0 bg-white/10"
              style={{ clipPath: "inset(62% 0 15% 0)", transform: "translateX(-6px)" }}
            />
          </>
        )}
      </div>

      {/* Rendered at full opacity, independent of the faint map lines above,
          so the ping actually reads instead of being multiplied down with them.
          Stays locked on this spot — radar-style — until the map switches again. */}
      {ping && !reducedMotion && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        >
          <motion.div
            key={ping.id}
            className="absolute"
            style={{ left: `${ping.x}%`, top: `${ping.y}%` }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {[0, 1].map((i) => (
              <motion.div
                key={i}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ border: `1px solid ${site.truckColor}` }}
                initial={{ width: 10, height: 10, opacity: 0.8 }}
                animate={{ width: 64, height: 64, opacity: 0 }}
                transition={{
                  duration: 2.2,
                  ease: "easeOut",
                  repeat: Infinity,
                  delay: i * 1.3,
                }}
              />
            ))}
            <ConeMark size={44} animate />
          </motion.div>
        </div>
      )}
    </>
  );
}
