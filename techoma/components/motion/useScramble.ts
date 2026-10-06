"use client";

import { useEffect, useRef, useState } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&$@*+=/\\";

export type ScrambleLetter = {
  char: string;
  locked: boolean;
};

type ScrambleOptions = {
  /** ms before the first letter starts resolving */
  baseDelayMs?: number;
  /** ms added per letter index, creates the left-to-right lock-in */
  staggerMs?: number;
  /** how often displayed glyphs change while unresolved */
  cycleMs?: number;
  /** skip the scramble and resolve immediately */
  skip?: boolean;
  /** called once every letter has locked */
  onComplete?: () => void;
};

function randomGlyph() {
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
}

/**
 * Drives a per-letter "decode from random glyphs" effect.
 * Returns the current letter states; locked letters show the real character.
 */
export function useScramble(target: string, options: ScrambleOptions = {}) {
  const {
    baseDelayMs = 0,
    staggerMs = 55,
    cycleMs = 40,
    skip = false,
    onComplete,
  } = options;

  // Deterministic initial state (same on server and client) so hydration
  // never mismatches — randomization only begins once the effect below
  // runs on the client. Consumers keep this invisible via opacity until
  // the scramble starts.
  const [letters, setLetters] = useState<ScrambleLetter[]>(() =>
    target.split("").map((char) => ({ char, locked: true }))
  );
  const completedRef = useRef(false);

  useEffect(() => {
    completedRef.current = false;

    if (skip) {
      // Resolving immediately post-mount (not during render) keeps SSR output
      // deterministic — see the matching comment on the initial useState above.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLetters(target.split("").map((char) => ({ char, locked: true })));
      onComplete?.();
      completedRef.current = true;
      return;
    }

    const chars = target.split("");
    const lockTimes = chars.map((char, index) =>
      char === " " ? 0 : baseDelayMs + index * staggerMs + Math.random() * staggerMs
    );
    const startedAt = performance.now();

    setLetters(
      chars.map((char) => ({
        char: char === " " ? " " : randomGlyph(),
        locked: char === " ",
      }))
    );

    const interval = setInterval(() => {
      const elapsed = performance.now() - startedAt;

      // Compute the next frame up front — setState updaters aren't
      // guaranteed to run synchronously, so `allLocked` must not depend
      // on a callback React may defer.
      let allLocked = true;
      const next = chars.map((char, index) => {
        if (char === " ") return { char, locked: true };
        if (elapsed >= lockTimes[index]) {
          return { char, locked: true };
        }
        allLocked = false;
        return { char: randomGlyph(), locked: false };
      });

      setLetters(next);

      if (allLocked && !completedRef.current) {
        completedRef.current = true;
        onComplete?.();
        clearInterval(interval);
      }
    }, cycleMs);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, skip, baseDelayMs, staggerMs, cycleMs]);

  return letters;
}
