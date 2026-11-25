/** Section and page headers. The only place the display font (Outfit) is used. */
export function SectionHeading({
  as: Tag = "h2",
  large = false,
  children,
  className = "",
}: {
  as?: "h1" | "h2" | "h3";
  /** a step up in size, for the main home sections */
  large?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const size = Tag === "h1" || large ? "text-4xl sm:text-5xl" : "text-2xl sm:text-3xl";
  return <Tag className={`font-display font-light lowercase tracking-wide ${size} ${className}`}>{children}</Tag>;
}
