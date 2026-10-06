import Link from "next/link";
import { ConeMark } from "@/components/motion/ConeMark";
import { MicroLabel } from "@/components/ui/MicroLabel";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <ConeMark size={40} className="text-neutral-600" />
      <MicroLabel>404</MicroLabel>
      <h1 className="font-display text-4xl uppercase text-white md:text-6xl">Signal Lost</h1>
      <p className="max-w-sm font-sans text-sm text-neutral-500">
        Nothing broadcasting at this frequency.
      </p>
      <Link
        href="/"
        className="mt-4 inline-flex items-center justify-center border border-neutral-600 px-6 py-3 font-sans text-xs uppercase tracking-[0.3em] text-white transition-colors hover:border-white hover:bg-white hover:text-black"
      >
        Return Home
      </Link>
    </div>
  );
}
