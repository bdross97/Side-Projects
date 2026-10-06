"use client";

import { useReducedMotion } from "./useReducedMotion";
import { cn } from "@/lib/utils";

type MarqueeProps = {
  text: string;
  className?: string;
};

export function Marquee({ text, className }: MarqueeProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div
      className={cn(
        "relative flex overflow-hidden border-y border-neutral-800 bg-black py-4",
        className
      )}
      aria-hidden
    >
      {reducedMotion ? (
        <div className="whitespace-nowrap font-sans text-sm uppercase tracking-[0.35em] text-neutral-400">
          {text.repeat(3)}
        </div>
      ) : (
        <div className="flex animate-marquee whitespace-nowrap">
          {Array.from({ length: 2 }).map((_, i) => (
            <span
              key={i}
              className="px-4 font-sans text-sm uppercase tracking-[0.35em] text-neutral-400"
            >
              {text.repeat(4)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
