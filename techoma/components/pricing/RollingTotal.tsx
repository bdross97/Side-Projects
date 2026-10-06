"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/components/motion/useReducedMotion";

/**
 * Renders a short string where each digit rolls up into place whenever the
 * value changes. Non-digit characters are static. Reduced motion shows the
 * value without animation.
 */
export function RollingTotal({ value }: { value: string }) {
  const reducedMotion = useReducedMotion();
  const chars = Array.from(value);

  return (
    <span className="inline-block overflow-hidden whitespace-pre align-top tabular-nums">
      {chars.map((char, index) => {
        // Keying on the character remounts only the digits that changed, so
        // each one re-runs its roll-in.
        const key = `${chars.length}-${index}-${char}`;
        if (reducedMotion || !/\d/.test(char)) {
          return <span key={key}>{char}</span>;
        }
        return (
          <motion.span
            key={key}
            className="inline-block"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {char}
          </motion.span>
        );
      })}
    </span>
  );
}
