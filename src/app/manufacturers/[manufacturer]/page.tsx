import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getManufacturerBySlug, getManufacturers } from "@/lib/queries";
import { BikeCard } from "@/components/BikeCard";
import { Reveal } from "@/components/Reveal";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema, SITE_URL } from "@/lib/seo";

type Params = { manufacturer: string };

export async function generateStaticParams() {
  const manufacturers = await getManufacturers();
  return manufacturers.map((m) => ({ manufacturer: m.slug }));
}

export async function generateMetadata(props: { params: Promise<Params> }): Promise<Metadata> {
  const params = await props.params;
  const m = await getManufacturerBySlug(params.manufacturer);
  if (!m) return { title: "Manufacturer not found" };
  return {
    title: `${m.name} Motorcycles — Specs & Models`,
    description: m.description,
    alternates: { canonical: `/manufacturers/${m.slug}` },
  };
}

export default async function ManufacturerPage(props: { params: Promise<Params> }) {
  const params = await props.params;
  const m = await getManufacturerBySlug(params.manufacturer);
  if (!m) notFound();

  const brandSchema = {
    "@context": "https://schema.org",
    "@type": "Brand",
    name: m.name,
    url: `${SITE_URL}/manufacturers/${m.slug}`,
    description: m.description,
    ...(m.website ? { sameAs: [m.website] } : {}),
  };

  return (
    <div>
      <JsonLd
        data={[
          brandSchema,
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Manufacturers", path: "/manufacturers" },
            { name: m.name, path: `/manufacturers/${m.slug}` },
          ]),
        ]}
      />
      <div className="border-b border-ink-400 bg-ink-200">
        <div className="container-page py-14">
          <Reveal>
            <div className="flex items-center gap-4">
              <span
                className="flex h-16 w-20 items-center justify-center rounded-md text-xl font-black text-white shadow-float"
                style={{ backgroundColor: m.accentColor }}
              >
                {m.logoText ?? m.name.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <h1 className="text-4xl font-black text-graphite-900">{m.name}</h1>
                <p className="text-sm text-graphite-500">
                  {m.country}{m.foundedYear ? ` · est. ${m.foundedYear}` : ""} · {m.bikes.length} models
                </p>
              </div>
            </div>
            <p className="mt-5 max-w-2xl text-graphite-800">{m.description}</p>
            {m.website && (
              <a
                href={m.website}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="btn-ghost mt-5"
              >
                Official website ↗
              </a>
            )}
          </Reveal>
        </div>
      </div>

      <section className="container-page py-12">
        <h2 className="mb-6 text-2xl font-black text-graphite-900">All {m.name} models</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {m.bikes.map((b, i) => (
            <BikeCard
              key={b.id}
              index={i}
              bike={{
                name: b.name,
                modelSlug: b.slug,
                manufacturerSlug: m.slug,
                manufacturerName: m.name,
                category: b.category,
                engineCc: b.engineCc,
                powerHp: b.powerHp,
                priceBdt: b.priceBdt,
                mileageKmpl: b.mileageKmpl,
                imageHue: b.imageHue,
                tagline: b.tagline,
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
