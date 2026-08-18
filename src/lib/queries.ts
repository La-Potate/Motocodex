/**
 * Server-only data access layer.
 *
 * Every database call in the app funnels through this module. It is imported
 * exclusively from Server Components / Route Handlers, so the Prisma client,
 * the schema shape, and the raw queries are NEVER serialised into a client
 * bundle. The browser only ever receives the already-rendered HTML/RSC payload.
 *
 * Each query is wrapped in React's cache() so that generateMetadata() and the
 * page body share one result per render instead of hitting the database twice.
 */
import { cache } from "react";
import { prisma } from "./db";
import type { Bike, Manufacturer } from "@prisma/client";

export type BikeWithManufacturer = Bike & { manufacturer: Manufacturer };

/** All manufacturers with their bikes — powers the mega menu. */
export const getManufacturersWithBikes = cache(async () => {
  return prisma.manufacturer.findMany({
    orderBy: { name: "asc" },
    include: {
      bikes: {
        orderBy: [{ series: "asc" }, { engineCc: "desc" }],
        select: { id: true, name: true, slug: true, series: true, category: true, engineCc: true, imageHue: true },
      },
    },
  });
});

/** Lightweight manufacturer list (cards, footers). */
export const getManufacturers = cache(async () => {
  return prisma.manufacturer.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { bikes: true } } },
  });
});

export const getManufacturerBySlug = cache(async (slug: string) => {
  return prisma.manufacturer.findUnique({
    where: { slug },
    include: { bikes: { orderBy: [{ series: "asc" }, { engineCc: "desc" }] } },
  });
});

/** A single bike resolved by manufacturer + model slug. */
export const getBike = cache(async (manufacturerSlug: string, modelSlug: string) => {
  return prisma.bike.findFirst({
    where: { slug: modelSlug, manufacturer: { slug: manufacturerSlug } },
    include: { manufacturer: true },
  });
});

/** All bikes joined with their manufacturer — used by /find-your-bike and /compare. */
export const getAllBikes = cache(async (): Promise<BikeWithManufacturer[]> => {
  return prisma.bike.findMany({
    orderBy: [{ priceBdt: "asc" }],
    include: { manufacturer: true },
  });
});

/** Resolve a single bike from a global "manufacturerSlug-modelSlug" combined token,
 * used by the /compare/[a-vs-b] route. We match against known slugs to avoid
 * ambiguity from hyphenated names. */
export const resolveBikeToken = cache(async (token: string): Promise<BikeWithManufacturer | null> => {
  // Fast path: the token is "${manufacturerSlug}-${modelSlug}", but both parts can
  // themselves contain hyphens, so try every hyphen split position with a direct,
  // indexed query. This avoids a full-table scan for the common case.
  const hyphens: number[] = [];
  for (let i = 0; i < token.length; i++) {
    if (token[i] === "-") hyphens.push(i);
  }
  for (const i of hyphens) {
    const mfgPart = token.slice(0, i);
    const modelPart = token.slice(i + 1);
    const bike = await prisma.bike.findFirst({
      where: { slug: modelPart, manufacturer: { slug: mfgPart } },
      include: { manufacturer: true },
    });
    if (bike) return bike;
  }

  // Fallback: original behavior — scan all bikes, exact combined match first.
  const all = await getAllBikes();
  // Try exact "manufacturer/model" combinations first.
  for (const bike of all) {
    const combined = `${bike.manufacturer.slug}-${bike.slug}`;
    if (combined === token) return bike;
  }
  // Fallback: match by model slug alone if unique.
  const byModel = all.filter((b) => b.slug === token);
  if (byModel.length === 1) return byModel[0];
  return null;
});

/** Homepage helpers. */
export const getFeaturedBikes = cache(async (limit = 6) => {
  return prisma.bike.findMany({
    orderBy: [{ powerHp: "desc" }],
    take: limit,
    include: { manufacturer: true },
  });
});

export const getCategorySummary = cache(async () => {
  const grouped = await prisma.bike.groupBy({
    by: ["category"],
    _count: { category: true },
    orderBy: { _count: { category: "desc" } },
  });
  return grouped.map((g) => ({ category: g.category, count: g._count.category }));
});

/** Min/max bounds for filter sliders. */
export const getFilterBounds = cache(async () => {
  const agg = await prisma.bike.aggregate({
    _min: { engineCc: true, priceBdt: true },
    _max: { engineCc: true, priceBdt: true },
  });
  return {
    cc: { min: agg._min.engineCc ?? 0, max: agg._max.engineCc ?? 400 },
    price: { min: agg._min.priceBdt ?? 0, max: agg._max.priceBdt ?? 700000 },
  };
});

/** News / blog articles. */
export const getNews = cache(async () => {
  return prisma.news.findMany({ orderBy: { publishedAt: "desc" } });
});

export const getNewsBySlug = cache(async (slug: string) => {
  return prisma.news.findUnique({ where: { slug } });
});

/** Find an ownership/issues article for a specific model (for spec-page cross-links). */
export const getNewsForBike = cache(async (manufacturerSlug: string, modelSlug: string) => {
  return prisma.news.findFirst({
    where: { manufacturerSlug, bikeSlug: modelSlug },
  });
});

export const getStats = cache(async () => {
  const [bikeCount, manufacturerCount, categories] = await Promise.all([
    prisma.bike.count(),
    prisma.manufacturer.count(),
    prisma.bike.findMany({ select: { category: true }, distinct: ["category"] }),
  ]);
  return { bikeCount, manufacturerCount, categoryCount: categories.length };
});
