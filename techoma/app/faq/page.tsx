import type { Metadata } from "next";
import { DecodeText } from "@/components/motion/DecodeText";
import { FaqAccordion } from "@/components/faq/FaqAccordion";
import { CTALink } from "@/components/ui/CTALink";
import { faq, plainText } from "@/content/faq";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: { absolute: "FAQ | The TECHOMA" },
  description:
    "Answers on booking, pricing, power, off-road access, and DJs for The TECHOMA, a four-wheel-drive mobile sound rig in Salt Lake City.",
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.flatMap((category) =>
    category.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: plainText(item.answer) },
    }))
  ),
};

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <DecodeText as="h1" className="text-4xl md:text-5xl">
        FAQ
      </DecodeText>
      <p className="mt-6 font-sans text-sm uppercase tracking-[0.3em] text-neutral-400">
        Everything you need before we pull in.
      </p>

      {faq.map((category) => (
        <section key={category.id} className="mt-24">
          <DecodeText eyebrow={category.index} className="mb-12 text-3xl md:text-5xl">
            {category.label}
          </DecodeText>
          <FaqAccordion category={category} />
        </section>
      ))}

      <section className="mt-24 border-t border-neutral-800 pt-16 text-center">
        <h2 className="font-display text-2xl uppercase text-white md:text-3xl">
          Still have questions?
        </h2>
        <div className="mt-8 flex flex-col items-center gap-6">
          <CTALink href="/book#form" variant="solid">
            Booking form
          </CTALink>
          <a
            href={`mailto:${site.social.email}`}
            className="font-sans text-xs uppercase tracking-[0.3em] text-neutral-400 underline underline-offset-4 transition-colors hover:text-white"
          >
            {site.social.email}
          </a>
        </div>
      </section>
    </div>
  );
}
