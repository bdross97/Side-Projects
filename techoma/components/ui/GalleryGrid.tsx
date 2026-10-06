"use client";

import { useState } from "react";
import type { GalleryItem } from "@/content/gallery";
import { MediaSlot } from "./MediaSlot";
import { Lightbox } from "./Lightbox";

const ASPECT_MAP: Record<NonNullable<GalleryItem["aspect"]>, string> = {
  square: "1/1",
  portrait: "4/5",
  landscape: "16/9",
};

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className="text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            aria-label={`Open ${item.alt}`}
          >
            <MediaSlot
              src={item.src}
              type={item.type}
              alt={item.alt}
              label={`${item.type.toUpperCase()} ${String(index + 1).padStart(2, "0")}`}
              aspect={ASPECT_MAP[item.aspect ?? "square"]}
              className="transition-opacity hover:opacity-80"
            />
          </button>
        ))}
      </div>

      <Lightbox
        items={items}
        index={activeIndex}
        onClose={() => setActiveIndex(null)}
        onNavigate={setActiveIndex}
      />
    </>
  );
}
