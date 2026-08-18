"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";

export type FaqItem = { q: string; a: string };

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const reduce = useReducedMotionSafe();
  return (
    <div className="mx-auto max-w-3xl divide-y divide-ink-400 overflow-hidden rounded-md border border-ink-400 bg-ink-50 shadow-card">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={i}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={isOpen}
              aria-controls={`faq-panel-${i}`}
            >
              <span className="text-sm font-bold text-graphite-900 sm:text-base">{item.q}</span>
              <motion.span
                animate={reduce ? undefined : { rotate: isOpen ? 45 : 0 }}
                transition={reduce ? { duration: 0 } : { duration: 0.2 }}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-azure text-lg text-graphite-900"
              >
                {reduce ? (isOpen ? "−" : "+") : "+"}
              </motion.span>
            </button>
            {reduce ? (
              isOpen && (
                <div
                  id={`faq-panel-${i}`}
                  role="region"
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-5 text-sm leading-relaxed text-graphite-600">{item.a}</p>
                </div>
              )
            ) : (
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    id={`faq-panel-${i}`}
                    role="region"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-sm leading-relaxed text-graphite-600">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        );
      })}
    </div>
  );
}
