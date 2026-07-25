/**
 * Seed Motocodex from the JSON in /data/seeds.
 * Run: npm run db:seed  (or npm run db:setup to push schema first)
 *
 * The seed files are the canonical dataset for the Bangladesh motorcycle market.
 * They were gathered from public BD market listings (motorcyclevalley.com) with a
 * source `officialUrl` recorded for every model. Prices are in Bangladeshi Taka.
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const prisma = new PrismaClient();

type ManufacturerSeed = {
  slug: string;
  name: string;
  country: string;
  foundedYear?: number | null;
  website: string;
  accentColor: string;
  logoText: string;
  description: string;
};

type BikeSeed = {
  manufacturer: string; // manufacturer slug
  name: string;
  slug: string;
  series: string;
  category: string;
  year?: number | null;
  madeIn?: string | null;
  engineCc?: number | null;
  engineType?: string | null;
  powerHp?: number | null;
  powerUnit?: string | null;
  powerRpm?: number | null;
  powerRaw?: string | null;
  torqueNm?: number | null;
  torqueRpm?: number | null;
  torqueRaw?: string | null;
  topSpeedKph?: number | null;
  mileageKmpl?: number | null;
  weightKg?: number | null;
  priceBdt?: number | null;
  transmission?: string | null;
  cooling?: string | null;
  fuelSystem?: string | null;
  startMethod?: string | null;
  boreStroke?: string | null;
  compression?: string | null;
  lengthMm?: number | null;
  widthMm?: number | null;
  heightMm?: number | null;
  wheelbaseMm?: number | null;
  seatHeightMm?: number | null;
  groundClearance?: number | null;
  fuelCapacityL?: number | null;
  frontSuspension?: string | null;
  rearSuspension?: string | null;
  frontBrake?: string | null;
  rearBrake?: string | null;
  abs?: boolean;
  frontTyre?: string | null;
  rearTyre?: string | null;
  officialUrl: string;
  tagline?: string | null;
  imageHue?: number;
  imageUrl?: string | null;
  gallery?: string[] | null;
};

function load<T>(file: string): T {
  const p = join(process.cwd(), "data", "seeds", file);
  return JSON.parse(readFileSync(p, "utf-8")) as T;
}

type NewsSeed = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  manufacturerSlug?: string | null;
  bikeSlug?: string | null;
  publishedAt: string;
  readingMins?: number;
  heroHue?: number;
  tags?: string[];
  sections?: { heading: string; body: string }[];
  sources?: { title: string; url: string }[];
};

async function main() {
  const manufacturers = load<ManufacturerSeed[]>("manufacturers.json");
  const bikes = load<BikeSeed[]>("bikes.json");

  console.log(`Seeding ${manufacturers.length} manufacturers and ${bikes.length} bikes...`);

  // Clean slate for idempotent re-seeds
  await prisma.news.deleteMany();
  await prisma.bike.deleteMany();
  await prisma.manufacturer.deleteMany();

  const slugToId = new Map<string, number>();

  for (const m of manufacturers) {
    const created = await prisma.manufacturer.create({
      data: {
        slug: m.slug,
        name: m.name,
        country: m.country,
        foundedYear: m.foundedYear ?? null,
        website: m.website,
        accentColor: m.accentColor,
        logoText: m.logoText,
        description: m.description,
      },
    });
    slugToId.set(m.slug, created.id);
  }

  for (const b of bikes) {
    const manufacturerId = slugToId.get(b.manufacturer);
    if (!manufacturerId) {
      throw new Error(`Bike "${b.name}" references unknown manufacturer "${b.manufacturer}"`);
    }
    if (!b.officialUrl) {
      throw new Error(`Bike "${b.name}" is missing the required officialUrl field`);
    }
    await prisma.bike.create({
      data: {
        manufacturerId,
        name: b.name,
        slug: b.slug,
        series: b.series,
        category: b.category,
        year: b.year ?? null,
        madeIn: b.madeIn ?? null,
        engineCc: b.engineCc ?? null,
        engineType: b.engineType ?? null,
        powerHp: b.powerHp ?? null,
        powerUnit: b.powerUnit ?? null,
        powerRpm: b.powerRpm ?? null,
        powerRaw: b.powerRaw ?? null,
        torqueNm: b.torqueNm ?? null,
        torqueRpm: b.torqueRpm ?? null,
        torqueRaw: b.torqueRaw ?? null,
        topSpeedKph: b.topSpeedKph ?? null,
        mileageKmpl: b.mileageKmpl ?? null,
        weightKg: b.weightKg ?? null,
        priceBdt: b.priceBdt ?? null,
        transmission: b.transmission ?? null,
        cooling: b.cooling ?? null,
        fuelSystem: b.fuelSystem ?? null,
        startMethod: b.startMethod ?? null,
        boreStroke: b.boreStroke ?? null,
        compression: b.compression ?? null,
        lengthMm: b.lengthMm ?? null,
        widthMm: b.widthMm ?? null,
        heightMm: b.heightMm ?? null,
        wheelbaseMm: b.wheelbaseMm ?? null,
        seatHeightMm: b.seatHeightMm ?? null,
        groundClearance: b.groundClearance ?? null,
        fuelCapacityL: b.fuelCapacityL ?? null,
        frontSuspension: b.frontSuspension ?? null,
        rearSuspension: b.rearSuspension ?? null,
        frontBrake: b.frontBrake ?? null,
        rearBrake: b.rearBrake ?? null,
        abs: b.abs ?? false,
        frontTyre: b.frontTyre ?? null,
        rearTyre: b.rearTyre ?? null,
        officialUrl: b.officialUrl,
        tagline: b.tagline ?? null,
        imageHue: b.imageHue ?? 205,
        imageUrl: b.imageUrl ?? null,
        gallery: b.gallery && b.gallery.length ? JSON.stringify(b.gallery) : null,
      },
    });
  }

  // News / blog articles (optional — skipped if the seed file is absent)
  const newsPath = join(process.cwd(), "data", "seeds", "news.json");
  if (existsSync(newsPath)) {
    const news = JSON.parse(readFileSync(newsPath, "utf-8")) as NewsSeed[];
    for (const n of news) {
      await prisma.news.create({
        data: {
          slug: n.slug,
          title: n.title,
          excerpt: n.excerpt,
          category: n.category,
          manufacturerSlug: n.manufacturerSlug ?? null,
          bikeSlug: n.bikeSlug ?? null,
          publishedAt: n.publishedAt,
          readingMins: n.readingMins ?? 6,
          heroHue: n.heroHue ?? 205,
          tags: JSON.stringify(n.tags ?? []),
          sections: JSON.stringify(n.sections ?? []),
          sources: JSON.stringify(n.sources ?? []),
        },
      });
    }
    console.log(`Seeded ${news.length} news articles.`);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
