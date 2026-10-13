"use client";

import { useState, type FormEvent } from "react";
import { site } from "@/content/site";
import { pricing } from "@/content/pricing";
import { EstimateView } from "@/components/pricing/EstimateView";
import { cn } from "@/lib/utils";
import {
  buildEstimate,
  formatUSD,
  toPackageId,
  toZoneId,
  type Selection,
} from "@/lib/estimate";

type FormState = "idle" | "submitting" | "success" | "error";

type FieldErrors = Partial<Record<"name" | "email" | "eventType" | "message", string>>;

type FourWdAnswer = "" | "yes" | "no" | "unsure";

// Crew details as the user edits them. Selects hold a string so "Not sure"
// can be stored alongside a real choice; selectionFrom converts it.
type CrewDetails = {
  packageValue: string;
  overtimeHours: number;
  zoneValue: string;
  fourWd: FourWdAnswer;
  djHours: number;
};

type Option = { value: string; label: string };

const inputClasses =
  "w-full border border-neutral-700 bg-black px-4 py-3 font-sans text-sm text-white placeholder:text-neutral-600 focus:border-white focus:outline-none";
const labelClasses = "mb-2 block font-sans text-[10px] uppercase tracking-[0.3em] text-neutral-500";

const NOT_SURE = "unsure";

const packageOptions: Option[] = [
  ...pricing.packages.map((pkg) => ({ value: pkg.id, label: pkg.name })),
  { value: NOT_SURE, label: "Not sure" },
];

const zoneOptions: Option[] = [
  ...pricing.travelZones.map((zone) => ({
    value: zone.id,
    label: `${zone.label} · ${zone.distance}`,
  })),
  { value: NOT_SURE, label: "Not sure" },
];

const fourWdOptions: Option[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: NOT_SURE, label: "Not sure" },
];

const overtimeOptions: Option[] = Array.from({ length: pricing.overtime.maxHours + 1 }, (_, hours) => ({
  value: String(hours),
  label: hours === 0 ? "None" : `${hours} hr`,
}));

function detailsFrom(preset: Selection | null): CrewDetails {
  if (!preset) {
    return { packageValue: "", overtimeHours: 0, zoneValue: "", fourWd: "", djHours: 0 };
  }
  return {
    packageValue: preset.packageId ?? "",
    overtimeHours: preset.overtimeHours,
    zoneValue: preset.zoneId ?? "",
    fourWd: preset.offRoad ? "yes" : "no",
    djHours: preset.djHours,
  };
}

function selectionFrom(details: CrewDetails): Selection {
  return {
    packageId: toPackageId(details.packageValue),
    overtimeHours: details.overtimeHours,
    zoneId: toZoneId(details.zoneValue),
    offRoad: details.fourWd === "yes",
    djHours: details.djHours,
  };
}

