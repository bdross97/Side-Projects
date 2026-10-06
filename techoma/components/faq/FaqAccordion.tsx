"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import type { FaqCategory } from "@/content/faq";
import { cn } from "@/lib/utils";

/** One category of questions. Only one answer is open at a time. */
export function FaqAccordion({ category }: { category: FaqCategory }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const reducedMotion = useReducedMotion();

  return (
    <div className="border-b border-neutral-800">
      {category.items.map((item, index) => {
        const open = openIndex === index;
        const buttonId = `faq-${category.id}-${index}-button`;
        const panelId = `faq-${category.id}-${index}-panel`;

        return (
          <div key={item.question} className="border-t border-neutral-800">
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={open}
                aria-controls={open ? panelId : undefined}
                onClick={() => setOpenIndex(open ? null : index)}
                className="flex w-full items-center justify-between gap-6 py-5 text-left font-sans text-sm text-white md:text-base"
              >
                <span>{item.question}</span>
                <PlusMinus open={open} />
              </button>
            </h3>

            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  key="panel"
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: reducedMotion ? 0 : 0.3, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="max-w-2xl pb-6 font-sans text-sm leading-relaxed text-neutral-400 md:text-base">
                    <AnswerText text={item.answer} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/** Two 1px bars. The vertical one collapses when open, leaving a minus. */
function PlusMinus({ open }: { open: boolean }) {
  return (
    <span aria-hidden="true" className="relative h-4 w-4 shrink-0">
      <span className="absolute left-0 top-1/2 h-px w-4 -translate-y-1/2 bg-white" />
      <span
        className={cn(
          "absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 bg-white transition-transform duration-200",
          open && "scale-y-0"
        )}
      />
    </span>
  );
}

const linkClasses =
  "text-white underline underline-offset-4 decoration-neutral-500 transition-colors hover:decoration-white";

/** Renders [label](href) as underlined links; internal paths use next/link. */
function AnswerText({ text }: { text: string }) {
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const [, label, href] = match;
    parts.push(
      href.startsWith("/") ? (
        <Link key={match.index} href={href} className={linkClasses}>
          {label}
        </Link>
      ) : (
        <a key={match.index} href={href} className={linkClasses} target="_blank" rel="noreferrer">
          {label}
        </a>
      )
    );
    last = linkPattern.lastIndex;
  }

  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}
