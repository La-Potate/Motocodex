/**
 * Server-only data access layer.
 *
 * Every database call in the app funnels through this module. It is imported
 * exclusively from Server Components / Route Handlers, so the Prisma client,
 * the schema shape, and the raw queries are NEVER serialised into a client
 * bundle. The browser only ever receives the already-rendered HTML/RSC payload.
 */
import { prisma } from "./db";
import type { Bike, Manufacturer } from "@prisma/client";

export type BikeWithManufacturer = Bike & { manufacturer: Manufacturer };

/** All manufacturers with their bikes — powers the mega menu. */
export async function getManufacturersWithBikes() {
  return prisma.manufacturer.findMany({
    orderBy: { name: "asc" },
    include: {
      bikes: {
        orderBy: [{ series: "asc" }, { engineCc: "desc" }],
        select: { id: true, name: true, slug: true, series: true, category: true, engineCc: true, imageHue: true },
      },
    },
  });
}

/** Lightweight manufacturer list (cards, footers). */
export async function getManufacturers() {
  return prisma.manufacturer.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { bikes: true } } },
  });
}

export async function getManufacturerBySlug(slug: string) {
  return prisma.manufacturer.findUnique({
    where: { slug },
    include: { bikes: { orderBy: [{ series: "asc" }, { engineCc: "desc" }] } },
  });
}

/** A single bike resolved by manufacturer + model slug. */
export async function getBike(manufacturerSlug: string, modelSlug: string) {
  return prisma.bike.findFirst({
    where: { slug: modelSlug, manufacturer: { slug: manufacturerSlug } },
    include: { manufacturer: true },
  });
}

/** All bikes joined with their manufacturer — used by /find-your-bike and /compare. */
export async function getAllBikes(): Promise<BikeWithManufacturer[]> {
  return prisma.bike.findMany({
    orderBy: [{ priceBdt: "asc" }],
    include: { manufacturer: true },
  });
}

/** Resolve a single bike from a global "manufacturerSlug-modelSlug" combined token,
 * used by the /compare/[a-vs-b] route. We match against known slugs to avoid
 * ambiguity from hyphenated names. */
export async function resolveBikeToken(token: string): Promise<BikeWithManufacturer | null> {
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
}

/** Homepage helpers. */
export async function getFeaturedBikes(limit = 6) {
  return prisma.bike.findMany({
    orderBy: [{ powerHp: "desc" }],
    take: limit,
    include: { manufacturer: true },
  });
}

export async function getCategorySummary() {
  const grouped = await prisma.bike.groupBy({
    by: ["category"],
    _count: { category: true },
    orderBy: { _count: { category: "desc" } },
  });
  return grouped.map((g) => ({ category: g.category, count: g._count.category }));
}

/** Min/max bounds for filter sliders. */
export async function getFilterBounds() {
  const agg = await prisma.bike.aggregate({
    _min: { engineCc: true, priceBdt: true },
    _max: { engineCc: true, priceBdt: true },
  });
  return {
    cc: { min: agg._min.engineCc ?? 0, max: agg._max.engineCc ?? 400 },
    price: { min: agg._min.priceBdt ?? 0, max: agg._max.priceBdt ?? 700000 },
  };
}

/** News / blog articles. */
export async function getNews() {
  return prisma.news.findMany({ orderBy: { publishedAt: "desc" } });
}

export async function getNewsBySlug(slug: string) {
  return prisma.news.findUnique({ where: { slug } });
}

/** Find an ownership/issues article for a specific model (for spec-page cross-links). */
export async function getNewsForBike(manufacturerSlug: string, modelSlug: string) {
  return prisma.news.findFirst({
    where: { manufacturerSlug, bikeSlug: modelSlug },
  });
}

export async function getStats() {
  const [bikeCount, manufacturerCount, categories] = await Promise.all([
    prisma.bike.count(),
    prisma.manufacturer.count(),
    prisma.bike.findMany({ select: { category: true }, distinct: ["category"] }),
  ]);
  return { bikeCount, manufacturerCount, categoryCount: categories.length };
}
