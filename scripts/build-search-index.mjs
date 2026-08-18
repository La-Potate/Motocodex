/**
 * Emit public/search-index.json for the static build.
 *
 * A static host cannot run /api/bikes?q=, so the navbar search ships the index
 * instead and filters in the browser. Same minimal field set the API returned —
 * name, slugs and two headline numbers — never the full spec structure, which
 * stays server-rendered.
 */
import { PrismaClient } from "@prisma/client";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const prisma = new PrismaClient();

const bikes = await prisma.bike.findMany({
  include: { manufacturer: true },
  orderBy: [{ manufacturer: { name: "asc" } }, { name: "asc" }],
});

const index = bikes.map((b) => ({
  name: b.name,
  manufacturer: b.manufacturer.name,
  href: `/manufacturers/${b.manufacturer.slug}/${b.slug}`,
  category: b.category,
  engineCc: b.engineCc,
  powerHp: b.powerHp,
}));

const dir = join(process.cwd(), "public");
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, "search-index.json"), JSON.stringify(index));
console.log(`search-index.json: ${index.length} bikes`);

await prisma.$disconnect();
