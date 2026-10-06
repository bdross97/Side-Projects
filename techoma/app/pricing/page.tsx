import Link from "next/link";
import type { Metadata } from "next";
import { DecodeText } from "@/components/motion/DecodeText";
import { EstimateCalculator } from "@/components/pricing/EstimateCalculator";
import { CTALink } from "@/components/ui/CTALink";
import { MicroLabel } from "@/components/ui/MicroLabel";
import { pricing } from "@/content/pricing";
import { formatUSD } from "@/lib/estimate";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Pricing for The TECHOMA. Four-wheel-drive guerrilla sound for pop-ups, block parties, and off-road events across Utah.",
};

const sectionClasses = "mt-24";
const headingClasses = "mb-12 text-3xl md:text-5xl";

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-24">
      <DecodeText as="h1" className="text-4xl md:text-5xl">
        Pricing
      </DecodeText>
      <p className="mt-6 font-sans text-sm uppercase tracking-[0.3em] text-neutral-400">
        {pricing.tagline}
      </p>

      <section className={sectionClasses}>
        <DecodeText eyebrow="001" className={headingClasses}>
          Packages
        </DecodeText>

        <div className="grid grid-cols-1 gap-px border border-neutral-800 bg-neutral-800 md:grid-cols-3">
          {pricing.packages.map((pkg) => (
            <div key={pkg.id} className="flex flex-col gap-8 bg-black p-6 md:p-8">
              <div>
                <MicroLabel className="mb-2 block">{pkg.onSite} on site</MicroLabel>
                <h3 className="font-display text-2xl uppercase text-white md:text-3xl">
                  {pkg.name}
                </h3>
              </div>

              <p className="font-sans text-4xl tabular-nums text-white">{formatUSD(pkg.price)}</p>

              <div>
                <MicroLabel className="mb-3 block">{pricing.packageIncludesHeading}</MicroLabel>
                <ul className="flex flex-col font-sans text-sm text-neutral-300">
                  {pricing.packageIncludes.map((item) => (
                    <li key={item} className="border-t border-neutral-800 py-2">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 font-sans text-xs uppercase tracking-[0.2em] text-neutral-500">
          Overtime · {formatUSD(pricing.overtime.price)} per extra hour. {pricing.packageNote}
        </p>
      </section>

      <section className={sectionClasses}>
        <DecodeText eyebrow="002" className={headingClasses}>
          Travel
        </DecodeText>

        <div className="border border-neutral-800">
          <table className="w-full border-collapse font-sans text-sm">
            <thead>
              <tr className="text-left">
                <th scope="col" className="px-4 py-3 font-normal text-[10px] uppercase tracking-[0.3em] text-neutral-500">
                  Zone
                </th>
                <th scope="col" className="px-4 py-3 font-normal text-[10px] uppercase tracking-[0.3em] text-neutral-500">
                  Distance
                </th>
                <th scope="col" className="px-4 py-3 text-right font-normal text-[10px] uppercase tracking-[0.3em] text-neutral-500">
                  Fee
                </th>
              </tr>
            </thead>
            <tbody>
              {pricing.travelZones.map((zone) => (
                <tr key={zone.id} className="border-t border-neutral-800">
                  <td className="px-4 py-4 text-white">{zone.label}</td>
                  <td className="px-4 py-4 text-neutral-400">{zone.distance}</td>
                  <td className="px-4 py-4 text-right tabular-nums text-white">
                    {zone.price === null
                      ? zone.priceText
                      : zone.price === 0
                        ? "Included"
                        : formatUSD(zone.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 font-sans text-xs leading-relaxed text-neutral-500">
          {pricing.customQuoteNote}
        </p>
      </section>

      <section className={sectionClasses}>
        <DecodeText eyebrow="003" className={headingClasses}>
          Off-Road
        </DecodeText>

        <div className="border border-neutral-800 p-6 md:p-8">
          <p className="max-w-xl font-sans text-base leading-relaxed text-neutral-200">
            {pricing.offRoad.copy.replace("{price}", formatUSD(pricing.offRoad.price))}
          </p>
        </div>
      </section>

      <section className={sectionClasses}>
        <DecodeText eyebrow="004" className={headingClasses}>
          Add-Ons
        </DecodeText>

        <ul className="border border-neutral-800">
          {Object.values(pricing.addOns).map((addOn) => (
            <li
              key={addOn.label}
              className="flex items-baseline justify-between gap-4 border-t border-neutral-800 px-4 py-4 font-sans text-sm first:border-t-0"
            >
              <span className="text-neutral-200">{addOn.label}</span>
              <span className="tabular-nums text-white">
                {formatUSD(addOn.price)}
                {addOn.billing === "hourly" ? " / hr" : " flat"}
              </span>
            </li>
          ))}
          {pricing.includedExtras.map((extra) => (
            <li
              key={extra.label}
              className="flex items-baseline justify-between gap-4 border-t border-neutral-800 px-4 py-4 font-sans text-sm"
            >
              <span className="text-neutral-200">{extra.label}</span>
              <span className="text-neutral-500">Included</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={sectionClasses}>
        <DecodeText eyebrow="005" className={headingClasses}>
          Estimate
        </DecodeText>
        <EstimateCalculator />
      </section>

      <div className="mt-16 text-center">
        <Link
          href="/faq"
          className="font-sans text-xs uppercase tracking-[0.3em] text-neutral-400 underline underline-offset-4 transition-colors hover:text-white"
        >
          Questions? Read the FAQ
        </Link>
      </div>

      <section className={sectionClasses}>
        <DecodeText eyebrow="006" className={headingClasses}>
          Policies
        </DecodeText>
        <ul className="flex flex-col gap-3 font-sans text-xs leading-relaxed text-neutral-500">
          {pricing.policies.map((policy) => (
            <li key={policy}>{policy}</li>
          ))}
        </ul>
      </section>

      <div className="mt-24 flex justify-center border-t border-neutral-800 pt-16">
        <CTALink href="/book" variant="solid">
          Book The TECHOMA
        </CTALink>
      </div>
    </div>
  );
}
