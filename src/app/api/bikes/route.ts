import { NextResponse, type NextRequest } from "next/server";
import { getAllBikes } from "@/lib/queries";

/**
 * Internal search endpoint. Intentionally returns ONLY the minimal fields the
 * client UI needs (name, slugs, a couple of headline numbers) — never the full
 * proprietary spec structure, which is rendered exclusively via Server
 * Components. Results are capped and require a query to discourage bulk export.
 */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();
  if (q.length < 2) {
    return NextResponse.json({ results: [] }, { status: 200 });
  }

  const all = await getAllBikes();
  const results = all
    .filter((b) =>
      `${b.manufacturer.name} ${b.name} ${b.category}`.toLowerCase().includes(q)
    )
    .slice(0, 12)
    .map((b) => ({
      name: b.name,
      manufacturer: b.manufacturer.name,
      href: `/manufacturers/${b.manufacturer.slug}/${b.slug}`,
      engineCc: b.engineCc,
      powerHp: b.powerHp,
    }));

  return NextResponse.json(
    { results },
    { headers: { "Cache-Control": "public, max-age=60" } }
  );
}
