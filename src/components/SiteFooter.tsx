import Link from "next/link";
import Image from "next/image";
import { getManufacturers } from "@/lib/queries";
import { asset } from "@/lib/basePath";

export async function SiteFooter() {
  const manufacturers = await getManufacturers();
  return (
    <footer className="mt-24 border-t border-ink-400 bg-ink-200">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-1">
          <Link href="/" className="inline-flex items-center" aria-label="Motocodex home">
            <Image src={asset("/logo.png")} alt="Motocodex" width={994} height={240} className="h-9 w-auto" />
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-graphite-600">
            Bangladesh&apos;s modern motorcycle specifications and comparison directory. Engine, power,
            torque, mileage, weight and price (৳) — every model linked back to its source.
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-graphite-500">Explore</h4>
          <ul className="space-y-2 text-sm text-graphite-600">
            <li><Link href="/" className="hover:text-graphite-900">Home</Link></li>
            <li><Link href="/find-your-bike" className="hover:text-graphite-900">Find Your Bike</Link></li>
            <li><Link href="/compare" className="hover:text-graphite-900">Compare Bikes</Link></li>
            <li><Link href="/news" className="hover:text-graphite-900">News &amp; Guides</Link></li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-graphite-500">Manufacturers</h4>
          <ul className="grid grid-cols-2 gap-2 text-sm text-graphite-600 sm:grid-cols-3">
            {manufacturers.map((m) => (
              <li key={m.slug}>
                <Link href={`/manufacturers/${m.slug}`} className="hover:text-graphite-900">
                  {m.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-400">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-graphite-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Motocodex. Prices in BDT, for reference only — confirm with dealers.</p>
          <p>Every model links back to its source listing.</p>
        </div>
      </div>
    </footer>
  );
}
