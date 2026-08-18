import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getNews, getNewsBySlug, getBike } from "@/lib/queries";
import { bikeGradient, bdt } from "@/lib/format";
import { Reveal } from "@/components/Reveal";
import { ArticleBody } from "@/components/ArticleBody";
import { serializeJsonLd } from "@/components/JsonLd";
import { asset } from "@/lib/basePath";

type Params = { slug: string };
const SITE = process.env.SITE_URL ?? "https://motocodex.net";

type Section = { heading: string; body: string };
type Source = { title: string; url: string };
const parse = <T,>(s: string | null | undefined, fallback: T): T => {
  try { return s ? (JSON.parse(s) as T) : fallback; } catch { return fallback; }
};

function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${d} ${months[(m || 1) - 1]} ${y}`;
}

export async function generateStaticParams() {
  const news = await getNews();
  return news.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata(props: { params: Promise<Params> }): Promise<Metadata> {
  const params = await props.params;
  const a = await getNewsBySlug(params.slug);
  if (!a) return { title: "Article not found" };
  return {
    title: a.title,
    description: a.excerpt,
    alternates: { canonical: `/news/${a.slug}` },
    openGraph: { title: a.title, description: a.excerpt, type: "article", publishedTime: a.publishedAt },
    keywords: parse<string[]>(a.tags, []),
  };
}

export default async function NewsArticle(props: { params: Promise<Params> }) {
  const params = await props.params;
  const a = await getNewsBySlug(params.slug);
  if (!a) notFound();

  const sections = parse<Section[]>(a.sections, []);
  const sources = parse<Source[]>(a.sources, []);
  const tags = parse<string[]>(a.tags, []);
  const bike = a.manufacturerSlug && a.bikeSlug ? await getBike(a.manufacturerSlug, a.bikeSlug) : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: a.title,
    description: a.excerpt,
    datePublished: a.publishedAt,
    dateModified: a.publishedAt,
    author: { "@type": "Organization", name: "Motocodex" },
    publisher: { "@type": "Organization", name: "Motocodex" },
    keywords: tags.join(", "),
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE}/news/${a.slug}` },
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

      {/* Hero band */}
      <div className="relative overflow-hidden border-b border-ink-400" style={{ background: bikeGradient(a.heroHue) }}>
        <div className="container-page relative py-12">
          <Reveal>
            <nav className="mb-3 flex items-center gap-2 text-xs font-semibold text-graphite-600">
              <Link href="/" className="hover:text-graphite-900">Home</Link>
              <span>/</span>
              <Link href="/news" className="hover:text-graphite-900">News</Link>
            </nav>
            <span className="spec-pill mb-3">{a.category}</span>
            <h1 className="max-w-3xl text-3xl font-black leading-tight text-graphite-900 sm:text-4xl">{a.title}</h1>
            <p className="mt-3 text-sm font-medium text-graphite-600">{fmtDate(a.publishedAt)} · {a.readingMins} min read</p>
          </Reveal>
        </div>
      </div>

      <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_300px]">
        {/* Body */}
        <div className="max-w-3xl">
          <Reveal>
            <p className="mb-6 border-l-4 border-azure pl-4 text-lg italic text-graphite-800">{a.excerpt}</p>
            {sections.map((s, i) => (
              <section key={i} className="mb-7">
                <h2 className="mb-3 text-xl font-black text-graphite-900">{s.heading}</h2>
                <ArticleBody body={s.body} />
              </section>
            ))}

            {/* Sources */}
            {sources.length > 0 && (
              <section className="mt-8 rounded-md border border-ink-400 bg-ink-200 p-5">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-graphite-500">Sources</h2>
                <ul className="space-y-2">
                  {sources.map((src, i) => (
                    <li key={i}>
                      <a href={src.url} target="_blank" rel="noopener noreferrer nofollow" className="text-sm text-graphite-900 hover:underline">
                        {src.title} ↗
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <p className="mt-8 text-xs text-graphite-400">
              Specifications and pricing are for reference only and change frequently — always confirm with an authorised dealer.
            </p>
          </Reveal>
        </div>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          {bike && (
            <Reveal>
              <div className="card overflow-hidden">
                <div className="relative h-24" style={{ background: bikeGradient(bike.imageHue) }}>
                  {bike.imageUrl && (
                    <Image
                      src={asset(bike.imageUrl)}
                      alt={`${bike.manufacturer.name} ${bike.name}`}
                      fill
                      sizes="300px"
                      className="object-contain p-2"
                    />
                  )}
                </div>
                <div className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-graphite-900">{bike.manufacturer.name}</p>
                  <p className="text-sm font-bold text-graphite-900">{bike.name}</p>
                  {(bike.priceBdt != null || bike.engineCc != null) && (
                    <p className="mt-1 text-xs text-graphite-500">
                      {[bike.priceBdt != null && bdt(bike.priceBdt), bike.engineCc != null && `${bike.engineCc}cc`]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                  <Link href={`/manufacturers/${bike.manufacturer.slug}/${bike.slug}`} className="btn-accent mt-3 w-full !py-2 text-xs">
                    View full specs &amp; price
                  </Link>
                </div>
              </div>
            </Reveal>
          )}
          {tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((t) => (
                <span key={t} className="rounded-pill border border-ink-400 bg-ink-50 px-3 py-1 text-xs font-medium text-graphite-600">{t}</span>
              ))}
            </div>
          )}
          <Link href="/news" className="btn-ghost mt-4 w-full">← All guides</Link>
        </aside>
      </div>
    </article>
  );
}
