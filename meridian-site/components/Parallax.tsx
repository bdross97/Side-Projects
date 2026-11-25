"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

/**
 * Moves its children against the scroll by up to `distance` px, so layers
 * drift past each other. The frame clips; the inner layer is oversized.
 */
export function Parallax({
  children,
  className = "",
  distance = 60,
}: {
  children: React.ReactNode;
  className?: string;
  distance?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [-distance, distance]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div className="absolute -inset-y-[80px] inset-x-0" style={reduced ? undefined : { y }}>
        {children}
      </motion.div>
    </div>
  );
}
