"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";
import { asset } from "@/lib/basePath";

// Client-only: the WebGL canvas must never render on the server.
const ModelViewer = dynamic(() => import("./ModelViewer"), {
  ssr: false,
  loading: () => <ShowcasePoster label="Loading 3D…" />,
});

// Lightweight placeholder shown before the (heavy) 3D canvas mounts.
function ShowcasePoster({ label }: { label?: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3">
      <div className="text-7xl opacity-80" aria-hidden>
        🏍️
      </div>
      {label && (
        <span className="text-[11px] font-semibold uppercase tracking-widest text-graphite-400">
          {label}
        </span>
      )}
    </div>
  );
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

export type HeroBike = {
  name: string;
  manufacturerName: string;
  href: string;
  imageUrl: string | null;
  engineCc: number | null;
  priceBdt: number | null;
  mileageKmpl: number | null;
  powerHp: number | null;
};

export function Hero({
  stats,
  heroBike,
}: {
  stats: { bikeCount: number; manufacturerCount: number; categoryCount: number };
  heroBike?: HeroBike | null;
}) {
  const [q, setQ] = useState("");
  const router = useRouter();
  const reduce = useReducedMotionSafe();

  // Defer the 2.2 MB WebGL model until the page is painted & idle, so it never
  // blocks LCP. The bike is the hero's subject rather than decoration, so a
  // reduced-motion preference suppresses its auto-rotation (see ModelViewer)
  // rather than withholding the model.
  const [show3d, setShow3d] = useState(false);
  useEffect(() => {
    const w = window as unknown as { requestIdleCallback?: (cb: () => void) => number };
    const t =
      typeof w.requestIdleCallback === "function"
        ? w.requestIdleCallback(() => setShow3d(true))
        : window.setTimeout(() => setShow3d(true), 600);
    return () => {
      if (typeof w.requestIdleCallback === "function") {
        (window as unknown as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(t as number);
      } else {
        clearTimeout(t as number);
      }
    };
  }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/find-your-bike?q=${encodeURIComponent(q)}`);
  };

  return (
    <section className="relative overflow-hidden border-b border-ink-400">
      <div className="container-page relative grid items-center gap-8 py-10 lg:min-h-[calc(100vh-5rem)] lg:grid-cols-[40fr_60fr] lg:gap-10 lg:py-8">
        {/* Copy column */}
        <motion.div variants={stagger} initial={reduce ? false : "hidden"} animate="show">
          <motion.span variants={item} className="eyebrow">
            Bangladesh’s motorcycle codex
          </motion.span>

          <motion.h1
            variants={item}
            className="mt-5 text-xl font-extrabold leading-[1.15] tracking-tight text-graphite-900 sm:text-2xl lg:text-[2rem]"
          >
            Find, compare &amp;{" "}
            <span className="relative whitespace-nowrap">
              <span className="relative z-10">decide</span>
              <span aria-hidden className="absolute inset-x-0 bottom-0.5 z-0 h-2 bg-azure sm:bottom-1 sm:h-2.5" />
            </span>
            <br />
            your next motorcycle.
          </motion.h1>

          <motion.p variants={item} className="mt-6 max-w-xl text-md leading-relaxed text-graphite-600">
            Engine, power, torque, mileage, weight and on-road price in{" "}
            <span className="font-semibold text-graphite-900">৳ BDT</span> — normalised so you can compare
            any two bikes side by side. {stats.bikeCount}+ models, {stats.manufacturerCount} brands, one
            source of truth.
          </motion.p>

          <motion.form variants={item} onSubmit={onSearch} className="mt-8 flex max-w-md gap-2">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-graphite-400">⌕</span>
              <input
                type="search"
                aria-label="Search motorcycles"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search R15, MT-15, Pulsar, Gixxer…"
                className="w-full rounded-pill border border-ink-500 bg-ink-50 py-3 pl-10 pr-10 text-sm text-graphite-900 placeholder:text-graphite-400 focus:border-graphite-900 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
              />
              {q && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setQ("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-graphite-400 hover:text-graphite-900"
                >
                  ✕
                </button>
              )}
            </div>
            <button type="submit" className="btn-accent shrink-0">Search</button>
          </motion.form>

          <motion.div variants={item} className="mt-5 flex flex-wrap items-center gap-3">
            <Link href="/find-your-bike" className="btn-dark">Find your bike →</Link>
            <Link href="/compare" className="btn-ghost">Compare two bikes</Link>
          </motion.div>

          {/* Trust stat row */}
          <motion.div variants={item} className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            {[
              { value: `${stats.bikeCount}+`, label: "Models tracked" },
              { value: stats.manufacturerCount, label: "Brands" },
              { value: stats.categoryCount, label: "Categories" },
              { value: "100%", label: "Sourced & cited" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col">
                <span className="text-2xl font-extrabold text-graphite-900">{s.value}</span>
                <span className="text-[11px] font-semibold uppercase tracking-widest text-graphite-500">
                  {s.label}
                </span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Free-standing 3D showcase — transparent canvas, centred in its column */}
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={reduce ? { duration: 0 } : { duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative h-[22rem] cursor-grab touch-none self-stretch active:cursor-grabbing sm:h-[28rem] lg:h-full"
        >
          {show3d ? <ModelViewer src={asset("/models/h2r.glb")} /> : <ShowcasePoster />}
        </motion.div>
      </div>
    </section>
  );
}
