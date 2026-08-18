import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Static export has no server, so these must be emitted at build time.
export const dynamic = "force-static";

const BASE = SITE_URL;

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
