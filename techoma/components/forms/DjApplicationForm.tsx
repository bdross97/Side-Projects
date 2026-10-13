"use client";

import { useState, type FormEvent } from "react";
import { site } from "@/content/site";
import { cn } from "@/lib/utils";

type FormState = "idle" | "submitting" | "success" | "error";

type FieldErrors = Partial<Record<"name" | "email" | "sampleMix" | "genres", string>>;

const inputClasses =
  "w-full border border-neutral-700 bg-black px-4 py-3 font-sans text-sm text-white placeholder:text-neutral-600 focus:border-white focus:outline-none";
const labelClasses = "mb-2 block font-sans text-[10px] uppercase tracking-[0.3em] text-neutral-500";

/** Standalone application for a guest DJ set — separate from the general booking form. */
export function DjApplicationForm() {
  const [state, setState] = useState<FormState>("idle");
  const [errors, setErrors] = useState<FieldErrors>({});

  if (!site.formspreeId) {
    return (
      <div className="border border-neutral-800 p-8 text-center">
        <p className="font-sans text-sm uppercase tracking-[0.25em] text-neutral-400">
          Applications aren&apos;t connected yet.
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
    const sampleMix = String(formData.get("sampleMix") ?? "").trim();
    const genres = String(formData.get("genres") ?? "").trim();

    if (!name) nextErrors.name = "Required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = "Enter a valid email";
    if (!sampleMix) nextErrors.sampleMix = "Required";
    if (!genres) nextErrors.genres = "Required";

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
          {site.djApplicationSuccess.title}
        </p>
        <p className="mt-2 font-sans text-sm text-neutral-500">
          {site.djApplicationSuccess.subtitle}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <input type="hidden" name="Form Type" value="DJ Application" />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="Name" name="name" error={errors.name} required />
        <Field label="Email" name="email" type="email" error={errors.email} required />
        <Field label="Phone" name="phone" type="tel" />
        <Field label="Instagram" name="instagram" placeholder="@handle or link" />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="Other Links" name="otherLinks" placeholder="SoundCloud, Mixcloud, etc." />
        <Field label="Genres" name="genres" placeholder="e.g. Melodic Techno, House" error={errors.genres} required />
      </div>

      <Field
        label="Sample Mix Link"
        name="sampleMix"
        type="url"
        placeholder="Link to a recent mix"
        error={errors.sampleMix}
        required
      />

      <div>
        <label className={labelClasses} htmlFor="message">
          Anything else?
        </label>
        <textarea id="message" name="message" rows={4} className={inputClasses} />
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
        {state === "submitting" ? "Sending..." : "Submit Application"}
      </button>
    </form>
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
      {error && (
        <p className="mt-2 font-sans text-xs uppercase tracking-[0.2em] text-neutral-400">{error}</p>
      )}
    </div>
  );
}
