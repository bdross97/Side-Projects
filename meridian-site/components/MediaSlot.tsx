"use client";

import { useEffect, useRef } from "react";
import type { MediaItem } from "@/content/types";
import { asset } from "@/lib/asset";

type Props = {
  item: MediaItem;
  className?: string;
  /** use the smaller grid copy of an image when there is one */
  useThumb?: boolean;
  eager?: boolean;
};

/**
 * Renders an <img> or <video> once the item has a src, and a plain labelled
 * box until then, so missing media never looks broken.
 */
export function MediaSlot({ item, className = "", useThumb = false, eager = false }: Props) {
  const style = {
    objectPosition: item.focal,
    filter: item.treatment === "inverted" ? "invert(1)" : undefined,
  };

  if (!item.src) {
    const label = item.kind === "video" ? item.label : "MEDIA_HERE";
    return (
      <div
        className={`flex items-center justify-center border border-ink/30 text-xs tracking-widest text-ink/70 ${className}`}
        style={{ aspectRatio: `${item.width} / ${item.height}` }}
      >
        {label}
      </div>
    );
  }

  if (item.kind === "video") {
    return <LoopVideo item={item} src={item.src} className={className} style={style} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={asset(useThumb && item.thumb ? item.thumb : item.src)}
      alt={item.alt}
      width={item.width}
      height={item.height}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={`object-cover ${className}`}
      style={style}
    />
  );
}

function LoopVideo({
  item,
  src,
  className,
  style,
}: {
  item: Extract<MediaItem, { kind: "video" }>;
  src: string;
  className: string;
  style: React.CSSProperties;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  // No autoplay attribute in the HTML: playback starts here, and only when the
  // visitor hasn't asked for reduced motion. Otherwise the poster stays put.
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    video.play().catch(() => {});
  }, []);

  return (
    <video
      ref={ref}
      src={asset(src)}
      poster={item.poster ? asset(item.poster) : undefined}
      width={item.width}
      height={item.height}
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={item.alt || undefined}
      aria-hidden={item.alt ? undefined : true}
      className={`object-cover ${className}`}
      style={style}
    />
  );
}
