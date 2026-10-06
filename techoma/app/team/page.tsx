import type { Metadata } from "next";
import { DecodeText } from "@/components/motion/DecodeText";
import { TeamCard } from "@/components/ui/TeamCard";
import { team } from "@/content/team";

export const metadata: Metadata = {
  title: "Team",
  description: "The people behind The TECHOMA.",
};

export default function TeamPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-24">
      <DecodeText eyebrow="CREW" as="h1" className="mb-16 text-4xl md:text-5xl">
        Team
      </DecodeText>

      <div className="grid grid-cols-1 gap-16 sm:grid-cols-2">
        {team.map((member) => (
          <TeamCard key={member.id} member={member} />
        ))}
      </div>
    </div>
  );
}
