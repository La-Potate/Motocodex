import Link from "next/link";
import type { Metadata } from "next";
import { getNews } from "@/lib/queries";
import { bikeGradient } from "@/lib/format";
import { Reveal } from "@/components/Reveal";
import { JsonLd } from "@/components/JsonLd";
import { webPageSchema, breadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Motorcycle News, Reviews & Ownership Guides",
  description:
    "Common problems, fixes and ownership guides for motorcycles available in Bangladesh — researched, sourced, and written for BD riders.",
  alternates: { canonical: "/news" },
};

function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d} ${months[(m || 1) - 1]} ${y}`;
}

export default async function NewsIndex() {
  const news = await getNews();

  return (
    <div>
      <JsonLd
        data={[
          webPageSchema("Motorcycle News, Reviews & Ownership Guides", "Common problems, fixes and ownership guides for motorcycles in Bangladesh.", "/news", "CollectionPage"),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "News", path: "/news" },
          ]),
        ]}
      />
      <div className="border-b border-ink-400 bg-ink-200">
        <div className="container-page py-12">
          <Reveal>
            <h1 className="text-4xl font-black text-graphite-900">News &amp; Ownership Guides</h1>
            <p className="mt-2 max-w-2xl text-graphite-600">
              Real-world common problems, fixes and maintenance advice for motorcycles available in
              Bangladesh — researched from owner reviews and reputable sources, written for BD roads.
            </p>
          </Reveal>
        </div>
      </div>

      <section className="container-page py-10">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {news.map((a, i) => (
            <Reveal key={a.id} delay={(i % 3) * 0.05}>
              <Link href={`/news/${a.slug}`} className="card group block h-full overflow-hidden transition-shadow hover:shadow-float">
                <div className="relative h-28" style={{ background: bikeGradient(a.heroHue) }}>
                  <span className="absolute left-3 top-3 spec-pill">{a.category}</span>
                </div>
                <div className="p-4">
                  <h2 className="text-base font-bold leading-snug text-graphite-900 group-hover:text-graphite-900">{a.title}</h2>
                  <p className="mt-2 line-clamp-3 text-sm text-graphite-600">{a.excerpt}</p>
                  <p className="mt-3 text-xs text-graphite-400">{fmtDate(a.publishedAt)} · {a.readingMins} min read</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
