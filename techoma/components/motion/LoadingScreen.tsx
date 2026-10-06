"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ConeMark } from "./ConeMark";
import { Wordmark } from "./Wordmark";
import { useReducedMotion } from "./useReducedMotion";

const STORAGE_KEY = "techoma-intro-seen";

export function LoadingScreen() {
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  const dismissedRef = useRef(false);

  const dismiss = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // sessionStorage unavailable (private mode, etc.) — fine to no-op
    }
    setVisible(false);
  }, []);

  useLayoutEffect(() => {
    // Gate client-only rendering to avoid an SSR/hydration mismatch (sessionStorage
    // doesn't exist on the server); useLayoutEffect keeps this pre-paint so there's no flash.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    let alreadySeen = false;
    try {
      alreadySeen = Boolean(sessionStorage.getItem(STORAGE_KEY));
    } catch {
      alreadySeen = false;
    }
    if (alreadySeen) {
      dismissedRef.current = true;
      setVisible(false);
    }
  }, []);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loading-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[90] flex cursor-pointer flex-col items-center justify-center gap-8 bg-black"
          onClick={dismiss}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") dismiss();
          }}
          role="button"
          tabIndex={0}
          aria-label="Skip intro"
        >
          <ConeMark size={64} animate={!reducedMotion} className="text-white" />
          <Wordmark
            size="header"
            onDecodeComplete={() => {
              window.setTimeout(dismiss, reducedMotion ? 300 : 900);
            }}
          />
          <span className="absolute bottom-10 font-sans text-xs uppercase tracking-[0.3em] text-neutral-500">
            Tap to skip
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
