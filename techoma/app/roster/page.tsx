import type { Metadata } from "next";
import { DecodeText } from "@/components/motion/DecodeText";
import { RosterCard } from "@/components/ui/RosterCard";
import { roster } from "@/content/roster";

export const metadata: Metadata = {
  title: "Roster",
  description: "DJs who've played The TECHOMA.",
};

export default function RosterPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-24">
      <DecodeText eyebrow="LINEUP" as="h1" className="mb-16 text-4xl md:text-5xl">
        Roster
      </DecodeText>

      <div className="grid grid-cols-1 gap-x-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
        {roster.map((dj) => (
          <RosterCard key={dj.id} dj={dj} />
        ))}
      </div>
    </div>
  );
}
