import { pricing } from "@/content/pricing";
import { formatUSD, type Estimate } from "@/lib/estimate";
import { RollingTotal } from "./RollingTotal";

export function EstimateView({ estimate }: { estimate: Estimate }) {
  const total = estimate.customQuote ? "Custom quote" : formatUSD(estimate.total);

  return (
    <div className="flex flex-col gap-6">
      <p className="font-sans text-4xl tabular-nums text-white md:text-5xl">
        <RollingTotal value={total} />
      </p>

      {estimate.customQuote && (
        <p className="font-sans text-xs leading-relaxed text-neutral-400">
          {pricing.customQuoteNote}
        </p>
      )}

      {estimate.lines.length > 0 && (
        <ul className="flex flex-col font-sans text-sm">
          {estimate.lines.map((line) => (
            <li
              key={line.label}
              className="flex items-baseline justify-between gap-4 border-t border-neutral-800 py-3"
            >
              <span className="text-neutral-300">{line.label}</span>
              <span className="tabular-nums text-white">
                {line.amount !== null ? (
                  formatUSD(line.amount)
                ) : (
                  <span className="text-neutral-500">{line.note}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-neutral-500">
        {pricing.estimateNote}
      </p>
    </div>
  );
}
