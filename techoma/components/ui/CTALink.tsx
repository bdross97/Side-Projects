import Link from "next/link";
import { cn } from "@/lib/utils";

type CTALinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  variant?: "solid" | "outline";
};

export function CTALink({ href, children, className, variant = "outline" }: CTALinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center border px-6 py-3 font-sans text-xs uppercase tracking-[0.3em] transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
        variant === "solid"
          ? "border-white bg-white text-black hover:bg-black hover:text-white"
          : "border-neutral-600 text-white hover:border-white hover:bg-white hover:text-black",
        className
      )}
    >
      {children}
    </Link>
  );
}
