import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getBike, getAllBikes, getNewsForBike } from "@/lib/queries";
import { bdt, num, powerToWeight } from "@/lib/format";
import { Reveal } from "@/components/Reveal";
import { FaqAccordion } from "@/components/FaqAccordion";
import { JsonLd } from "@/components/JsonLd";
import { bikeProductSchema, bikeFaqs, faqSchema, breadcrumbSchema } from "@/lib/seo";
import { asset } from "@/lib/basePath";

type Params = { manufacturer: string; model: string };

// Pre-render every bike page at build time (SSG) for instant loads + SEO.
export async function generateStaticParams() {
  const bikes = await getAllBikes();
  return bikes.map((b) => ({ manufacturer: b.manufacturer.slug, model: b.slug }));
}

export async function generateMetadata(props: { params: Promise<Params> }): Promise<Metadata> {
  const params = await props.params;
  const bike = await getBike(params.manufacturer, params.model);
  if (!bike) return { title: "Model not found" };
  const title = `${bike.manufacturer.name} ${bike.name} Price in Bangladesh & Specs`;
  const bits = [
    bike.engineCc != null ? `${bike.engineCc}cc` : null,
    bike.powerHp != null ? `${bike.powerHp} hp` : null,
    bike.mileageKmpl != null ? `${bike.mileageKmpl} km/l` : null,
    bike.priceBdt != null ? bdt(bike.priceBdt) : null,
  ].filter(Boolean);
  return {
    title,
    description: `${bike.manufacturer.name} ${bike.name}: ${bits.join(", ")}. Full specifications and current Bangladesh price.`,
    alternates: { canonical: `/manufacturers/${bike.manufacturer.slug}/${bike.slug}` },
    openGraph: {
      title,
      description: `${bike.manufacturer.name} ${bike.name}: ${bits.join(", ")}.`,
      type: "website",
      ...(bike.imageUrl ? { images: [{ url: asset(bike.imageUrl) }] } : {}),
    },
  };
}

type Row = { label: string; value: React.ReactNode } | null;

function SpecTable({ title, rows }: { title: string; rows: Row[] }) {
  const visible = rows.filter((r): r is { label: string; value: React.ReactNode } => r !== null);
  if (!visible.length) return null;
  return (
    <section className="overflow-hidden rounded-lg bg-ink-50 ring-1 ring-ink-400/70">
      <h2 className="flex items-center gap-2 px-5 py-4 text-sm font-extrabold uppercase tracking-widest text-graphite-900">
        <span className="h-3 w-1 rounded-full bg-azure" />
        {title}
      </h2>
      {visible.map((r) => (
        <div
          key={r.label}
          className="flex items-center justify-between gap-4 border-t border-ink-300 px-5 py-3 text-sm odd:bg-ink-100/40"
        >
          <span className="text-graphite-500">{r.label}</span>
          <span className="text-right font-semibold text-graphite-900">{r.value}</span>
        </div>
      ))}
    </section>
  );
}

/** Only emit a row when the value is present. */
const row = (label: string, value: string | number | null | undefined, suffix = ""): Row =>
  value === null || value === undefined || value === "" ? null : { label, value: `${value}${suffix}` };

