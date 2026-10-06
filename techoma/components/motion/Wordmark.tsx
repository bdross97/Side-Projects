"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useScramble } from "./useScramble";
import { useReducedMotion } from "./useReducedMotion";
import { paladinsLaser, paladinsGrad } from "@/lib/fonts";
import { cn } from "@/lib/utils";

const TARGET = "TECHOMA";

type WordmarkSize = "hero" | "header" | "footer";

type WordmarkProps = {
  size?: WordmarkSize;
  /** Render already-resolved, no scramble-in. Use for persistent header/footer marks. */
  skipDecode?: boolean;
  onDecodeComplete?: () => void;
  className?: string;
  showThe?: boolean;
};

const SIZE_CLASSES: Record<WordmarkSize, string> = {
  hero: "text-[12vw] sm:text-[11vw] md:text-8xl lg:text-9xl",
  header: "text-lg md:text-xl",
  footer: "text-base",
};

export function Wordmark({
  size = "hero",
  skipDecode = false,
  onDecodeComplete,
  className,
  showThe = false,
}: WordmarkProps) {
  const reducedMotion = useReducedMotion();
  const skip = skipDecode || reducedMotion;
  const [decodeDone, setDecodeDone] = useState(skip);

  const letters = useScramble(TARGET, {
    skip,
    baseDelayMs: 80,
    staggerMs: 90,
    cycleMs: 45,
    onComplete: () => {
      setDecodeDone(true);
      onDecodeComplete?.();
    },
  });

  const containerRef = useRef<HTMLSpanElement>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [offsets, setOffsets] = useState<number[]>(() => TARGET.split("").map(() => 0));
  const [glitching, setGlitching] = useState(false);
  const pointerFineRef = useRef(false);

  useEffect(() => {
    pointerFineRef.current = window.matchMedia("(pointer: fine)").matches;
  }, []);

  // Idle glitch loop, rare and brief, only once decode has resolved.
  useEffect(() => {
    if (reducedMotion || !decodeDone) return;
    let timeoutId: ReturnType<typeof setTimeout>;
    let glitchOffId: ReturnType<typeof setTimeout>;

    const schedule = () => {
      const delay = 6000 + Math.random() * 4000;
      timeoutId = setTimeout(() => {
        setGlitching(true);
        glitchOffId = setTimeout(() => setGlitching(false), 120 + Math.random() * 80);
        schedule();
      }, delay);
    };
    schedule();

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(glitchOffId);
    };
  }, [decodeDone, reducedMotion]);

  function handleMouseMove(event: React.MouseEvent<HTMLSpanElement>) {
    if (!pointerFineRef.current || reducedMotion || !decodeDone) return;
    const radius = 70;
    const maxOffset = 7;

    const next = letterRefs.current.map((el) => {
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const distance = Math.abs(event.clientX - center);
      if (distance > radius) return 0;
      const strength = 1 - distance / radius;
      const direction = event.clientY < rect.top + rect.height / 2 ? 1 : -1;
      return direction * strength * maxOffset;
    });
    setOffsets(next);
  }

  function handleMouseLeave() {
    setOffsets(TARGET.split("").map(() => 0));
  }

  return (
    // Font-size lives here (not just on the letters span below) so the
    // sibling "The" label's em sizing is relative to the wordmark's actual
    // rendered size, not whatever ambient size happens to be above it.
    <span
      className={cn("inline-flex flex-col", SIZE_CLASSES[size], className)}
      role="img"
      aria-label={showThe ? "The TECHOMA" : "TECHOMA"}
    >
      {showThe && (
        <span
          aria-hidden
          className={cn(
            paladinsGrad.className,
            "text-[0.22em] uppercase tracking-[0.15em] text-neutral-200"
          )}
        >
          The
        </span>
      )}
      <motion.span
        aria-hidden
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        initial={skip ? false : { letterSpacing: "0.5em", opacity: 0 }}
        animate={{ letterSpacing: decodeDone ? "0.01em" : "0.3em", opacity: 1 }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        className={cn(paladinsLaser.className, "relative inline-flex uppercase leading-none")}
      >
        {letters.map((letter, index) => (
          <span
            key={index}
            ref={(el) => {
              letterRefs.current[index] = el;
            }}
            className="relative inline-block transition-transform duration-150 ease-out"
            style={{ transform: `translateY(${offsets[index] ?? 0}px)` }}
          >
            <span>{letter.char}</span>

            {glitching && index % 3 === 0 && (
              <span
                aria-hidden
                className="absolute inset-0 overflow-hidden text-neutral-400/60"
                style={{
                  clipPath: "inset(30% 0 40% 0)",
                  transform: "translateX(3px)",
                }}
              >
                {letter.char}
              </span>
            )}
          </span>
        ))}
      </motion.span>
    </span>
  );
}
