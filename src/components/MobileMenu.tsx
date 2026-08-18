"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";
import { NavSearch } from "./NavSearch";

const LINKS = [
  { href: "/manufacturers", label: "Manufacturers" },
  { href: "/find-your-bike", label: "Find Your Bike" },
  { href: "/compare", label: "Compare" },
  { href: "/news", label: "News" },
  { href: "/route-plan", label: "Route Plan", badge: "New" },
];

/**
 * Full-screen mobile navigation overlay (landonorris.com-style): big stacked
 * uppercase nav items that stagger in, active item accented in azure. Light
 * theme to match the site. Locks scroll, traps Escape, respects reduced motion.
 */
export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const reduce = useReducedMotionSafe();

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.07, delayChildren: reduce ? 0 : 0.12 } },
    exit: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
  };
  const itemV = reduce
    ? { hidden: { opacity: 1 }, show: { opacity: 1 }, exit: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 28 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
        exit: { opacity: 0, y: 16, transition: { duration: 0.2 } },
      };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex flex-col bg-ink-100 md:hidden"
          initial={reduce ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
          animate={reduce ? { opacity: 1 } : { clipPath: "inset(0 0 0% 0)" }}
          exit={reduce ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: reduce ? 0.15 : 0.5, ease: [0.22, 1, 0.36, 1] }}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          {/* Topography line motif (subtle brand texture) */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.5]"
            style={{
              backgroundImage:
                "radial-gradient(120% 90% at 90% 10%, rgba(142,203,255,0.18) 0%, transparent 55%)",
            }}
          />

          {/* Top bar: brand + close */}
          <div className="container-page relative flex items-center justify-between pt-4">
            <span className="text-sm font-extrabold uppercase tracking-[0.2em] text-graphite-900">
              Motocodex
            </span>
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-400 bg-ink-50 text-lg text-graphite-900 transition-colors hover:bg-ink-200"
            >
              ✕
            </button>
          </div>

          {/* Search */}
          <motion.div
            className="container-page relative mt-6"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : 0.1, duration: 0.4 }}
          >
            <NavSearch />
          </motion.div>

          {/* Big stacked nav — fills remaining space, scrolls if needed */}
          <motion.nav
            variants={container}
            initial="hidden"
            animate="show"
            exit="exit"
            className="container-page relative flex flex-1 flex-col justify-center gap-0.5 overflow-y-auto py-6"
          >
            {LINKS.map((l) => {
              const active = pathname === l.href || pathname.startsWith(l.href + "/");
              return (
                <motion.div key={l.href} variants={itemV}>
                  <Link
                    href={l.href}
                    onClick={onClose}
                    aria-current={active ? "page" : undefined}
                    className="group flex items-center gap-2.5 py-1.5"
                  >
                    {/* active marker bar */}
                    <span
                      className={`h-7 w-1 shrink-0 rounded-full transition-colors ${
                        active ? "bg-azure" : "bg-transparent group-hover:bg-ink-400"
                      }`}
                    />
                    <span
                      className={`min-w-0 break-words text-[1.6rem] font-extrabold uppercase leading-tight tracking-tight transition-colors sm:text-3xl ${
                        active ? "text-graphite-900" : "text-graphite-500 group-hover:text-graphite-900"
                      }`}
                    >
                      {l.label}
                    </span>
                    {l.badge && (
                      <span className="shrink-0 self-start rounded-full bg-azure px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-graphite-900">
                        {l.badge}
                      </span>
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </motion.nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
