"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { bdt } from "@/lib/format";

export type BikeCardData = {
  name: string;
  modelSlug: string;
  manufacturerSlug: string;
  manufacturerName: string;
  category: string;
  engineCc: number | null;
  powerHp: number | null;
  priceBdt: number | null;
  mileageKmpl?: number | null;
  imageUrl?: string | null;
  imageHue: number;
  tagline?: string | null;
};

export function BikeCard({ bike, index = 0 }: { bike: BikeCardData; index?: number }) {
  const reduce = useReducedMotion();
  const headline =
    bike.powerHp != null ? `${bike.powerHp} hp` : bike.engineCc != null ? `${bike.engineCc} cc` : "—";

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={reduce ? { duration: 0 } : { duration: 0.4, delay: (index % 6) * 0.05 }}
      className="h-full"
    >
      <Link href={`/manufacturers/${bike.manufacturerSlug}/${bike.modelSlug}`} className="block h-full">
        <motion.article
          whileHover={reduce ? undefined : { y: -6 }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 22 }}
          className="group flex h-full flex-col overflow-hidden rounded-lg bg-ink-50 shadow-card ring-1 ring-ink-400/70 transition-shadow duration-300 hover:shadow-float"
        >
          {/* Borderless image stage — soft tinted wash, image floats free */}
          <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-b from-ink-100 to-ink-200">
            {/* category chip */}
            <span className="absolute left-3 top-3 z-10 rounded-pill bg-graphite-900/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-ink-50">
              {bike.category}
            </span>

            {bike.imageUrl ? (
              <Image
                src={bike.imageUrl}
                alt={`${bike.manufacturerName} ${bike.name}`}
                fill
                sizes="(max-width:768px) 50vw, 25vw"
                className="object-contain p-5 drop-shadow-[0_18px_22px_rgba(17,17,18,0.18)] transition-transform duration-500 ease-snap group-hover:scale-[1.08]"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl font-black text-graphite-900/10">
                  {bike.engineCc ?? "🏍"}
                </span>
              </div>
            )}

            {/* subtle floor reflection line */}
            <div className="absolute inset-x-6 bottom-4 h-px bg-graphite-900/10" />
          </div>

          {/* Body */}
          <div className="flex flex-1 flex-col p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-graphite-500">
              {bike.manufacturerName}
            </p>
            <h3 className="mt-1 text-lg font-extrabold leading-snug text-graphite-900 transition-colors group-hover:text-graphite-900">
              {bike.name}
            </h3>

            {/* spec strip */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {bike.engineCc != null && (
                <span className="rounded-xs bg-ink-200 px-2 py-1 text-[11px] font-semibold text-graphite-800">
                  {bike.engineCc} cc
                </span>
              )}
              <span className="rounded-xs bg-ink-200 px-2 py-1 text-[11px] font-semibold text-graphite-800">
                {headline}
              </span>
              {bike.mileageKmpl != null && (
                <span className="rounded-xs bg-azure px-2 py-1 text-[11px] font-semibold text-graphite-900">
                  {bike.mileageKmpl} km/l
                </span>
              )}
            </div>

            {/* price footer */}
            <div className="mt-auto flex items-end justify-between pt-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-graphite-400">
                  Price in BD
                </p>
                <p className="text-base font-extrabold text-graphite-900">{bdt(bike.priceBdt)}</p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-graphite-900 text-ink-50 transition-all duration-300 group-hover:bg-azure group-hover:text-graphite-900">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
          </div>
        </motion.article>
      </Link>
    </motion.div>
  );
}
