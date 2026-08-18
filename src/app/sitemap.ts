import type { MetadataRoute } from "next";
import { getAllBikes, getManufacturers, getNews } from "@/lib/queries";
import { SITE_URL } from "@/lib/seo";

// Static export has no server, so the sitemap is emitted at build time.
export const dynamic = "force-static";

const BASE = SITE_URL;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [bikes, manufacturers, news] = await Promise.all([getAllBikes(), getManufacturers(), getNews()]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, priority: 1 },
    { url: `${BASE}/find-your-bike`, priority: 0.8 },
    { url: `${BASE}/compare`, priority: 0.7 },
    { url: `${BASE}/manufacturers`, priority: 0.7 },
    { url: `${BASE}/news`, priority: 0.7 },
    { url: `${BASE}/route-plan`, priority: 0.6 },
  ];

  const manufacturerRoutes = manufacturers.map((m) => ({
    url: `${BASE}/manufacturers/${m.slug}`,
    priority: 0.6,
  }));

  const bikeRoutes = bikes.map((b) => ({
    url: `${BASE}/manufacturers/${b.manufacturer.slug}/${b.slug}`,
    priority: 0.5,
  }));

  const newsRoutes = news.map((n) => ({
    url: `${BASE}/news/${n.slug}`,
    lastModified: n.publishedAt,
    priority: 0.6,
  }));

  return [...staticRoutes, ...manufacturerRoutes, ...bikeRoutes, ...newsRoutes];
}
