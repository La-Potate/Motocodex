import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { resolveBikeToken, type BikeWithManufacturer } from "@/lib/queries";
import { bdt, num, powerToWeight, bikeGradient } from "@/lib/format";
import { Reveal } from "@/components/Reveal";
import { JsonLd } from "@/components/JsonLd";
import { webPageSchema, breadcrumbSchema } from "@/lib/seo";

type Params = { comparison: string };

function parseTokens(comparison: string): string[] {
  return decodeURIComponent(comparison)
    .split("-vs-")
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function generateMetadata(props: { params: Promise<Params> }): Promise<Metadata> {
  const params = await props.params;
  const tokens = parseTokens(params.comparison);
  const bikes = (await Promise.all(tokens.map(resolveBikeToken))).filter(Boolean) as BikeWithManufacturer[];
  if (!bikes.length) return { title: "Comparison" };
  const names = bikes.map((b) => `${b.manufacturer.name} ${b.name}`).join(" vs ");
  return {
    title: `${names} — Comparison`,
    description: `Side-by-side specification comparison: ${names}. Engine, power, torque, mileage, weight and price (৳).`,
    alternates: { canonical: `/compare/${params.comparison}` },
  };
}

// Spec rows: higher/lower "better" drives the highlight.
type Better = "high" | "low" | "none";
const ROWS: Array<{
  label: string;
  get: (b: BikeWithManufacturer) => number | null;
  fmt: (b: BikeWithManufacturer) => string;
  better: Better;
}> = [
  { label: "Price (BDT)", get: (b) => b.priceBdt, fmt: (b) => bdt(b.priceBdt), better: "low" },
  { label: "Engine (cc)", get: (b) => b.engineCc, fmt: (b) => `${num(b.engineCc)} cc`, better: "high" },
  { label: "Power (hp)", get: (b) => b.powerHp, fmt: (b) => (b.powerHp != null ? `${b.powerHp} hp` : "—"), better: "high" },
  { label: "Torque (Nm)", get: (b) => b.torqueNm, fmt: (b) => (b.torqueNm != null ? `${b.torqueNm} Nm` : "—"), better: "high" },
  { label: "Mileage (km/l)", get: (b) => b.mileageKmpl, fmt: (b) => (b.mileageKmpl != null ? `${b.mileageKmpl} km/l` : "—"), better: "high" },
  { label: "Weight (kg)", get: (b) => b.weightKg, fmt: (b) => (b.weightKg != null ? `${b.weightKg} kg` : "—"), better: "low" },
  { label: "Power-to-weight (hp/t)", get: (b) => powerToWeight(b.powerHp, b.weightKg), fmt: (b) => num(powerToWeight(b.powerHp, b.weightKg)), better: "high" },
  { label: "Top speed (km/h)", get: (b) => b.topSpeedKph, fmt: (b) => (b.topSpeedKph ? `${b.topSpeedKph} km/h` : "—"), better: "high" },
  { label: "Seat height (mm)", get: (b) => b.seatHeightMm, fmt: (b) => num(b.seatHeightMm, " mm"), better: "none" },
  { label: "Wheelbase (mm)", get: (b) => b.wheelbaseMm, fmt: (b) => num(b.wheelbaseMm, " mm"), better: "none" },
  { label: "Fuel capacity (L)", get: (b) => b.fuelCapacityL, fmt: (b) => (b.fuelCapacityL ? `${b.fuelCapacityL} L` : "—"), better: "high" },
  { label: "Transmission", get: () => null, fmt: (b) => b.transmission ?? "—", better: "none" },
  { label: "Cooling", get: () => null, fmt: (b) => b.cooling ?? "—", better: "none" },
  { label: "Brakes", get: () => null, fmt: (b) => (b.abs ? "ABS" : b.frontBrake ?? "—"), better: "none" },
  { label: "Category", get: () => null, fmt: (b) => b.category, better: "none" },
];

function bestIndex(values: (number | null)[], better: Better): number | null {
  if (better === "none") return null;
  let bestI: number | null = null;
  let bestV: number | null = null;
  values.forEach((v, i) => {
    if (v === null) return;
    if (bestV === null || (better === "high" ? v > bestV : v < bestV)) {
      bestV = v;
      bestI = i;
    }
  });
  return bestI;
}

export default async function ComparePage(props: { params: Promise<Params> }) {
  const params = await props.params;
  const tokens = parseTokens(params.comparison);
  const resolved = (await Promise.all(tokens.map(resolveBikeToken))).filter(Boolean) as BikeWithManufacturer[];
  if (resolved.length < 1) notFound();

  const names = resolved.map((b) => `${b.manufacturer.name} ${b.name}`).join(" vs ");

  return (
    <div className="container-page py-12">
      <JsonLd
        data={[
          webPageSchema(`${names} — Comparison`, `Side-by-side specification comparison: ${names}.`, `/compare/${params.comparison}`),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Compare", path: "/compare" },
            { name: names, path: `/compare/${params.comparison}` },
          ]),
        ]}
      />
      <Reveal>
        <nav className="mb-4 text-xs font-semibold text-graphite-500">
          <Link href="/compare" className="hover:text-graphite-900">Compare</Link>
          <span className="px-2">/</span>
          <span className="text-graphite-900">{resolved.map((b) => b.name).join(" vs ")}</span>
        </nav>
        <h1 className="text-3xl font-black text-graphite-900 sm:text-4xl">Head-to-head</h1>
        <p className="mt-2 text-graphite-600">
          Best value in each row is highlighted. {resolved.length} bike{resolved.length > 1 ? "s" : ""} compared.
        </p>
      </Reveal>

      <Reveal delay={0.06}>
        <p className="mt-6 text-center text-xs font-semibold text-graphite-500 sm:hidden">
          ← swipe to compare →
        </p>
        <div className="mt-2 overflow-x-auto sm:mt-8">
          <table aria-label={`Specification comparison: ${names}`} className="w-full min-w-[640px] border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-ink-100 p-3 text-left align-bottom" />
                {resolved.map((b) => (
                  <th key={b.id} className="p-3 align-bottom">
                    <div className="card overflow-hidden">
                      <div className="relative h-20" style={{ background: bikeGradient(b.imageHue) }}>
                        {b.imageUrl && (
                          <Image
                            src={b.imageUrl}
                            alt={`${b.manufacturer.name} ${b.name}`}
                            fill
                            sizes="(max-width:768px) 33vw, 200px"
                            className="object-contain p-1.5"
                          />
                        )}
                      </div>
                      <div className="p-3 text-left">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-graphite-900">
                          {b.manufacturer.name}
                        </p>
                        <Link
                          href={`/manufacturers/${b.manufacturer.slug}/${b.slug}`}
                          className="text-sm font-bold text-graphite-900 hover:underline"
                        >
                          {b.name}
                        </Link>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => {
                const values = resolved.map((b) => row.get(b));
                const best = bestIndex(values, row.better);
                return (
                  <tr key={row.label}>
                    <td className="sticky left-0 z-10 whitespace-nowrap border-b border-ink-400 bg-ink-100 p-3 text-sm font-semibold text-graphite-500">
                      {row.label}
                    </td>
                    {resolved.map((b, i) => (
                      <td
                        key={b.id}
                        className={`border-b border-ink-400 p-3 text-sm ${
                          best === i
                            ? "bg-azure font-bold text-graphite-900 ring-1 ring-inset ring-azure-deep"
                            : "text-graphite-800"
                        }`}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {row.fmt(b)}
                          {best === i && (
                            <span className="inline-flex items-center gap-0.5 rounded-pill bg-azure-deep px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ink-50">
                              ★ Best
                            </span>
                          )}
                        </span>
                      </td>
                    ))}
                  </tr>
                );
              })}
              {/* Official brand site row */}
              <tr>
                <td className="sticky left-0 z-10 bg-ink-100 p-3 text-sm font-semibold text-graphite-500">
                  Official site
                </td>
                {resolved.map((b) => (
                  <td key={b.id} className="p-3">
                    {b.manufacturer.website ? (
                      <a
                        href={b.manufacturer.website}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="text-xs font-semibold text-graphite-900 hover:underline"
                      >
                        Visit ↗
                      </a>
                    ) : (
                      <span className="text-xs text-graphite-400">—</span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Reveal>

      <div className="mt-8">
        <Link href="/compare" className="btn-ghost">Build a different comparison</Link>
      </div>
    </div>
  );
}
