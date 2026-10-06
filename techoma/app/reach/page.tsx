import type { Metadata } from "next";
import { DecodeText } from "@/components/motion/DecodeText";
import { UseCaseBlock } from "@/components/ui/UseCaseBlock";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Territory",
  description: "Off road, street level, private. Where The TECHOMA shows up.",
};

export default function ReachPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-24">
      <DecodeText eyebrow="FIELD" as="h1" className="mb-16 text-4xl md:text-5xl">
        Territory
      </DecodeText>

      <div className="flex flex-col gap-20">
        {site.useCases.map((useCase) => (
          <UseCaseBlock
            key={useCase.slug}
            index={useCase.index}
            label={useCase.label}
            summary={useCase.summary}
            withMedia
          />
        ))}
      </div>
    </div>
  );
}
