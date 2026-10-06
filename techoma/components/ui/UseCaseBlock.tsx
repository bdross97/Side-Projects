import { MediaSlot } from "./MediaSlot";
import { MicroLabel } from "./MicroLabel";

type UseCaseBlockProps = {
  index: string;
  label: string;
  summary: string;
  withMedia?: boolean;
};

export function UseCaseBlock({ index, label, summary, withMedia = false }: UseCaseBlockProps) {
  return (
    <div className="flex flex-col gap-4 border-t border-neutral-800 pt-6">
      <MicroLabel>{index}</MicroLabel>
      <h3 className="font-display text-2xl uppercase text-white md:text-3xl">{label}</h3>
      <p className="max-w-sm font-sans text-sm leading-relaxed text-neutral-400">{summary}</p>
      {withMedia && (
        <MediaSlot
          alt={`${label} placeholder`}
          label={`IMAGE ${index} · 4:5`}
          aspect="4/5"
          className="mt-2"
        />
      )}
    </div>
  );
}
