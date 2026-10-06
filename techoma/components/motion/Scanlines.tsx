import { cn } from "@/lib/utils";

/**
 * Faint static scanline texture, CSS-only. Drop into a relatively
 * positioned hero section.
 */
export function Scanlines({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 opacity-[0.05]", className)}
      style={{
        backgroundImage:
          "repeating-linear-gradient(to bottom, rgba(255,255,255,0.6) 0px, rgba(255,255,255,0.6) 1px, transparent 1px, transparent 3px)",
      }}
    />
  );
}
