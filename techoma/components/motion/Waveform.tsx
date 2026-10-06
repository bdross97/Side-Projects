"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useReducedMotion } from "./useReducedMotion";
import { cn } from "@/lib/utils";

const BAR_COUNT = 40;

// Deterministic base pattern so server and client render identical markup
// before the client-only randomization effect takes over.
const BASE_HEIGHTS = Array.from({ length: BAR_COUNT }, (_, i) => {
  const wave = Math.sin(i * 0.45) * 0.5 + 0.5;
  return 0.15 + wave * 0.7;
});

function randomHeights() {
  return Array.from({ length: BAR_COUNT }, () => 0.1 + Math.random() * 0.9);
}

/**
 * A faux audio spectrum used as a section divider. Not driven by real
 * audio — just a simulated, slowly shifting bar pattern.
 */
export function Waveform({ className }: { className?: string }) {
  const reducedMotion = useReducedMotion();
  const [heights, setHeights] = useState(BASE_HEIGHTS);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-10% 0px" });

  useEffect(() => {
    if (reducedMotion || !inView) return;
    const interval = setInterval(() => setHeights(randomHeights()), 900);
    return () => clearInterval(interval);
  }, [reducedMotion, inView]);

  return (
    <div
      ref={ref}
      role="presentation"
      aria-hidden
      className={cn("flex h-12 w-full items-center gap-[3px]", className)}
    >
      {heights.map((h, i) => (
        <motion.div
          key={i}
          className="flex-1 bg-neutral-600"
          animate={{ height: `${h * 100}%` }}
          transition={{ duration: 0.85, ease: "easeInOut" }}
          style={{ minHeight: 2 }}
        />
      ))}
    </div>
  );
}
