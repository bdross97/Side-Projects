"use client";

import { type FormEvent, useState } from "react";
import { site } from "@/content/site";

const copy = site.contact.form;
const isConnected = Boolean(site.formspreeId) && !site.formspreeId.includes("_HERE");

type Status = "idle" | "sending" | "sent" | "error";

function EmailLink() {
  return (
    <a href={`mailto:${site.email}`} className="text-accent hover:underline">
      {site.email}
    </a>
  );
}

const field =
  "mt-1 block w-full border-0 border-b border-ink/40 bg-transparent px-0 py-2 text-ink placeholder:text-ink/40 focus:border-accent focus:ring-0 focus:outline-none";

export function BookingForm() {
  const [status, setStatus] = useState<Status>("idle");

  if (!isConnected) {
    return (
      <p className="text-ink/90">
        {copy.notConnected} <EmailLink />
      </p>
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus("sending");
    try {
      const res = await fetch(`https://formspree.io/f/${site.formspreeId}`, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <label className="block text-sm">
          {copy.name}
          <input name="name" required autoComplete="name" className={field} />
        </label>
        <label className="block text-sm">
          {copy.email}
          <input name="email" type="email" required autoComplete="email" className={field} />
        </label>
        <label className="block text-sm">
          {copy.venue}
          <input name="venue" className={field} />
        </label>
        <label className="block text-sm">
          {copy.date}
          <input name="date" type="date" className={field} />
        </label>
      </div>
      <label className="block text-sm">
        {copy.message}
        <textarea name="message" rows={5} required className={field} />
      </label>

      {/* honeypot: hidden from people, bots fill it in, Formspree drops those */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          {copy.honeypot}
          <input name="_gotcha" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={status === "sending"}
          className="border border-accent px-6 py-2 text-sm text-accent hover:bg-accent hover:text-canvas disabled:opacity-60"
        >
          {status === "sending" ? copy.sending : copy.submit}
        </button>
        <p role="status" className="text-sm">
          {status === "sent" && copy.sent}
          {status === "error" && (
            <>
              {copy.error} <EmailLink />
            </>
          )}
        </p>
      </div>
    </form>
  );
}
