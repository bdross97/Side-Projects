"use client";

import { useCallback, useRef } from "react";
import { site } from "@/content/site";
import type { Treatment } from "@/content/types";
import { asset } from "@/lib/asset";
import { useFocusTrap } from "@/lib/useFocusTrap";

export type LightboxItem = {
  src: string;
  width: number;
  height: number;
  alt: string;
  treatment?: Treatment;
};

type Props = {
  items: LightboxItem[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
};

/** Accessible image viewer: focus trap, Escape to close, arrow keys to move. */
export function Lightbox({ items, index, onClose, onIndexChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const open = index !== null && items[index] !== undefined;
  const many = items.length > 1;

  const step = useCallback(
    (delta: number) => {
      if (index === null) return;
      onIndexChange((index + delta + items.length) % items.length);
    },
    [index, items.length, onIndexChange],
  );

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (!many) return;
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    },
    [many, step],
  );

  useFocusTrap(ref, open, onClose, onKey);

  if (!open) return null;
  const item = items[index];

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={item.alt || site.gallery.title}
      className="fixed inset-0 z-50 flex flex-col bg-canvas/95"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 text-sm">
        <span className="text-ink/70" aria-live="polite">
          {many ? `${index + 1} / ${items.length}` : ""}
        </span>
        <button type="button" data-autofocus onClick={onClose} className="px-2 py-1 hover:text-accent">
          {site.ui.close}
        </button>
      </div>
      <div
        className="flex min-h-0 flex-1 items-center justify-center px-4 pb-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={item.src}
          src={asset(item.src)}
          alt={item.alt}
          width={item.width}
          height={item.height}
          className="max-h-full max-w-full object-contain"
          style={{ filter: item.treatment === "inverted" ? "invert(1)" : undefined }}
        />
      </div>
      {many && (
        <div className="flex justify-between px-4 pb-4 text-sm">
          <button type="button" onClick={() => step(-1)} className="px-2 py-1 hover:text-accent">
            {site.ui.previous}
          </button>
          <button type="button" onClick={() => step(1)} className="px-2 py-1 hover:text-accent">
            {site.ui.next}
          </button>
        </div>
      )}
    </div>
  );
}
