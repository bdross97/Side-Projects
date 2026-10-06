"use client";

import { useRef, useState, type ElementType } from "react";
import { motion, useInView } from "framer-motion";
import { useScramble } from "./useScramble";
import { useReducedMotion } from "./useReducedMotion";
import { cn } from "@/lib/utils";

type DecodeTextProps = {
  children: string;
  as?: ElementType;
  className?: string;
  /** micro-label index/eyebrow shown above, e.g. "002" */
  eyebrow?: string;
};

/**
 * A lighter decode effect for section headers: scrambles in once when it
 * first scrolls into view, then stays resolved.
 */
export function DecodeText({ children, as = "h2", className, eyebrow }: DecodeTextProps) {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [started, setStarted] = useState(reducedMotion);

  if (inView && !started) setStarted(true);

  const letters = useScramble(children, {
    skip: !started,
    baseDelayMs: 0,
    staggerMs: 28,
    cycleMs: 40,
  });

  const Tag = as;

  return (
    <div ref={ref} className={cn("inline-block", className)}>
      {eyebrow && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: started ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          className="mb-2 font-sans text-xs uppercase tracking-[0.3em] text-neutral-500"
        >
          {eyebrow}
        </motion.div>
      )}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: started ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <Tag className="font-display uppercase leading-none">
          {letters.map((letter, index) => (
            <span key={index}>{letter.char}</span>
          ))}
        </Tag>
      </motion.div>
    </div>
  );
}