function labelFor(options: Option[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? "Not selected";
}

export function BookingForm({
  defaultEventType,
  estimate,
}: {
  defaultEventType?: string;
  estimate?: Selection | null;
}) {
  const [state, setState] = useState<FormState>("idle");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [details, setDetails] = useState<CrewDetails>(() => detailsFrom(estimate ?? null));

  const result = buildEstimate(selectionFrom(details));
  const incomplete = result.incomplete || details.fourWd === "" || details.fourWd === NOT_SURE;

  const update = (changes: Partial<CrewDetails>) =>
    setDetails((prev) => ({ ...prev, ...changes }));

  if (!site.formspreeId) {
    return (
      <div className="border border-neutral-800 p-8 text-center">
        <p className="font-sans text-sm uppercase tracking-[0.25em] text-neutral-400">
          Booking form isn&apos;t connected yet.
        </p>
        <p className="mt-3 font-sans text-sm text-neutral-500">
          Reach out directly in the meantime:{" "}
          <a href={`mailto:${site.social.email}`} className="text-white underline underline-offset-4">
            {site.social.email}
          </a>
        </p>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const nextErrors: FieldErrors = {};
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const eventType = String(formData.get("eventType") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();

    if (!name) nextErrors.name = "Required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = "Enter a valid email";
    if (!eventType) nextErrors.eventType = "Required";
    if (!message) nextErrors.message = "Required";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setState("submitting");
    try {
      const response = await fetch(`https://formspree.io/f/${site.formspreeId}`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });
      if (response.ok) {
        setState("success");
        form.reset();
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="border border-neutral-800 p-8 text-center">
        <p className="font-sans text-sm uppercase tracking-[0.25em] text-white">
          {site.bookingSuccess.title}
        </p>
        <p className="mt-2 font-sans text-sm text-neutral-500">
          {site.bookingSuccess.subtitle}
        </p>
      </div>
    );
  }

  // Readable copies of the selections go to Formspree as labeled fields, so
  // the email shows "Package: Half Day" rather than an internal id.
  const addOnSummary =
    details.djHours > 0 ? `${pricing.addOns.houseDj.label} (${details.djHours} hr)` : "None";
  const totalSummary = result.customQuote ? "Custom quote" : formatUSD(result.total);
  const breakdownSummary = result.lines
    .map((line) => `${line.label}: ${line.amount !== null ? formatUSD(line.amount) : line.note}`)
    .join("\n");

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="Name" name="name" error={errors.name} required />
        <Field label="Email" name="email" type="email" error={errors.email} required />
        <Field label="Phone" name="phone" type="tel" />
        <Field label="Event Date" name="eventDate" type="date" />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className={labelClasses} htmlFor="eventType">
            Event Type
          </label>
          <select
            id="eventType"
            name="eventType"
            defaultValue={defaultEventType ?? ""}
            className={inputClasses}
            required
          >
            <option value="" disabled>
              Select one
            </option>
            {site.eventTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.eventType && <ErrorText>{errors.eventType}</ErrorText>}
        </div>

        <Field label="Location" name="location" placeholder="City, or venue" />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className={labelClasses} htmlFor="power">
            Is power available on site?
          </label>
          <select id="power" name="power" defaultValue="" className={inputClasses}>
            <option value="" disabled>
              Select one
            </option>
            {site.powerOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <Field label="Expected Crowd Size" name="crowdSize" placeholder="e.g. 50" />
      </div>

      <fieldset className="flex flex-col gap-6 border-t border-neutral-800 pt-8">
        <legend className={cn(labelClasses, "mb-6")}>Booking details</legend>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <SelectField
            id="package"
            label="Package"
            value={details.packageValue}
            options={packageOptions}
            onChange={(packageValue) => update({ packageValue })}
          />
          <SelectField
            id="overtime"
            label="Overtime"
            value={String(details.overtimeHours)}
            options={overtimeOptions}
            onChange={(value) => update({ overtimeHours: Number(value) })}
          />
          <SelectField
            id="travelZone"
            label="Travel Zone"
            value={details.zoneValue}
            options={zoneOptions}
            onChange={(zoneValue) => update({ zoneValue })}
          />
          <SelectField
            id="fourWd"
            label="Does the site require 4x4 access?"
            value={details.fourWd}
            options={fourWdOptions}
            onChange={(value) => update({ fourWd: value as FourWdAnswer })}
          />
        </div>

        <div>
          <p className={labelClasses}>Add-ons</p>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-4 border border-neutral-800 p-4">
              <label className="flex items-center gap-3 font-sans text-sm text-white">
                <input
                  type="checkbox"
                  checked={details.djHours > 0}
                  onChange={(event) => update({ djHours: event.target.checked ? 1 : 0 })}
                  className="h-4 w-4 accent-white"
                />
                {pricing.addOns.houseDj.label}
                <span className="text-xs text-neutral-500">
                  {formatUSD(pricing.addOns.houseDj.price)} / hr
                </span>
              </label>
              {details.djHours > 0 && (
                <label className="flex items-center gap-3 font-sans text-[10px] uppercase tracking-[0.3em] text-neutral-500">
                  Hours
                  <input
                    type="number"
                    min={1}
                    max={pricing.hourlyMaxHours}
                    value={details.djHours}
                    onChange={(event) =>
                      update({
                        djHours: Math.min(
                          pricing.hourlyMaxHours,
                          Math.max(1, Math.round(Number(event.target.value)) || 1)
                        ),
                      })
                    }
                    className={cn(inputClasses, "w-20 py-2")}
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Hidden fields carry the readable selections and estimate into the Formspree email. */}
        <input type="hidden" name="Package" value={labelFor(packageOptions, details.packageValue)} />
        <input type="hidden" name="Overtime" value={`${details.overtimeHours} hr`} />
        <input type="hidden" name="Travel Zone" value={labelFor(zoneOptions, details.zoneValue)} />
        <input type="hidden" name="4x4 Access Required" value={labelFor(fourWdOptions, details.fourWd)} />
        <input type="hidden" name="Add-Ons" value={addOnSummary} />
        <input type="hidden" name="Estimate" value={totalSummary} />
        <input type="hidden" name="Estimate Breakdown" value={breakdownSummary} />
      </fieldset>

      <div>
        <label className={labelClasses} htmlFor="message">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          className={inputClasses}
          required
        />
        {errors.message && <ErrorText>{errors.message}</ErrorText>}
      </div>

      <div className="flex flex-col gap-4 border border-neutral-800 p-6">
        <p className={labelClasses}>Estimate</p>
        <EstimateView estimate={result} />
        {incomplete && (
          <p className="font-sans text-xs leading-relaxed text-neutral-500">
            Choose a package, travel zone, and 4x4 answer to finish the estimate. Items marked
            Not sure are not priced.
          </p>
        )}
      </div>

      {state === "error" && (
        <p className="font-sans text-xs uppercase tracking-[0.25em] text-neutral-400">
          Something went wrong. Try again, or email {site.social.email} directly.
        </p>
      )}

      <button
        type="submit"
        disabled={state === "submitting"}
        className="inline-flex items-center justify-center border border-white bg-white px-6 py-3 font-sans text-xs uppercase tracking-[0.3em] text-black transition-colors hover:bg-black hover:text-white disabled:opacity-50"
      >
        {state === "submitting" ? "Sending..." : "Send"}
      </button>
    </form>
  );
}

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className={labelClasses} htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClasses}
      >
        <option value="" disabled>
          Select one
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  error,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className={labelClasses} htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className={cn(inputClasses, error && "border-neutral-400")}
      />
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 font-sans text-xs uppercase tracking-[0.2em] text-neutral-400">{children}</p>;
}
