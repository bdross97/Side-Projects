/** The only divider on the site: one thin line in the accent color. */
export function MeridianLine({ className = "" }: { className?: string }) {
  return <hr className={`mx-auto h-px w-full max-w-6xl border-0 bg-accent ${className}`} />;
}
