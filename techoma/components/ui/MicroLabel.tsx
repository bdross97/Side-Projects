import { cn } from "@/lib/utils";

export function MicroLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-sans text-[10px] uppercase tracking-[0.35em] text-neutral-500",
        className
      )}
    >
      {children}
    </span>
  );
}
