"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BikeCard, type BikeCardData } from "./BikeCard";
import { bdt } from "@/lib/format";

export type FilterBike = BikeCardData & {
  torqueNm: number | null;
  weightKg: number | null;
  series: string;
};

type Bounds = { cc: { min: number; max: number }; price: { min: number; max: number } };

// Null-safe numeric accessors: missing values sort to the bottom in either direction.
const hi = (n: number | null | undefined) => (n == null ? -Infinity : n);
const lo = (n: number | null | undefined) => (n == null ? Infinity : n);

const SORTS = {
  "power-desc": { label: "Power (high → low)", fn: (a: FilterBike, b: FilterBike) => hi(b.powerHp) - hi(a.powerHp) },
  "power-asc": { label: "Power (low → high)", fn: (a: FilterBike, b: FilterBike) => lo(a.powerHp) - lo(b.powerHp) },
  "price-asc": { label: "Price (low → high)", fn: (a: FilterBike, b: FilterBike) => lo(a.priceBdt) - lo(b.priceBdt) },
  "price-desc": { label: "Price (high → low)", fn: (a: FilterBike, b: FilterBike) => hi(b.priceBdt) - hi(a.priceBdt) },
  "cc-desc": { label: "Engine (large → small)", fn: (a: FilterBike, b: FilterBike) => hi(b.engineCc) - hi(a.engineCc) },
} as const;

export function FilterPanel({
  bikes,
  bounds,
  brands,
  categories,
  initialQuery = "",
  initialCategory = "",
}: {
  bikes: FilterBike[];
  bounds: Bounds;
  brands: { slug: string; name: string }[];
  categories: string[];
  initialQuery?: string;
  initialCategory?: string;
}) {
  const [maxCc, setMaxCc] = useState(bounds.cc.max);
  const [minCc, setMinCc] = useState(bounds.cc.min);
  const [maxPrice, setMaxPrice] = useState(bounds.price.max);
  const [activeBrands, setActiveBrands] = useState<Set<string>>(new Set());
  const [activeCats, setActiveCats] = useState<Set<string>>(
    initialCategory ? new Set([initialCategory]) : new Set()
  );
  const [q, setQ] = useState(initialQuery);
  const [sort, setSort] = useState<keyof typeof SORTS>("power-desc");

  // Keep state in sync if the user navigates with new query params.
  useEffect(() => setQ(initialQuery), [initialQuery]);
  useEffect(() => {
    if (initialCategory) setActiveCats(new Set([initialCategory]));
  }, [initialCategory]);

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, value: string) => {
    const next = new Set(set);
    next.has(value) ? next.delete(value) : next.add(value);
    setter(next);
  };

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return bikes
      .filter((b) => {
        if (b.engineCc != null && (b.engineCc < minCc || b.engineCc > maxCc)) return false;
        if (b.priceBdt != null && b.priceBdt > maxPrice) return false;
        if (activeBrands.size && !activeBrands.has(b.manufacturerSlug)) return false;
        if (activeCats.size && !activeCats.has(b.category)) return false;
        if (needle) {
          const hay = `${b.manufacturerName} ${b.name} ${b.series} ${b.category}`.toLowerCase();
          if (!hay.includes(needle)) return false;
        }
        return true;
      })
      .sort(SORTS[sort].fn);
  }, [bikes, minCc, maxCc, maxPrice, activeBrands, activeCats, q, sort]);

  const reset = () => {
    setMinCc(bounds.cc.min);
    setMaxCc(bounds.cc.max);
    setMaxPrice(bounds.price.max);
    setActiveBrands(new Set());
    setActiveCats(new Set());
    setQ("");
  };

  return (
    <div className="container-page grid gap-6 py-10 lg:grid-cols-[300px_1fr]">
      {/* Filter rail */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-graphite-900">Filters</h2>
            <button onClick={reset} className="text-xs font-semibold text-graphite-900 hover:underline">
              Reset
            </button>
          </div>

          <div className="mt-5">
            <input
              type="search"
              aria-label="Search models"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search models…"
              className="w-full rounded-sm border border-ink-500 bg-ink-50 px-3 py-2 text-sm text-graphite-900 placeholder:text-graphite-400 focus:border-graphite-900 focus:outline-none"
            />
          </div>

          {/* Engine CC sliders */}
          <div className="mt-6">
            <div className="flex justify-between text-xs font-semibold text-graphite-500">
              <span>Engine displacement</span>
              <span className="text-graphite-900">{minCc}–{maxCc} cc</span>
            </div>
            <label className="mt-3 block text-[11px] text-graphite-500">Min</label>
            <input
              type="range" min={bounds.cc.min} max={bounds.cc.max} value={minCc}
              onChange={(e) => setMinCc(Math.min(Number(e.target.value), maxCc))}
              className="w-full"
            />
            <label className="mt-2 block text-[11px] text-graphite-500">Max</label>
            <input
              type="range" min={bounds.cc.min} max={bounds.cc.max} value={maxCc}
              onChange={(e) => setMaxCc(Math.max(Number(e.target.value), minCc))}
              className="w-full"
            />
          </div>

          {/* Price slider */}
          <div className="mt-6">
            <div className="flex justify-between text-xs font-semibold text-graphite-500">
              <span>Max price</span>
              <span className="text-graphite-900">{bdt(maxPrice)}</span>
            </div>
            <input
              type="range" min={bounds.price.min} max={bounds.price.max} step={5000} value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="mt-3 w-full"
            />
          </div>

          {/* Category toggles */}
          <div className="mt-6">
            <p className="mb-2 text-xs font-semibold text-graphite-500">Style</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  aria-pressed={activeCats.has(c)}
                  onClick={() => toggle(activeCats, setActiveCats, c)}
                  className={`rounded-pill px-3 py-1.5 text-xs font-semibold transition-colors ${
                    activeCats.has(c)
                      ? "bg-azure text-graphite-900"
                      : "border border-ink-500 bg-ink-50 text-graphite-800 hover:bg-ink-200"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Brand toggles */}
          <div className="mt-6">
            <p className="mb-2 text-xs font-semibold text-graphite-500">Brand</p>
            <div className="flex flex-wrap gap-2">
              {brands.map((b) => (
                <button
                  key={b.slug}
                  aria-pressed={activeBrands.has(b.slug)}
                  onClick={() => toggle(activeBrands, setActiveBrands, b.slug)}
                  className={`rounded-pill px-3 py-1.5 text-xs font-semibold transition-colors ${
                    activeBrands.has(b.slug)
                      ? "bg-graphite-900 text-ink-50"
                      : "border border-ink-500 bg-ink-50 text-graphite-800 hover:bg-ink-200"
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Results */}
      <div id="results" tabIndex={-1}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-graphite-500">
            <span className="font-bold text-graphite-900">{filtered.length}</span> of {bikes.length} models
          </p>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as keyof typeof SORTS)}
            className="rounded-sm border border-ink-500 bg-ink-50 px-3 py-2 text-sm text-graphite-900 focus:outline-none"
          >
            {Object.entries(SORTS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        <motion.div layout className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((b, i) => (
              <motion.div
                key={`${b.manufacturerSlug}-${b.modelSlug}`}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
              >
                <BikeCard bike={b} index={i} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <div className="card mt-4 flex flex-col items-center gap-4 p-10 text-center">
            <div className="text-5xl opacity-40" aria-hidden>🔍</div>
            <p className="text-graphite-500">
              No bikes match these filters. Try widening the engine or price range.
            </p>
            <button onClick={reset} className="btn-ghost">
              Reset filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
