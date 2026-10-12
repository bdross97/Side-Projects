import { MediaSlot } from "./MediaSlot";
import { MicroLabel } from "./MicroLabel";

type UseCaseImage = {
  src: string;
  alt: string;
  /** CSS aspect-ratio value matching the source photo, e.g. "3/2" or "4/5". */
  aspect?: string;
};

type UseCaseBlockProps = {
  index: string;
  label: string;
  summary: string;
  withMedia?: boolean;
  image?: UseCaseImage;
};

export function UseCaseBlock({
  index,
  label,
  summary,
  withMedia = false,
  image,
}: UseCaseBlockProps) {
  return (
    <div className="flex flex-col gap-4 border-t border-neutral-800 pt-6">
      <MicroLabel>{index}</MicroLabel>
      <h3 className="font-display text-2xl uppercase text-white md:text-3xl">{label}</h3>
      <p className="max-w-sm font-sans text-sm leading-relaxed text-neutral-400">{summary}</p>
      {image ? (
        <MediaSlot
          src={image.src}
          alt={image.alt}
          label={`IMAGE ${index}`}
          aspect={image.aspect ?? "4/5"}
          className="mt-2"
        />
      ) : (
        withMedia && (
          <MediaSlot
            alt={`${label} placeholder`}
            label={`IMAGE ${index} · 4:5`}
            aspect="4/5"
            className="mt-2"
          />
        )
      )}
    </div>
  );
}
