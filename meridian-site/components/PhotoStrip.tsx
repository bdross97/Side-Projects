"use client";

import { useState } from "react";
import { gallery } from "@/content/gallery";
import { asset } from "@/lib/asset";
import { Lightbox } from "./Lightbox";
import { Marquee } from "./Marquee";

/**
 * A slow sideways river of photos from content/gallery.ts, rolling the
 * opposite way to the genre banner. Click opens the lightbox.
 */
export function PhotoStrip() {
  const images = gallery.filter((g) => g.strip !== false);
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <Marquee seconds={images.length * 7} reverse>
        {images.map((img, i) => (
          <button
            key={img.src}
            type="button"
            onClick={() => setOpen(i)}
            className="mr-3 block shrink-0 overflow-hidden sm:mr-4"
            aria-label={img.alt}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset(img.thumb ?? img.src)}
              alt=""
              width={img.width}
              height={img.height}
              loading="lazy"
              decoding="async"
              className="h-56 w-auto object-cover transition-transform duration-700 hover:scale-105 sm:h-80"
              style={{ objectPosition: img.focal }}
            />
          </button>
        ))}
      </Marquee>
      <Lightbox items={images} index={open} onClose={() => setOpen(null)} onIndexChange={setOpen} />
    </>
  );
}
