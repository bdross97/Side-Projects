"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { site } from "@/content/site";
import { cn } from "@/lib/utils";

type MobileNavProps = {
  open: boolean;
  onClose: () => void;
};

export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[85] flex flex-col bg-black"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
        >
          <div className="flex items-center justify-end px-6 py-6">
            <button
              type="button"
              onClick={onClose}
              className="font-sans text-xs uppercase tracking-[0.3em] text-neutral-400 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              aria-label="Close menu"
            >
              Close
            </button>
          </div>

          <nav className="flex flex-1 flex-col items-start justify-center gap-2 px-8">
            {site.nav.map((item, i) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 * i, duration: 0.4, ease: "easeOut" }}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "font-display text-5xl uppercase text-white transition-colors hover:text-neutral-400 sm:text-6xl",
                    pathname === item.href && "text-neutral-500"
                  )}
                >
                  {item.label}
                </Link>
              </motion.div>
            ))}
          </nav>

          <div className="flex justify-between border-t border-neutral-800 px-8 py-6 font-sans text-xs uppercase tracking-[0.3em] text-neutral-500">
            <a href={site.social.instagram} className="hover:text-white">
              Instagram
            </a>
            <a href={`mailto:${site.social.email}`} className="hover:text-white">
              {site.social.email}
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
