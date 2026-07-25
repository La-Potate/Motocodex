"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export type MegaMenuBike = {
  name: string;
  slug: string;
  series: string;
  category: string;
  engineCc: number | null;
};

export type MegaMenuData = Array<{
  slug: string;
  name: string;
  country: string;
  accentColor: string;
  logoText: string;
  bikeCount: number;
  bikes: MegaMenuBike[];
}>;

export function MegaMenu({ data }: { data: MegaMenuData }) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [activeSlug, setActiveSlug] = useState<string | null>(data[0]?.slug ?? null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const onLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  const active = data.find((m) => m.slug === activeSlug) ?? data[0];

  // Group the active manufacturer's bikes by series for the expanding grid.
  const seriesGroups = active
    ? Object.entries(
        active.bikes.reduce<Record<string, MegaMenuBike[]>>((acc, b) => {
          (acc[b.series] ||= []).push(b);
          return acc;
        }, {})
      )
    : [];

  return (
    <div className="relative" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <button
        className={`flex items-center gap-1.5 rounded-sm px-3 py-2 transition-colors hover:bg-ink-200 hover:text-graphite-900 ${
          open ? "bg-ink-200 text-graphite-900" : ""
        }`}
        aria-expanded={open}
      >
        Manufacturers
        <motion.svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          animate={reduce ? undefined : { rotate: open ? 180 : 0 }}
          transition={reduce ? { duration: 0 } : { duration: 0.2 }}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            transition={reduce ? { duration: 0 } : { duration: 0.18, ease: "easeOut" }}
            className="absolute left-0 top-full mt-2 flex overflow-hidden rounded-md border border-ink-400 bg-ink-50 shadow-float"
          >
            {/* Primary column — vertical list of all manufacturers */}
            <ul className="w-64 shrink-0 border-r border-ink-400 p-2">
              <li className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-widest text-graphite-400">
                All Manufacturers
              </li>
              {data.map((m) => {
                const isActive = m.slug === active?.slug;
                return (
                  <li key={m.slug}>
                    <Link
                      href={`/manufacturers/${m.slug}`}
                      onMouseEnter={() => setActiveSlug(m.slug)}
                      onFocus={() => setActiveSlug(m.slug)}
                      className={`group flex items-center justify-between rounded-sm px-3 py-2.5 transition-colors ${
                        isActive ? "bg-ink-200" : "hover:bg-ink-200"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className="flex h-7 w-9 items-center justify-center rounded-md text-[10px] font-black text-white"
                          style={{ backgroundColor: m.accentColor }}
                        >
                          {m.logoText}
                        </span>
                        <span className="flex flex-col">
                          <span className="text-sm font-semibold text-graphite-900">{m.name}</span>
                          <span className="text-[11px] text-graphite-500">{m.country}</span>
                        </span>
                      </span>
                      <motion.span
                        animate={reduce ? undefined : { x: isActive ? 0 : -4, opacity: isActive ? 1 : 0.3 }}
                        className="text-graphite-400"
                      >
                        ›
                      </motion.span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Secondary panel — expands SIDEWAYS revealing the model grid */}
            <AnimatePresence mode="wait">
              {active && (
                <motion.div
                  key={active.slug}
                  initial={reduce ? false : { width: 0, opacity: 0 }}
                  animate={{ width: 460, opacity: 1 }}
                  exit={reduce ? { opacity: 0 } : { width: 0, opacity: 0 }}
                  transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 30 }}
                  className="overflow-hidden"
                >
                  <div className="w-[460px] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: active.accentColor }}>
                          {active.name}
                        </p>
                        <p className="text-[11px] text-graphite-500">{active.bikeCount} models across the range</p>
                      </div>
                      <Link
                        href={`/manufacturers/${active.slug}`}
                        className="text-[11px] font-semibold text-graphite-600 hover:text-graphite-900"
                      >
                        View all →
                      </Link>
                    </div>

                    <div className="grid max-h-80 grid-cols-2 gap-2 overflow-y-auto pr-1">
                      {seriesGroups.map(([series, bikes], gi) => (
                        <motion.div
                          key={series}
                          initial={reduce ? false : { opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={reduce ? { duration: 0 } : { delay: 0.05 + gi * 0.04 }}
                          className="rounded-sm border border-ink-400 bg-ink-200 p-2.5"
                        >
                          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-graphite-400">
                            {series}
                          </p>
                          <ul className="space-y-0.5">
                            {bikes.map((b) => (
                              <li key={b.slug}>
                                <Link
                                  href={`/manufacturers/${active.slug}/${b.slug}`}
                                  className="flex items-center justify-between rounded-sm px-2 py-1.5 text-sm text-graphite-800 transition-colors hover:bg-ink-200 hover:text-graphite-900"
                                >
                                  <span className="font-medium">{b.name}</span>
                                  {b.engineCc != null && <span className="text-[10px] text-graphite-500">{b.engineCc}cc</span>}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
