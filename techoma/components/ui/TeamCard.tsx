import type { TeamMember } from "@/content/team";
import { MediaSlot } from "./MediaSlot";
import { MicroLabel } from "./MicroLabel";

export function TeamCard({ member }: { member: TeamMember }) {
  return (
    <div className="flex flex-col gap-5">
      <MediaSlot
        src={member.photoSrc}
        alt={`${member.name} portrait`}
        label="PORTRAIT · 4:5"
        aspect="4/5"
      />

      <div>
        <MicroLabel className="mb-2 block">{member.role}</MicroLabel>
        <h3 className="font-display text-2xl uppercase text-white md:text-3xl">{member.name}</h3>
        <p className="mt-3 max-w-sm font-sans text-sm leading-relaxed text-neutral-400">
          {member.bio}
        </p>
      </div>

      <div className="flex flex-col gap-1 font-sans text-xs uppercase tracking-[0.2em] text-neutral-500">
        <a href={`mailto:${member.email}`} className="hover:text-white">
          {member.email}
        </a>
        <a href={member.instagram} className="hover:text-white">
          Instagram
        </a>
      </div>
    </div>
  );
}
