import { ImageResponse } from "next/og";
import { getNewsBySlug, getNews } from "@/lib/queries";

// Dynamic social card for each news article — branded, generated at request/build
// time. Next wires this as the og:image + twitter:image for /news/[slug].
export const runtime = "nodejs";
// Static export has no server, so every card is rendered to a PNG at build time.
export const dynamic = "force-static";

export async function generateStaticParams() {
  const news = await getNews();
  return news.map((n) => ({ slug: n.slug }));
}

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Motocodex article";

export default async function OgImage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const a = await getNewsBySlug(slug);
  const title = a?.title ?? "Motocodex";
  const category = a?.category ?? "Guide";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#fbfbf8",
          padding: "64px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: 20, height: 20, borderRadius: 4, background: "#8ecbff" }} />
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: 4, color: "#111112" }}>
            MOTOCODEX
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              alignSelf: "flex-start",
              background: "#8ecbff",
              color: "#111112",
              fontSize: 22,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 2,
              padding: "8px 18px",
              borderRadius: 9999,
            }}
          >
            {category}
          </div>
          <div style={{ fontSize: 64, fontWeight: 800, color: "#111112", lineHeight: 1.05, maxWidth: 1000 }}>
            {title}
          </div>
        </div>

        <div style={{ fontSize: 24, color: "#55564c" }}>
          Motorcycle news, reviews &amp; ownership guides — Bangladesh
        </div>
      </div>
    ),
    { ...size }
  );
}
