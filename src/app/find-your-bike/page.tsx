import { Suspense } from "react";
import type { Metadata } from "next";
import { getAllBikes, getFilterBounds } from "@/lib/queries";
import { FilterPanel, type FilterBike } from "@/components/FilterPanel";
import { Reveal } from "@/components/Reveal";
import { JsonLd } from "@/components/JsonLd";
import { webPageSchema, breadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Find Your Bike — Advanced Filter",
  description:
    "Filter motorcycles available in Bangladesh by engine displacement, price (BDT), brand and style. A GSMArena-style advanced finder across the Motocodex directory.",
  alternates: { canonical: "/find-your-bike" },
};

// Server Component: the entire dataset is queried server-side and handed to the
// client filter as a plain array. No API surface is exposed to scrapers.
//
// ?q= / ?category= are read inside FilterPanel rather than here: reading
// searchParams on the server would force this page to render per-request, which
// a static export cannot do.
export default async function FindYourBikePage() {
  const [bikes, bounds] = await Promise.all([getAllBikes(), getFilterBounds()]);

  const data: FilterBike[] = bikes.map((b) => ({
    name: b.name,
    modelSlug: b.slug,
    manufacturerSlug: b.manufacturer.slug,
    manufacturerName: b.manufacturer.name,
    category: b.category,
    series: b.series,
    engineCc: b.engineCc,
    powerHp: b.powerHp,
    torqueNm: b.torqueNm,
    weightKg: b.weightKg,
    priceBdt: b.priceBdt,
    mileageKmpl: b.mileageKmpl,
    imageUrl: b.imageUrl,
    imageHue: b.imageHue,
    tagline: b.tagline,
  }));

  const brands = Array.from(
    new Map(bikes.map((b) => [b.manufacturer.slug, { slug: b.manufacturer.slug, name: b.manufacturer.name }])).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const categories = Array.from(new Set(bikes.map((b) => b.category))).sort();

  return (
    <div>
      <a
        href="#results"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-pill focus:bg-graphite-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink-50"
      >
        Skip to results
      </a>
      <JsonLd
        data={[
          webPageSchema("Find Your Bike — Advanced Filter", "Filter motorcycles in Bangladesh by engine, price (৳), brand and style.", "/find-your-bike", "SearchResultsPage"),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Find Your Bike", path: "/find-your-bike" },
          ]),
        ]}
      />
      <div className="border-b border-ink-400 bg-ink-200">
        <div className="container-page py-12">
          <Reveal>
            <h1 className="text-4xl font-black text-graphite-900">Find your bike</h1>
            <p className="mt-2 max-w-xl text-graphite-600">
              Dial in engine size, budget (৳), brand and riding style across motorcycles available in
              Bangladesh. Results update live as you slide.
            </p>
          </Reveal>
        </div>
      </div>

      {/* useSearchParams() needs a Suspense boundary when prerendered. */}
      <Suspense fallback={null}>
        <FilterPanel bikes={data} bounds={bounds} brands={brands} categories={categories} />
      </Suspense>
    </div>
  );
}
