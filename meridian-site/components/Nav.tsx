"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { site } from "@/content/site";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { SocialLinks } from "./SocialLinks";
import { Wordmark } from "./Wordmark";

function isCurrent(pathname: string, href: string) {
  const clean = (p: string) => p.replace(/\/+$/, "") || "/";
  return clean(pathname) === clean(href);
}

export function DesktopNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="main" className="hidden md:block">
      <ul className="flex gap-6 text-sm">
        {site.nav.map((item) => {
          const current = isCurrent(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={`line-sweep ${current ? "text-accent" : "text-ink/80 hover:text-ink"}`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useFocusTrap(ref, open, close);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen(true)}
        className="-mr-2 px-2 py-2 text-sm"
      >
        {site.ui.menu}
      </button>
      {/* Portal: the header's backdrop-filter would otherwise trap this fixed panel inside it. */}
      {open &&
        createPortal(
          <div
            ref={ref}
            id="mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label={site.ui.menu}
            className="fixed inset-0 z-50 flex flex-col overflow-y-auto"
            style={{ background: "linear-gradient(to bottom, var(--sky-top), var(--sky-bottom))" }}
          >
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-ink/10 px-4">
              <Link href="/" onClick={close} className="w-28">
                <Wordmark tone="dark" />
              </Link>
              <button type="button" data-autofocus onClick={close} className="-mr-2 px-2 py-2 text-sm">
                {site.ui.close}
              </button>
            </div>
            <nav aria-label="main" className="px-4 py-8">
              <ul className="space-y-5 text-2xl">
                {site.nav.map((item) => {
                  const current = isCurrent(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={close}
                        aria-current={current ? "page" : undefined}
                        className={`line-sweep font-display font-light ${current ? "text-accent" : "text-ink"}`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="mt-auto border-t border-ink/10 px-4 py-6">
              <SocialLinks />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