export default async function BikePage(props: { params: Promise<Params> }) {
  const params = await props.params;
  const bike = await getBike(params.manufacturer, params.model);
  if (!bike) notFound();

  const guide = await getNewsForBike(params.manufacturer, params.model);
  const ptw = powerToWeight(bike.powerHp, bike.weightKg);
  const powerText = bike.powerRaw ?? (bike.powerHp != null ? `${bike.powerHp} hp${bike.powerRpm ? ` @ ${num(bike.powerRpm)} rpm` : ""}` : null);
  const torqueText = bike.torqueRaw ?? (bike.torqueNm != null ? `${bike.torqueNm} Nm${bike.torqueRpm ? ` @ ${num(bike.torqueRpm)} rpm` : ""}` : null);

  const faqs = bikeFaqs(bike);
  const structuredData = [
    bikeProductSchema(bike),
    faqSchema(faqs),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: bike.manufacturer.name, path: `/manufacturers/${bike.manufacturer.slug}` },
      { name: bike.name, path: `/manufacturers/${bike.manufacturer.slug}/${bike.slug}` },
    ]),
  ];

  const dims =
    bike.lengthMm || bike.widthMm || bike.heightMm
      ? `${num(bike.lengthMm)} × ${num(bike.widthMm)} × ${num(bike.heightMm)} mm`
      : null;

  return (
    <article>
      <JsonLd data={structuredData} />

      {/* Hero band — borderless floating product image on a soft tinted stage */}
      <div className="relative overflow-hidden border-b border-ink-400 bg-ink-100">
        {/* soft radial wash behind the bike */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(80% 70% at 72% 35%, rgba(142,203,255,0.22) 0%, transparent 60%)",
          }}
        />
        <div className="container-page relative py-12 lg:py-16">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.15fr]">
            <Reveal>
              <nav className="mb-5 flex items-center gap-2 text-xs font-semibold text-graphite-500">
                <Link href="/" className="hover:text-graphite-900">Home</Link>
                <span className="text-graphite-400">/</span>
                <Link href={`/manufacturers/${bike.manufacturer.slug}`} className="hover:text-graphite-900">
                  {bike.manufacturer.name}
                </Link>
                <span className="text-graphite-400">/</span>
                <span className="text-graphite-900">{bike.name}</span>
              </nav>

              <span className="eyebrow">{bike.category} · {bike.series}</span>
              <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight text-graphite-900 sm:text-5xl">
                {bike.manufacturer.name}
                <br />
                <span className="text-graphite-800">{bike.name}</span>
              </h1>
              {bike.tagline && <p className="mt-3 max-w-md text-lg text-graphite-600">{bike.tagline}</p>}

              {/* Price block */}
              <div className="mt-7 flex items-end gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-graphite-400">
                    Price in Bangladesh
                  </p>
                  <p className="text-4xl font-extrabold tracking-tight text-graphite-900">
                    {bdt(bike.priceBdt)}
                  </p>
                </div>
                {bike.madeIn && (
                  <span className="mb-1.5 rounded-pill bg-ink-200 px-3 py-1 text-xs font-semibold text-graphite-600">
                    Made in {bike.madeIn}
                  </span>
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={`/compare/${bike.manufacturer.slug}-${bike.slug}`} className="btn-accent">
                  Add to comparison
                </Link>
                <a href="#specs" className="btn-ghost">View full specs</a>
              </div>
            </Reveal>

            {/* Floating, borderless product image */}
            <Reveal delay={0.1}>
              <div className="relative flex items-center justify-center">
                {bike.imageUrl ? (
                  <Image
                    src={asset(bike.imageUrl)}
                    alt={`${bike.manufacturer.name} ${bike.name}`}
                    width={640}
                    height={480}
                    sizes="(max-width:1024px) 100vw, 50vw"
                    className="h-auto w-full max-w-xl object-contain drop-shadow-[0_30px_40px_rgba(17,17,18,0.25)]"
                  />
                ) : (
                  <div className="flex aspect-[4/3] w-full max-w-xl items-center justify-center text-8xl">
                    🏍️
                  </div>
                )}
                {/* soft ground shadow ellipse */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute bottom-2 left-1/2 h-5 w-3/5 -translate-x-1/2 rounded-[100%] bg-graphite-900/15 blur-md"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      <div id="specs" className="container-page grid scroll-mt-20 gap-6 py-12 lg:grid-cols-[1fr_340px]">
        {/* Spec tables */}
        <div className="space-y-6">
          <Reveal>
            <SpecTable
              title="Engine & Performance"
              rows={[
                row("Displacement", bike.engineCc, " cc"),
                row("Engine type", bike.engineType),
                row("Cooling", bike.cooling),
                row("Fuel system", bike.fuelSystem),
                powerText ? { label: "Max power", value: powerText } : null,
                torqueText ? { label: "Max torque", value: torqueText } : null,
                row("Compression ratio", bike.compression),
                row("Bore × stroke", bike.boreStroke),
                row("Starting", bike.startMethod),
                row("Transmission", bike.transmission),
                row("Top speed", bike.topSpeedKph, " km/h"),
                row("Mileage (claimed)", bike.mileageKmpl, " km/l"),
              ]}
            />
          </Reveal>

          <Reveal delay={0.06}>
            <SpecTable
              title="Chassis & Dimensions"
              rows={[
                row("Kerb weight", bike.weightKg, " kg"),
                row("Seat height", bike.seatHeightMm, " mm"),
                row("Wheelbase", bike.wheelbaseMm, " mm"),
                dims ? { label: "Length × Width × Height", value: dims } : null,
                row("Ground clearance", bike.groundClearance, " mm"),
                row("Fuel capacity", bike.fuelCapacityL, " L"),
                row("Front suspension", bike.frontSuspension),
                row("Rear suspension", bike.rearSuspension),
                row("Front brake", bike.frontBrake),
                row("Rear brake", bike.rearBrake),
                { label: "ABS", value: bike.abs ? "Yes" : "No" },
                row("Front tyre", bike.frontTyre),
                row("Rear tyre", bike.rearTyre),
              ]}
            />
          </Reveal>

          {/* Ownership guide cross-link */}
          {guide && (
            <Reveal delay={0.08}>
              <Link href={`/news/${guide.slug}`} className="flex items-center justify-between gap-3 rounded-lg bg-ink-50 p-5 ring-1 ring-ink-400/70 transition-shadow hover:shadow-float">
                <div>
                  <p className="text-sm font-bold text-graphite-900">Common problems &amp; ownership guide</p>
                  <p className="text-xs text-graphite-500">Real-world issues, fixes and maintenance tips for the {bike.manufacturer.name} {bike.name}.</p>
                </div>
                <span className="btn-accent shrink-0 !py-2 text-xs">Read guide →</span>
              </Link>
            </Reveal>
          )}

          {/* Official brand site */}
          {bike.manufacturer.website && (
            <Reveal delay={0.1}>
              <div className="flex flex-col items-start justify-between gap-3 rounded-lg bg-ink-50 p-5 ring-1 ring-ink-400/70 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-bold text-graphite-900">Verified for the Bangladesh market</p>
                  <p className="text-xs text-graphite-500">
                    Specs and BDT pricing are checked for this model. Visit {bike.manufacturer.name}&apos;s official site for the latest details.
                  </p>
                </div>
                <a href={bike.manufacturer.website} target="_blank" rel="noopener noreferrer nofollow" className="btn-accent shrink-0">
                  Official {bike.manufacturer.name} site ↗
                </a>
              </div>
            </Reveal>
          )}
        </div>

        {/* Sticky key-figures rail */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Reveal delay={0.08}>
            <div className="rounded-lg bg-ink-50 p-5 ring-1 ring-ink-400/70">
              <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-graphite-900">
                <span className="h-3 w-1 rounded-full bg-azure" />
                Key figures
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <div className="rounded-sm bg-ink-200 p-3">
                  <p className="text-2xl font-extrabold text-graphite-900">{num(bike.powerHp)}</p>
                  <p className="text-[11px] text-graphite-500">horsepower</p>
                </div>
                <div className="rounded-sm bg-ink-200 p-3">
                  <p className="text-2xl font-extrabold text-graphite-900">{num(bike.torqueNm)}</p>
                  <p className="text-[11px] text-graphite-500">Nm torque</p>
                </div>
                <div className="rounded-sm bg-ink-200 p-3">
                  <p className="text-2xl font-extrabold text-graphite-900">{num(bike.weightKg)}</p>
                  <p className="text-[11px] text-graphite-500">kg kerb</p>
                </div>
                <div className="rounded-sm bg-azure p-3">
                  <p className="text-2xl font-extrabold text-graphite-900">{num(bike.mileageKmpl)}</p>
                  <p className="text-[11px] text-graphite-700">km/l claimed</p>
                </div>
              </div>
              {ptw != null && (
                <div className="mt-2.5 flex items-center justify-between rounded-sm border border-ink-300 px-3 py-2.5">
                  <span className="text-[11px] font-medium text-graphite-500">Power-to-weight</span>
                  <span className="text-sm font-bold text-graphite-900">{ptw} hp/tonne</span>
                </div>
              )}
              <Link href={`/manufacturers/${bike.manufacturer.slug}`} className="btn-ghost mt-5 w-full">
                More {bike.manufacturer.name} models
              </Link>
            </div>
          </Reveal>
        </aside>
      </div>

      {/* FAQ — generated from this model's data, mirrored in FAQPage schema */}
      {faqs.length > 0 && (
        <section className="container-page pb-16">
          <Reveal>
            <div className="mb-6">
              <span className="eyebrow">FAQ</span>
              <h2 className="section-title mt-3">
                {bike.manufacturer.name} {bike.name} — frequently asked
              </h2>
              <p className="mt-2 text-graphite-500">
                Quick answers about price, mileage, engine and features.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <FaqAccordion items={faqs.map((f) => ({ q: f.q, a: f.a }))} />
          </Reveal>
        </section>
      )}
    </article>
  );
}
