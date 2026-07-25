"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { MegaMenu, type MegaMenuData } from "./MegaMenu";
import { NavSearch } from "./NavSearch";
import { MobileMenu } from "./MobileMenu";

/**
 * Transparent-on-top header that morphs into a floating, frosted pill once the
 * page scrolls. Pure CSS transitions on class swaps keep it smooth and cheap.
 */
export function NavbarChrome({ data }: { data: MegaMenuData }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Active-route styling for a nav link (matches the section, incl. sub-routes).
  const navClass = (href: string) => {
    const active = pathname === href || pathname.startsWith(href + "/");
    return `rounded-pill px-3 py-2 transition-colors hover:bg-ink-200 hover:text-graphite-900 ${
      active ? "bg-ink-200 text-graphite-900" : ""
    }`;
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // (Escape-to-close + scroll-lock are handled inside <MobileMenu>.)
  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-50">
      <div className={`container-page transition-all duration-300 ${scrolled ? "pt-3" : "pt-0"}`}>
        <div
          className={`flex items-center justify-between gap-6 px-3 pl-4 transition-all duration-300 ease-out ${
            scrolled
              ? "h-14 rounded-pill border border-ink-400 bg-ink-50 shadow-float"
              : "h-16 rounded-md border border-transparent bg-transparent"
          }`}
        >
          <Link href="/" className="group flex items-center" aria-label="Motocodex home">
            <Image
              src="/logo.png"
              alt="Motocodex"
              width={994}
              height={240}
              priority
              className="h-8 w-auto transition-transform group-hover:scale-105 sm:h-9"
            />
          </Link>

          <nav className="hidden items-center gap-1 text-sm font-semibold text-graphite-600 md:flex">
            <MegaMenu data={data} />
            <Link href="/find-your-bike" className={navClass("/find-your-bike")}>
              Find Your Bike
            </Link>
            <Link href="/compare" className={navClass("/compare")}>
              Compare
            </Link>
            <Link href="/news" className={navClass("/news")}>
              News
            </Link>
            <Link href="/route-plan" className={`flex items-center gap-1.5 ${navClass("/route-plan")}`}>
              Route Plan
              <span className="rounded-full bg-azure px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-graphite-900">
                New
              </span>
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <NavSearch />
            </div>
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-400 bg-ink-50 text-graphite-800 md:hidden"
            >
              <span className="text-lg leading-none">{mobileOpen ? "✕" : "☰"}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Full-screen mobile navigation overlay */}
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}
