import Link from "next/link";
import type { Metadata } from "next";
import { getManufacturers } from "@/lib/queries";
import { Reveal } from "@/components/Reveal";
import { JsonLd } from "@/components/JsonLd";
import { webPageSchema, breadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "All Motorcycle Brands in Bangladesh",
  description: "Browse every motorcycle brand available in Bangladesh in the Motocodex directory, with full model ranges and prices.",
  alternates: { canonical: "/manufacturers" },
};

export default async function ManufacturersIndex() {
  const manufacturers = await getManufacturers();
  return (
    <section className="container-page py-14">
      <JsonLd
        data={[
          webPageSchema("All Motorcycle Brands in Bangladesh", "Browse every motorcycle brand available in Bangladesh.", "/manufacturers", "CollectionPage"),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Manufacturers", path: "/manufacturers" },
          ]),
        ]}
      />
      <Reveal>
        <h1 className="text-4xl font-black text-graphite-900">Manufacturers</h1>
        <p className="mt-2 text-graphite-500">Every brand in the codex, with its full model range.</p>
      </Reveal>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {manufacturers.map((m) => (
          <Link
            key={m.slug}
            href={`/manufacturers/${m.slug}`}
            className="card group flex items-center gap-3 p-4 transition-colors hover:border-ink-400"
          >
            <span
              className="flex h-11 w-14 items-center justify-center rounded-sm text-xs font-black text-white"
              style={{ backgroundColor: m.accentColor }}
            >
              {m.logoText ?? m.name.slice(0, 2).toUpperCase()}
            </span>
            <span className="flex flex-col">
              <span className="font-bold text-graphite-900 group-hover:text-graphite-900">{m.name}</span>
              <span className="text-xs text-graphite-500">{m.country} · {m._count.bikes} models</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
