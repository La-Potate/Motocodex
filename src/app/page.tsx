import Link from "next/link";
import type { Metadata } from "next";
import { Hero, type HeroBike } from "@/components/Hero";
import { BikeCard } from "@/components/BikeCard";
import { Reveal } from "@/components/Reveal";
import { FaqAccordion } from "@/components/FaqAccordion";
import {
  getFeaturedBikes,
  getCategorySummary,
  getManufacturers,
  getStats,
  getNews,
  type BikeWithManufacturer,
} from "@/lib/queries";
import { categoryIcon } from "@/lib/format";
import { JsonLd } from "@/components/JsonLd";
import { faqSchema, webPageSchema } from "@/lib/seo";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const GUIDES = [
  {
    icon: "📏",
    title: "Match the engine to your experience",
    body: "New riders are best served by 150–250cc for city commuting and 250–400cc for a do-it-all first bike. A smaller engine is lighter, stops faster and is far more forgiving of the mistakes every beginner makes — power you can't use is just weight and risk.",
    href: "/find-your-bike",
    cta: "Filter by engine size",
  },
  {
    icon: "🪖",
    title: "Gear up — ATGATT, every ride",
    body: "“All The Gear, All The Time.” A certified helmet, eye protection, armoured jacket and gloves, and over-the-ankle boots aren't optional. Take a recognised rider-training course before you commit to the road — skills and habits matter more than horsepower.",
    href: "/news",
    cta: "Read the safety guide",
  },
  {
    icon: "🧾",
    title: "Budget the whole bike, not just the sticker",
    body: "Registration, insurance, servicing, chain and tyres add up. Fuel economy (km/l) is the figure that quietly decides your monthly cost in Bangladesh — a commuter doing 45+ km/l can cost far less to run than a thirsty sportbike.",
    href: "/compare",
    cta: "Compare running costs",
  },
  {
    icon: "🔧",
    title: "Know the maintenance rhythm",
    body: "Check tyre pressures weekly, lube and adjust the chain regularly, and keep oil changes on schedule. Confirm whether a model runs fuel injection or a carburettor and whether it has single- or dual-channel ABS — those details shape both safety and upkeep.",
    href: "/manufacturers",
    cta: "Browse by brand",
  },
];

const FAQ = [
  {
    q: "How current are the prices on Motocodex?",
    a: "Prices are shown in Bangladeshi Taka (৳) and normalised from public market listings. Motorcycle prices in Bangladesh move frequently with duty and supply changes, so treat every figure as a reference point and confirm the final on-road price with an authorised dealer.",
  },
  {
    q: "What engine size should a first-time rider buy?",
    a: "For most beginners, 150–250cc is ideal for city riding and learning control, while 250–400cc suits riders who want one bike for commuting and longer trips. Lighter, lower-capacity bikes are easier to manage in traffic and more forgiving while you build skill.",
  },
  {
    q: "How does the comparison tool work?",
    a: "Pick two to four bikes and Motocodex builds a side-by-side table of engine, power, torque, mileage, weight, dimensions and price. The best value in each row is highlighted automatically, so trade-offs are obvious at a glance.",
  },
  {
    q: "What does ABS mean and do I need it?",
    a: "ABS (anti-lock braking system) prevents the wheels from locking under hard braking, which helps you stop in a straight line on loose or wet roads. Single-channel ABS protects the front wheel; dual-channel covers both. For new riders especially, ABS is a meaningful safety upgrade.",
  },
  {
    q: "Mileage vs power — which matters more?",
    a: "It depends on how you ride. Daily commuters should weight fuel economy (km/l) and seat comfort heavily; enthusiasts riding for the experience will care more about power-to-weight and handling. Motocodex shows both so you can decide on your terms.",
  },
  {
    q: "Where does the data come from?",
    a: "Specifications are researched from public Bangladesh-market listings and normalised into a single schema. Every model page links back to its source listing and the brand's official site so you can verify the numbers yourself.",
  },
];

