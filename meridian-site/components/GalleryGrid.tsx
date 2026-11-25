"use client";

import { useState } from "react";
import { site } from "@/content/site";
import type { ImageItem, Poster } from "@/content/types";
import { Lightbox } from "./Lightbox";
import { MediaSlot } from "./MediaSlot";
import { Reveal } from "./Reveal";

type Item = ImageItem | Poster;

/**
 * Masonry of images at their own shapes, revealed on scroll, with a lightbox.
 * Items are dealt into columns left to right (item 0 in column 1, item 1 in
 * column 2, ...), so the list order reads across rows. There's a 2-column
 * layout for phones and a 3-column one for wide screens; CSS shows one.
 */
export function GalleryGrid({ items }: { items: Item[] }) {
  const [open, setOpen] = useState<number | null>(null);

  const layout = (cols: number, className: string) => (
    <div className={`gap-3 sm:gap-4 ${className}`}>
      {Array.from({ length: cols }, (_, c) => (
        <ul key={c} className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-4">
          {items.map((item, i) =>
            i % cols === c ? (
              <li key={item.src}>
                <Reveal delay={c * 0.08}>
                  <button
                    type="button"
                    onClick={() => setOpen(i)}
                    aria-label={`${site.gallery.openLabel}: ${item.alt}`}
                    className="block w-full overflow-hidden"
                  >
                    <MediaSlot
                      item={{ kind: "image", focal: "50% 50%", ...item }}
                      useThumb
                      className="h-auto w-full transition-transform duration-700 ease-out hover:scale-105"
                    />
                  </button>
                </Reveal>
              </li>
            ) : null,
          )}
        </ul>
      ))}
    </div>
  );

  return (
    <>
      {layout(2, "flex lg:hidden")}
      {layout(3, "hidden lg:flex")}
      <Lightbox items={items} index={open} onClose={() => setOpen(null)} onIndexChange={setOpen} />
    </>
  );
}
