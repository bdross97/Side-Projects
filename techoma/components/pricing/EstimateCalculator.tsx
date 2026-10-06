"use client";

import { useState } from "react";
import { CTALink } from "@/components/ui/CTALink";
import { MicroLabel } from "@/components/ui/MicroLabel";
import { pricing } from "@/content/pricing";
import {
  buildEstimate,
  DEFAULT_SELECTION,
  formatUSD,
  HOURLY_ADD_ONS,
  selectionToParams,
  type HourlyAddOnId,
  type Selection,
} from "@/lib/estimate";
import { cn } from "@/lib/utils";
import { EstimateView } from "./EstimateView";

export function EstimateCalculator() {
  const [selection, setSelection] = useState<Selection>(DEFAULT_SELECTION);
  const estimate = buildEstimate(selection);
  const bookHref = `/book?${selectionToParams(selection).toString()}#form`;

  const patch = (changes: Partial<Selection>) =>
    setSelection((prev) => ({ ...prev, ...changes }));
  const setHours = (id: HourlyAddOnId, hours: number) =>
    setSelection((prev) => ({ ...prev, hours: { ...prev.hours, [id]: hours } }));

  return (
    <div className="grid grid-cols-1 gap-px border border-neutral-800 bg-neutral-800 md:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-px">
        <Row label="Package">
          <Segmented
            label="Package"
            columns={3}
            value={selection.packageId}
            options={pricing.packages.map((pkg) => ({
              value: pkg.id,
              label: pkg.name,
              detail: pkg.onSite,
            }))}
            onChange={(packageId) => patch({ packageId })}
          />
        </Row>

        <Row label="Overtime">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="font-sans text-xs uppercase tracking-[0.2em] text-neutral-400">
              {formatUSD(pricing.overtime.price)} per extra hour
            </span>
            <Stepper
              label="overtime hours"
              value={selection.overtimeHours}
              max={pricing.overtime.maxHours}
              onChange={(overtimeHours) => patch({ overtimeHours })}
            />
          </div>
        </Row>

        <Row label="Travel zone">
          <Segmented
            label="Travel zone"
            columns={4}
            value={selection.zoneId}
            options={pricing.travelZones.map((zone) => ({
              value: zone.id,
              label: zone.label,
              detail: zone.distance,
            }))}
            onChange={(zoneId) => patch({ zoneId })}
          />
        </Row>

        <Row label="Off-road access">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="font-sans text-xs uppercase tracking-[0.2em] text-neutral-400">
              Site needs 4x4 driving · {formatUSD(pricing.offRoad.price)}
            </span>
            <Toggle
              label="Off-road access"
              checked={selection.offRoad}
              onChange={(offRoad) => patch({ offRoad })}
            />
          </div>
        </Row>

        <Row label="Add-ons">
          <ul className="flex flex-col">
            {HOURLY_ADD_ONS.map((id) => {
              const addOn = pricing.addOns[id];
              return (
                <li
                  key={id}
                  className="flex flex-wrap items-center justify-between gap-4 border-t border-neutral-800 py-4 first:border-t-0 first:pt-0"
                >
                  <span className="font-sans text-sm text-white">
                    {addOn.label}
                    <span className="ml-3 text-xs text-neutral-500">
                      {formatUSD(addOn.price)} / hr
                    </span>
                  </span>
                  <Stepper
                    label={`${addOn.label} hours`}
                    value={selection.hours[id]}
                    max={pricing.hourlyMaxHours}
                    onChange={(hours) => setHours(id, hours)}
                  />
                </li>
              );
            })}
            <li className="flex flex-wrap items-center justify-between gap-4 border-t border-neutral-800 py-4">
              <span className="font-sans text-sm text-white">
                {pricing.addOns.lateNight.label}
                <span className="ml-3 text-xs text-neutral-500">
                  {formatUSD(pricing.addOns.lateNight.price)} flat
                </span>
              </span>
              <Toggle
                label={pricing.addOns.lateNight.label}
                checked={selection.lateNight}
                onChange={(lateNight) => patch({ lateNight })}
              />
            </li>
          </ul>
        </Row>
      </div>

      <div className="bg-black md:self-stretch">
        <div className="flex flex-col gap-8 p-6 md:sticky md:top-24 md:p-8">
        <MicroLabel>Estimated total</MicroLabel>
        <EstimateView estimate={estimate} />
        <CTALink href={bookHref} variant="solid" className="w-full">
          Book with this estimate
        </CTALink>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="bg-black p-6">
      <MicroLabel className="mb-4 block">{label}</MicroLabel>
      {children}
    </section>
  );
}

type Option<T extends string> = { value: T; label: string; detail?: string };

function Segmented<T extends string>({
  label,
  columns,
  value,
  options,
  onChange,
}: {
  label: string;
  columns: 3 | 4;
  value: T | null;
  options: readonly Option<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "grid gap-px border border-neutral-700 bg-neutral-700",
        columns === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2 md:grid-cols-4"
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex flex-col items-start gap-1 px-4 py-3 text-left font-sans transition-colors",
              selected ? "bg-white text-black" : "bg-black text-white hover:bg-neutral-900"
            )}
          >
            <span className="text-xs uppercase tracking-[0.2em]">{option.label}</span>
            {option.detail && (
              <span
                className={cn(
                  "text-[10px] tracking-[0.15em]",
                  selected ? "text-neutral-600" : "text-neutral-500"
                )}
              >
                {option.detail}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function Stepper({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const buttonClasses =
    "px-4 py-2 font-sans text-sm text-white transition-colors hover:bg-white hover:text-black disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white";
  return (
    <div className="inline-flex border border-neutral-700">
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        disabled={value <= 0}
        onClick={() => onChange(value - 1)}
        className={buttonClasses}
      >
        -
      </button>
      <span className="min-w-16 border-x border-neutral-700 px-4 py-2 text-center font-sans text-sm tabular-nums text-white">
        {value}
      </span>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className={buttonClasses}
      >
        +
      </button>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-3 border border-neutral-700 px-4 py-2 font-sans text-xs uppercase tracking-[0.2em] text-white transition-colors hover:border-white"
    >
      <span className={cn("flex h-3 w-3 border border-white", checked && "bg-white")} />
      {checked ? "On" : "Off"}
    </button>
  );
}
