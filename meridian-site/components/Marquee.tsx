/**
 * A rolling banner. Children render twice so the loop is seamless; the
 * second copy is hidden from screen readers and the tab order. Pauses on hover, and stands
 * still (scrollable) under reduced motion.
 */
export function Marquee({
  children,
  seconds = 40,
  reverse = false,
  className = "",
  label,
}: {
  children: React.ReactNode;
  seconds?: number;
  /** roll left to right instead of right to left */
  reverse?: boolean;
  className?: string;
  label?: string;
}) {
  return (
    <div className={`marquee overflow-hidden ${className}`} aria-label={label} role={label ? "region" : undefined}>
      <div
        className="marquee-track flex w-max"
        style={
          { "--marquee-duration": `${seconds}s`, animationDirection: reverse ? "reverse" : undefined } as React.CSSProperties
        }
      >
        <div className="flex shrink-0">{children}</div>
        <div className="flex shrink-0" aria-hidden="true" inert>
          {children}
        </div>
      </div>
    </div>
  );
}
