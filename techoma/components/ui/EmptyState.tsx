import { ConeMark } from "@/components/motion/ConeMark";

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-4 border border-neutral-800 bg-black px-6 py-20 text-center">
      <ConeMark size={32} className="text-neutral-600" />
      <p className="font-sans text-sm uppercase tracking-[0.25em] text-neutral-500">{message}</p>
    </div>
  );
}
