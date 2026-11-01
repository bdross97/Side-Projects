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
  /** Appends a ™ right after the text. Kept out of the scrambled `children`
   * string itself, since the display font it's set in doesn't have a ™
   * glyph — see the `.tm` class in globals.css. */
  trademark?: boolean;
};

/**
 * A lighter decode effect for section headers: scrambles in once when it
 * first scrolls into view, then stays resolved.
 */
export function DecodeText({
  children,
  as = "h2",
  className,
  eyebrow,
  trademark = false,
}: DecodeTextProps) {
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
          {letters.map((letter, index) => {
            // The ™ is absolutely positioned (.tm-float, relative to this
            // span) rather than sitting in flow, so it adds zero width to
            // the line — an in-flow ™ was occasionally just enough extra
            // width to push a heading that nearly fills its line onto an
            // extra line, which the design brief explicitly ruled out.
            if (trademark && index === letters.length - 1) {
              return (
                <span key={index} className="relative">
                  {letter.char}
                  <sup className="tm tm-float">™</sup>
                </span>
              );
            }
            return <span key={index}>{letter.char}</span>;
          })}
        </Tag>
      </motion.div>
    </div>
  );
}
