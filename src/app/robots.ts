import type { MetadataRoute } from "next";

const BASE = process.env.SITE_URL ?? "https://motocodex.net";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep the internal API surface out of search indexes.
      disallow: ["/api/"],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
