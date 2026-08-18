"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { asset } from "@/lib/basePath";

type Result = {
  name: string;
  manufacturer: string;
  href: string;
  category?: string | null;
  engineCc: number | null;
  powerHp: number | null;
};

/**
 * Global navbar search. Loads a small prebuilt index once (the site is a static
 * export, so there is no query endpoint to call) and filters it in the browser,
 * which also stops the old behaviour of refetching on every keystroke.
 * Compact button on small screens that expands; inline input on desktop.
 */
export function NavSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);

  // Load the index once, lazily, on first interaction.
  const index = useRef<Result[] | null>(null);
  const loadIndex = async () => {
    if (index.current) return index.current;
    const res = await fetch(asset("/search-index.json"));
    index.current = (await res.json()) as Result[];
    return index.current;
  };

  useEffect(() => {
    const term = q.trim().toLowerCase();
    if (debounce.current) clearTimeout(debounce.current);
    if (term.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounce.current = setTimeout(async () => {
      const id = ++seq.current;
      setLoading(true);
      try {
        const all = await loadIndex();
        if (id !== seq.current) return;
        setResults(
          all
            .filter((b) =>
              `${b.manufacturer} ${b.name} ${b.category ?? ""}`.toLowerCase().includes(term)
            )
            .slice(0, 12)
        );
        setActive(-1);
        setOpen(true);
      } catch {
        if (id === seq.current) setResults([]);
      } finally {
        if (id === seq.current) setLoading(false);
      }
    }, 120);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [q]);

  // Close on outside click + Cmd/Ctrl-K to focus.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || !results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      window.location.href = results[active].href;
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-graphite-400">⌕</span>
        <input
          ref={inputRef}
          type="search"
          aria-label="Search motorcycles"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search bikes…"
          className="w-40 rounded-pill border border-ink-400 bg-ink-50 py-1.5 pl-8 pr-3 text-sm text-graphite-900 placeholder:text-graphite-400 transition-[width] duration-300 ease-snap focus:w-56 focus:border-graphite-900 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {loading && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-graphite-400">…</span>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute right-0 z-50 mt-2 max-h-80 w-72 overflow-auto rounded-md border border-ink-400 bg-ink-50 py-1 shadow-float">
          {results.map((r, i) => (
            <li key={r.href}>
              <Link
                href={r.href}
                onClick={() => setOpen(false)}
                onMouseEnter={() => setActive(i)}
                className={`flex items-center justify-between gap-3 px-3 py-2 text-sm ${
                  i === active ? "bg-azure/40 text-graphite-900" : "text-graphite-800 hover:bg-ink-200"
                }`}
              >
                <span className="min-w-0">
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-graphite-500">
                    {r.manufacturer}
                  </span>
                  <span className="truncate font-semibold">{r.name}</span>
                </span>
                <span className="shrink-0 text-[11px] text-graphite-500">
                  {r.engineCc != null ? `${r.engineCc}cc` : ""}
                  {r.powerHp != null ? ` · ${r.powerHp}hp` : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {open && !loading && q.trim().length >= 2 && results.length === 0 && (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-md border border-ink-400 bg-ink-50 px-3 py-3 text-sm text-graphite-500 shadow-float">
          No bikes match “{q.trim()}”.
        </div>
      )}
    </div>
  );
}
