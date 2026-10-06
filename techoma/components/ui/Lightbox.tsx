"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { GalleryItem } from "@/content/gallery";
import { MediaSlot } from "./MediaSlot";

type LightboxProps = {
  items: GalleryItem[];
  index: number | null;
  onClose: () => void;
  onNavigate: (nextIndex: number) => void;
};

export function Lightbox({ items, index, onClose, onNavigate }: LightboxProps) {
  const open = index !== null;
  const item = open ? items[index] : null;

  useEffect(() => {
    if (!open) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNavigate(((index ?? 0) + 1) % items.length);
      if (e.key === "ArrowLeft") onNavigate(((index ?? 0) - 1 + items.length) % items.length);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, index, items.length, onClose, onNavigate]);

  return (
    <AnimatePresence>
      {open && item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Gallery image"
          onClick={onClose}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-6 top-6 font-sans text-xs uppercase tracking-[0.3em] text-neutral-400 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            aria-label="Close"
          >
            Close
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate((index! - 1 + items.length) % items.length);
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 px-4 py-2 font-sans text-xs uppercase tracking-[0.3em] text-neutral-400 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            aria-label="Previous"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate((index! + 1) % items.length);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 px-4 py-2 font-sans text-xs uppercase tracking-[0.3em] text-neutral-400 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            aria-label="Next"
          >
            Next
          </button>

          <div
            className="max-h-[85vh] w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <MediaSlot
              src={item.src}
              type={item.type}
              alt={item.alt}
              label={`${item.type.toUpperCase()} · ${item.id.toUpperCase()}`}
              aspect={
                item.aspect === "portrait" ? "4/5" : item.aspect === "square" ? "1/1" : "16/9"
              }
              className="max-h-[85vh]"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