export default async function HomePage() {
  const [featured, categories, manufacturers, stats, news] = await Promise.all([
    getFeaturedBikes(6),
    getCategorySummary(),
    getManufacturers(),
    getStats(),
    getNews(),
  ]);

  // Hero showcase: prefer a model that has a real image.
  const heroSource =
    featured.find((b) => b.slug === "r15-v4" && b.imageUrl) ??
    featured.find((b) => b.imageUrl) ??
    featured[0];

  const heroBike: HeroBike | null = heroSource
    ? {
        name: heroSource.name,
        manufacturerName: heroSource.manufacturer.name,
        href: `/manufacturers/${heroSource.manufacturer.slug}/${heroSource.slug}`,
        imageUrl: heroSource.imageUrl,
        engineCc: heroSource.engineCc,
        priceBdt: heroSource.priceBdt,
        mileageKmpl: heroSource.mileageKmpl,
        powerHp: heroSource.powerHp,
      }
    : null;

  // Popular comparisons generated from real models (guaranteed-valid tokens).
  const token = (b: BikeWithManufacturer) => `${b.manufacturer.slug}-${b.slug}`;
  const comparePairs: Array<[BikeWithManufacturer, BikeWithManufacturer]> = [];
  for (let i = 0; i + 1 < featured.length && comparePairs.length < 3; i += 2) {
    comparePairs.push([featured[i], featured[i + 1]]);
  }

  return (
    <>
      <JsonLd
        data={[
          webPageSchema(
            "Motocodex — Motorcycle Price in Bangladesh, Specs & Comparison",
            "Find, compare and decide on motorcycles available in Bangladesh by engine, power, mileage, weight and price (৳).",
            "/"
          ),
          faqSchema(FAQ),
        ]}
      />
      <Hero stats={stats} heroBike={heroBike} />

      {/* Value-prop / sourcing strip */}
      <section className="container-page">
        <div className="grid gap-3 rounded-md border border-ink-400 bg-ink-50 p-4 sm:grid-cols-3">
          {[
            { icon: "⚖", title: "Apples-to-apples specs", body: "Power, torque and weight normalised across every brand." },
            { icon: "৳", title: "Real BDT pricing", body: "Market prices with cited sources on every model page." },
            { icon: "🔗", title: "Traceable data", body: "Each bike links back to its source listing and brand site." },
          ].map((v) => (
            <div key={v.title} className="flex items-start gap-3 rounded-md px-3 py-2">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-azure text-lg text-graphite-900">
                {v.icon}
              </span>
              <div>
                <p className="text-sm font-bold text-graphite-900">{v.title}</p>
                <p className="text-xs text-graphite-500">{v.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Browse by category */}
      <section className="container-page py-14">
        <Reveal>
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <span className="eyebrow">Explore</span>
              <h2 className="section-title mt-3">Browse by category</h2>
              <p className="mt-2 text-graphite-500">Jump straight to the riding style you’re after.</p>
            </div>
            <Link href="/find-your-bike" className="hidden text-sm font-semibold text-graphite-900 hover:underline sm:inline">
              Advanced filter →
            </Link>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c, i) => (
            <Reveal key={c.category} delay={i * 0.04}>
              <Link
                href={`/find-your-bike?category=${encodeURIComponent(c.category)}`}
                className="card group flex h-full flex-col items-center gap-2 p-5 text-center transition-all hover:-translate-y-1 hover:border-ink-400 hover:shadow-float"
              >
                <span className="text-3xl transition-transform group-hover:scale-125">
                  {categoryIcon[c.category] ?? "🏍️"}
                </span>
                <span className="text-sm font-bold text-graphite-900">{c.category}</span>
                <span className="text-xs text-graphite-500">{c.count} models</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Popular / featured models */}
      <section className="container-page py-14">
        <Reveal>
          <div className="mb-7">
            <span className="eyebrow">Trending</span>
            <h2 className="section-title mt-3">Popular models right now</h2>
            <p className="mt-2 text-graphite-500">The most-compared bikes on Motocodex this week.</p>
          </div>
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((b, i) => (
            <BikeCard
              key={b.id}
              index={i}
              bike={{
                name: b.name,
                modelSlug: b.slug,
                manufacturerSlug: b.manufacturer.slug,
                manufacturerName: b.manufacturer.name,
                category: b.category,
                engineCc: b.engineCc,
                powerHp: b.powerHp,
                priceBdt: b.priceBdt,
                mileageKmpl: b.mileageKmpl,
                imageUrl: b.imageUrl,
                imageHue: b.imageHue,
                tagline: b.tagline,
              }}
            />
          ))}
        </div>
      </section>

      {/* Buying guide — editorial, grounded in established rider guidance */}
      <section className="bg-ink-200">
        <div className="container-page py-16">
          <Reveal>
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <span className="eyebrow">Buyer’s guide</span>
              <h2 className="section-title mt-3">How to choose your next motorcycle</h2>
              <p className="mt-3 text-graphite-600">
                Four things seasoned riders wish every first-time buyer knew — distilled from
                rider-training bodies and motorcycle journalism, then mapped to the Bangladesh market.
              </p>
            </div>
          </Reveal>
          <div className="grid gap-5 md:grid-cols-2">
            {GUIDES.map((g, i) => (
              <Reveal key={g.title} delay={i * 0.06}>
                <div className="card flex h-full flex-col p-6 transition-all hover:-translate-y-1 hover:shadow-float">
                  <span className="flex h-12 w-12 items-center justify-center rounded-md bg-azure text-2xl">
                    {g.icon}
                  </span>
                  <h3 className="mt-4 text-lg font-black text-graphite-900">{g.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-graphite-600">{g.body}</p>
                  <Link href={g.href} className="mt-4 text-sm font-semibold text-graphite-900 hover:underline">
                    {g.cta} →
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-graphite-400">
              Safety and engine-size guidance reflects established rider-training and motorcycle-press
              recommendations. Always complete a recognised rider course and confirm specs with a dealer.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Popular comparisons */}
      {comparePairs.length > 0 && (
        <section className="container-page py-14">
          <Reveal>
            <div className="mb-7">
              <span className="eyebrow">Head-to-head</span>
              <h2 className="section-title mt-3">Popular comparisons</h2>
              <p className="mt-2 text-graphite-500">See the trade-offs side by side in one tap.</p>
            </div>
          </Reveal>
          <div className="grid gap-4 md:grid-cols-3">
            {comparePairs.map(([a, b], i) => (
              <Reveal key={i} delay={i * 0.06}>
                <Link
                  href={`/compare/${token(a)}-vs-${token(b)}`}
                  className="card group flex items-center justify-between gap-3 p-5 transition-all hover:-translate-y-1 hover:border-ink-400 hover:shadow-float"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-graphite-900">{a.name}</p>
                    <p className="my-0.5 text-[11px] font-bold uppercase tracking-widest text-graphite-500">vs</p>
                    <p className="truncate text-sm font-bold text-graphite-900">{b.name}</p>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-azure text-graphite-900 transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Latest guides & news */}
      {news.length > 0 && (
        <section className="container-page py-14">
          <Reveal>
            <div className="mb-7 flex items-end justify-between gap-4">
              <div>
                <span className="eyebrow">Read</span>
                <h2 className="section-title mt-3">Guides &amp; ownership tips</h2>
                <p className="mt-2 text-graphite-500">Common problems, fixes and buying advice.</p>
              </div>
              <Link href="/news" className="hidden text-sm font-semibold text-graphite-900 hover:underline sm:inline">
                All articles →
              </Link>
            </div>
          </Reveal>
          <div className="grid gap-5 md:grid-cols-3">
            {news.slice(0, 3).map((n, i) => (
              <Reveal key={n.id} delay={i * 0.06}>
                <Link
                  href={`/news/${n.slug}`}
                  className="card group flex h-full flex-col overflow-hidden transition-all hover:-translate-y-1 hover:shadow-float"
                >
                  <div
                    className="h-32"
                    style={{ background: "#f4f4ed" }}
                  />
                  <div className="flex flex-1 flex-col p-5">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-graphite-900">{n.category}</span>
                    <h3 className="mt-1 text-base font-black text-graphite-900 group-hover:text-graphite-900">{n.title}</h3>
                    <p className="mt-2 line-clamp-3 flex-1 text-sm text-graphite-600">{n.excerpt}</p>
                    <span className="mt-3 text-xs text-graphite-400">{n.readingMins} min read</span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="container-page py-14">
        <Reveal>
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <span className="eyebrow">Good to know</span>
            <h2 className="section-title mt-3">Frequently asked</h2>
          </div>
        </Reveal>
        <Reveal delay={0.05}>
          <FaqAccordion items={FAQ} />
        </Reveal>
      </section>

      {/* CTA band */}
      <section className="container-page pb-20">
        <div className="relative overflow-hidden rounded-md bg-graphite-900 px-8 py-14 text-center shadow-float">
          <div className="relative">
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Stop guessing. Start comparing.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-ink-200">
              Filter {stats.bikeCount}+ models by engine, budget and style — or put any two bikes
              head-to-head in seconds.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link href="/find-your-bike" className="btn-accent">Find your bike</Link>
              <Link
                href="/compare"
                className="inline-flex items-center justify-center gap-2 rounded-pill border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/20"
              >
                Compare bikes
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Brands */}
      <section className="container-page pb-20">
        <Reveal>
          <h2 className="section-title mb-7">The brands</h2>
        </Reveal>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {manufacturers.map((m, i) => (
            <Reveal key={m.slug} delay={(i % 4) * 0.04}>
              <Link
                href={`/manufacturers/${m.slug}`}
                className="card group flex items-center gap-3 p-4 transition-all hover:-translate-y-1 hover:border-ink-400 hover:shadow-float"
              >
                <span
                  className="flex h-11 w-14 items-center justify-center rounded-sm text-xs font-black text-white"
                  style={{ backgroundColor: m.accentColor }}
                >
                  {m.logoText ?? m.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="flex flex-col">
                  <span className="font-bold text-graphite-900 group-hover:text-graphite-900">{m.name}</span>
                  <span className="text-xs text-graphite-500">
                    {m.country} · {m._count.bikes} models
                  </span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
