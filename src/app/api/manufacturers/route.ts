import { NextResponse } from "next/server";
import { getManufacturers } from "@/lib/queries";

// Public-safe manufacturer index (name, slug, country, model count only).
export async function GET() {
  const manufacturers = await getManufacturers();
  return NextResponse.json(
    {
      manufacturers: manufacturers.map((m) => ({
        name: m.name,
        slug: m.slug,
        country: m.country,
        models: m._count.bikes,
      })),
    },
    { headers: { "Cache-Control": "public, max-age=300" } }
  );
}
