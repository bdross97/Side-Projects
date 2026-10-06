"use client";

import { useState } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/motion/Wordmark";
import { MobileNav } from "./MobileNav";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[75] flex items-center justify-between border-b border-neutral-900 bg-black/90 px-6 py-4 backdrop-blur-sm">
        <Link href="/" aria-label="The TECHOMA — home" className="text-white">
          <Wordmark size="header" skipDecode className="text-white" />
        </Link>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="font-sans text-xs uppercase tracking-[0.3em] text-neutral-400 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          Menu
        </button>
      </header>

      {/* Rendered as a header sibling, not a child: backdrop-blur on
          <header> would otherwise become the containing block for this
          panel's fixed positioning and break full-viewport coverage. */}
      <MobileNav open={open} onClose={() => setOpen(false)} />
    </>
  );
}
