import { ConeMark } from "@/components/motion/ConeMark";
import { cn } from "@/lib/utils";

type MediaSlotProps = {
  src?: string;
  type?: "image" | "video";
  alt: string;
  /** e.g. "IMAGE 01 · 16:9" — shown only on the placeholder state */
  label: string;
  /** CSS aspect-ratio value, e.g. "16/9", "1/1", "4/5" */
  aspect?: string;
  className?: string;
};

function inferType(src?: string): "image" | "video" {
  if (!src) return "image";
  return /\.(mp4|webm|mov|m4v)$/i.test(src) ? "video" : "image";
}

/**
 * Black box with a thin border and a ConeMark when no media source is set.
 * Once a src is provided, renders the real image or looping muted video.
 */
export function MediaSlot({ src, type, alt, label, aspect = "16/9", className }: MediaSlotProps) {
  const resolvedType = type ?? inferType(src);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden border border-neutral-800 bg-black",
        className
      )}
      style={{ aspectRatio: aspect }}
    >
      {!src ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-neutral-600">
          <ConeMark size={28} animate={false} />
          <span className="font-sans text-[10px] uppercase tracking-[0.3em]">{label}</span>
        </div>
      ) : resolvedType === "video" ? (
        <video
          src={src}
          autoPlay
          muted
          loop
          playsInline
          aria-label={alt}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" />
      )}
    </div>
  );
}
