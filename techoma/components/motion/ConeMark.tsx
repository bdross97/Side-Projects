"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "./useReducedMotion";
import { site } from "@/content/site";
import { cn } from "@/lib/utils";

type ConeMarkProps = {
  size?: number;
  animate?: boolean;
  className?: string;
  /** Defaults to the truck's paint color — the one deliberate accent in the palette. */
  color?: string;
};

const RINGS = [6, 11, 16];

/**
 * The speaker-cone motif: the site's recurring mark (favicon, loading screen,
 * empty states, media placeholders). Always rendered in the truck's paint
 * color — the single accent color used anywhere on the site.
 */
export function ConeMark({ size = 24, animate = true, className, color = site.truckColor }: ConeMarkProps) {
  const reducedMotion = useReducedMotion();
  const shouldAnimate = animate && !reducedMotion;

  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      style={{ color }}
      role="img"
      aria-label="TECHOMA cone mark"
    >
      <circle cx="20" cy="20" r="2" fill="currentColor" />
      {RINGS.map((radius, index) =>
        shouldAnimate ? (
          <motion.circle
            key={radius}
            cx="20"
            cy="20"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            initial={{ opacity: 0.8, scale: 0.85 }}
            animate={{ opacity: [0.8, 0, 0], scale: [0.85, 1.08, 0.85] }}
            transition={{
              duration: 3.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.5,
            }}
            style={{ transformOrigin: "20px 20px" }}
          />
        ) : (
          <circle
            key={radius}
            cx="20"
            cy="20"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity={0.5}
          />
        )
      )}
    </svg>
  );
}
