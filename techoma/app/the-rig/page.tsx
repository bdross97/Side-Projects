import type { Metadata } from "next";
import { DecodeText } from "@/components/motion/DecodeText";
import { MediaSlot } from "@/components/ui/MediaSlot";
import { SpecGrid } from "@/components/ui/SpecGrid";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "The Rig",
  description: "Two tops, an 18-inch sub, decks on the Slimline II rack. Built on a lifted 4x4 Tacoma.",
};

export default function TheRigPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-24">
      <DecodeText eyebrow="RIG" as="h1" className="mb-12 text-4xl md:text-5xl">
        The Rig
      </DecodeText>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <MediaSlot src="/images/rig-side-profile.jpg" alt="The TECHOMA, side profile" label="IMAGE 01 · 3:2" aspect="3/2" className="md:col-span-2" />
        <MediaSlot src="/images/rig-color-washed.jpg" alt="The TECHOMA, color-washed view" label="IMAGE 02 · 3:2" aspect="3/2" />
        <MediaSlot alt="The TECHOMA, rig detail" label="IMAGE 03 · 3:2" aspect="3/2" />
      </div>

      <div className="mt-16 flex max-w-2xl flex-col gap-6">
        {site.description.map((paragraph, i) => (
          <p key={i} className="font-sans text-sm leading-relaxed text-neutral-300 md:text-base">
            {paragraph}
          </p>
        ))}
      </div>

      <div className="mt-16">
        <SpecGrid specs={site.specs} />
      </div>
    </div>
  );
}
