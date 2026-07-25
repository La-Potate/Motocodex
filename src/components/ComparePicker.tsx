"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export type PickerBike = {
  token: string; // manufacturerSlug-modelSlug
  name: string;
  manufacturerName: string;
  category: string;
  engineCc: number | null;
  powerHp: number | null;
};

const MAX = 4;

export function ComparePicker({ bikes }: { bikes: PickerBike[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [q, setQ] = useState("");

  const toggle = (token: string) => {
    setSelected((cur) => {
      if (cur.includes(token)) return cur.filter((t) => t !== token);
      if (cur.length >= MAX) return cur;
      return [...cur, token];
    });
  };

  const go = () => {
    if (selected.length < 2) return;
    router.push(`/compare/${selected.join("-vs-")}`);
  };

  const filtered = bikes.filter((b) =>
    `${b.manufacturerName} ${b.name} ${b.category}`.toLowerCase().includes(q.trim().toLowerCase())
  );

  const selectedBikes = selected
    .map((t) => bikes.find((b) => b.token === t))
    .filter(Boolean) as PickerBike[];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search models to add…"
          className="mb-4 w-full rounded-sm border border-ink-500 bg-ink-50 px-4 py-3 text-sm text-graphite-900 placeholder:text-graphite-400 focus:border-graphite-900 focus:outline-none"
        />
        <div className="grid gap-2 sm:grid-cols-2">
          {filtered.map((b) => {
            const isOn = selected.includes(b.token);
            const full = selected.length >= MAX && !isOn;
            return (
              <button
                key={b.token}
                disabled={full}
                onClick={() => toggle(b.token)}
                className={`flex items-center justify-between rounded-sm border p-3 text-left transition-colors ${
                  isOn
                    ? "border-graphite-900 bg-azure"
                    : full
                    ? "cursor-not-allowed border-ink-400 bg-ink-200 opacity-50"
                    : "border-ink-400 bg-ink-50 hover:border-ink-500"
                }`}
              >
                <span>
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-graphite-500">
                    {b.manufacturerName}
                  </span>
                  <span className="text-sm font-bold text-graphite-900">{b.name}</span>
                </span>
                <span className="text-xs text-graphite-500">
                  {b.engineCc != null ? `${b.engineCc}cc` : "—"}
                  {b.powerHp != null ? ` · ${b.powerHp}hp` : ""}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selection tray */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="card p-5">
          <p className="text-sm font-bold uppercase tracking-widest text-graphite-900">
            Selected ({selected.length}/{MAX})
          </p>
          <div className="mt-4 space-y-2">
            <AnimatePresence>
              {selectedBikes.map((b) => (
                <motion.div
                  key={b.token}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  className="flex items-center justify-between rounded-sm bg-ink-200 px-3 py-2"
                >
                  <span className="text-sm font-semibold text-graphite-900">
                    {b.manufacturerName} {b.name}
                  </span>
                  <button onClick={() => toggle(b.token)} className="text-graphite-400 hover:text-graphite-900">
                    ✕
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {selected.length === 0 && (
              <div>
                <p className="text-xs text-graphite-500">Pick at least two bikes to compare.</p>
                <p className="mt-1 text-xs text-graphite-400">Tip: compare up to 4 bikes side by side.</p>
              </div>
            )}
          </div>
          <button
            onClick={go}
            disabled={selected.length < 2}
            className="btn-accent mt-5 w-full disabled:cursor-not-allowed disabled:opacity-40"
          >
            Compare {selected.length >= 2 ? `${selected.length} bikes` : ""}
          </button>
        </div>
      </aside>
    </div>
  );
}
